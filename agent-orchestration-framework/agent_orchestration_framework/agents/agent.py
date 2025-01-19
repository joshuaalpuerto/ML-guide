from typing import Dict, List, Union, AsyncIterable, Optional, Any
from dataclasses import dataclass
from agent_orchestration_framework.types import (
    ConversationMessage,
    ParticipantRole,
    TemplateVariables,
)
from agent_orchestration_framework.tools.tool import (
    Tool,
)
from agent_orchestration_framework.utils import Logger


@dataclass
class AgentOptions:
    name: str
    description: str
    # TODO: for now None but this is required.
    # Check how to create typing which is an instance of a Model (OpenAI Compatible?)
    model: None
    streaming: Optional[bool] = None
    tools: Optional[List[Tool]] = None


class Agent:
    def __init__(self, options: AgentOptions):
        super().__init__(options)

        self.id = self.generate_key_from_name(options.name)
        self.name = options.name
        self.description = options.description
        self.model = options.model
        self.streaming = options.streaming or False

        # Initialize system prompt
        self.system_prompt = f"""You are a {self.name}.
        {self.description} Provide helpful and accurate information based on your expertise.
        You will engage in an open-ended conversation, providing helpful and accurate information based on your expertise.
        The conversation will proceed as follows:
        - The human may ask an initial question or provide a prompt on any topic.
        - You will provide a relevant and informative response.
        - The human may then follow up with additional questions or prompts related to your previous response,
          allowing for a multi-turn dialogue on that topic.
        - Or, the human may switch to a completely new and unrelated topic at any point.
        - You will seamlessly shift your focus to the new topic, providing thoughtful and coherent responses
          based on your broad knowledge base.
        Throughout the conversation, you should aim to:
        - Understand the context and intent behind each new question or prompt.
        - Provide substantive and well-reasoned responses that directly address the query.
        - Draw insights and connections from your extensive knowledge when appropriate.
        - Ask for clarification if any part of the question or prompt is ambiguous.
        - Maintain a consistent, respectful, and engaging tone tailored to the human's communication style.
        - Seamlessly transition between topics as the human introduces new subjects."""

    @staticmethod
    def generate_key_from_name(name: str) -> str:
        import re

        # Remove special characters and replace spaces with hyphens
        key = re.sub(r"[^a-zA-Z0-9\s-]", "", name)
        key = re.sub(r"\s+", "-", key)
        return key.lower()

    async def process_request(
        self,
        input_text: str,
        user_id: str,
        session_id: str,
        chat_history: List[ConversationMessage],
        additional_params: Optional[Dict[str, str]] = None,
        logger: Logger = Logger,
    ) -> Union[ConversationMessage, AsyncIterable[Any]]:
        try:

            self.update_system_prompt()

            system_prompt = self.system_prompt

            if self.retriever:
                response = await self.retriever.retrieve_and_combine_results(input_text)
                context_prompt = (
                    "\nHere is the context to use to answer the user's question:\n"
                    + response
                )
                system_prompt += context_prompt

            messages = [
                {"role": "system", "content": system_prompt},
                *[
                    {
                        "role": msg.role.lower(),
                        "content": (
                            msg.content[0].get("text", "") if msg.content else ""
                        ),
                    }
                    for msg in chat_history
                ],
                {"role": "user", "content": input_text},
            ]

            request_options = {
                "model": self.model,
                "messages": messages,
                "max_tokens": self.inference_config.get("maxTokens"),
                "temperature": self.inference_config.get("temperature"),
                "top_p": self.inference_config.get("topP"),
                "stop": self.inference_config.get("stopSequences"),
                "stream": self.streaming,
            }
            if self.streaming:
                return await self.handle_streaming_response(request_options)
            else:
                return await self.handle_single_response(request_options)

        except Exception as error:
            Logger.error(f"Error in OpenAI API call: {str(error)}")
            raise error

    async def handle_single_response(
        self, request_options: Dict[str, Any]
    ) -> ConversationMessage:
        try:
            request_options["stream"] = False
            chat_completion = self.client.chat.completions.create(**request_options)

            if not chat_completion.choices:
                raise ValueError("No choices returned from OpenAI API")

            assistant_message = chat_completion.choices[0].message.content

            if not isinstance(assistant_message, str):
                raise ValueError("Unexpected response format from OpenAI API")

            return ConversationMessage(
                role=ParticipantRole.ASSISTANT.value,
                content=[{"text": assistant_message}],
            )

        except Exception as error:
            Logger.error(f"Error in OpenAI API call: {str(error)}")
            raise error

    async def handle_streaming_response(
        self, request_options: Dict[str, Any]
    ) -> ConversationMessage:
        try:
            stream = self.client.chat.completions.create(**request_options)
            accumulated_message = []

            for chunk in stream:
                if chunk.choices[0].delta.content:
                    chunk_content = chunk.choices[0].delta.content
                    accumulated_message.append(chunk_content)
                    if self.callbacks:
                        self.callbacks.on_llm_new_token(chunk_content)
                    # yield chunk_content

            # Store the complete message in the instance for later access if needed
            return ConversationMessage(
                role=ParticipantRole.ASSISTANT.value,
                content=[{"text": "".join(accumulated_message)}],
            )

        except Exception as error:
            Logger.error(f"Error getting stream from OpenAI model: {str(error)}")
            raise error

    @staticmethod
    def replace_placeholders(template: str, variables: TemplateVariables) -> str:
        import re

        def replace(match):
            key = match.group(1)
            if key in variables:
                value = variables[key]
                return "\n".join(value) if isinstance(value, list) else str(value)
            return match.group(0)

        return re.sub(r"{{(\w+)}}", replace, template)
