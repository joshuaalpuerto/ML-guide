from typing import Dict, Any, AsyncIterable, Optional, Union
from dataclasses import dataclass, fields, asdict, replace
import time

from agent_orchestration_framework.types import (
    ConversationMessage,
    ParticipantRole,
    OrchestratorConfig,
)
from agent_orchestration_framework.utils import Logger


@dataclass
class MultiAgentOrchestrator:
    def __init__(
        self,
        options: Optional[OrchestratorConfig] = None,
        storage=None,
        logger=None,
        # Orchastrator where other agents will be added automatically to it's tools
        # By default none and we will create it.
        manager=None,
    ):

        DEFAULT_CONFIG = OrchestratorConfig()

        if options is None:
            options = {}
        if isinstance(options, dict):
            # Filter out keys that are not part of OrchestratorConfig fields
            valid_keys = {f.name for f in fields(OrchestratorConfig)}
            options = {k: v for k, v in options.items() if k in valid_keys}
            options = OrchestratorConfig(**options)
        elif not isinstance(options, OrchestratorConfig):
            raise ValueError(
                "options must be a dictionary or an OrchestratorConfig instance"
            )

        self.config = replace(DEFAULT_CONFIG, **asdict(options))
        self.storage = storage

        self.logger = Logger(self.config, logger)
        self.agents: Dict[str] = {}
        self.storage = storage

        self.execution_times: Dict[str, float] = {}
        self.default_agent = default_agent or self.get_default_agent()

    def create_manager_agent(self):
        from agent_orchestration_framework.agents.agent import Agent, AgentOptions

        manager_agent = Agent(
            AgentOptions(
                name="Manager",
                description="Manager agent to manage other agents",
                model=None,
                streaming=False,
                tools=[],
            )
        )
        self.add_agent(manager_agent)

    def add_agent(self, agent):
        if agent.id in self.agents:
            raise ValueError(f"An agent with ID '{agent.id}' already exists.")
        self.agents[agent.id] = agent
        self.classifier.set_agents(self.agents)

    def get_all_agents(self) -> Dict[str, Dict[str, str]]:
        return {
            key: {"name": agent.name, "description": agent.description}
            for key, agent in self.agents.items()
        }

    async def dispatch_to_agent(
        self, params: Dict[str, Any]
    ) -> Union[ConversationMessage, AsyncIterable[Any]]:
        user_input = params["user_input"]
        user_id = params["user_id"]
        session_id = params["session_id"]
        classifier_result = params["classifier_result"]
        additional_params = params.get("additional_params", {})

        if not classifier_result.selected_agent:
            return "I'm sorry, but I need more information to understand your request. \
                Could you please be more specific?"

        selected_agent = classifier_result.selected_agent
        agent_chat_history = await self.storage.fetch_chat(
            user_id, session_id, selected_agent.id
        )

        self.logger.print_chat_history(agent_chat_history, selected_agent.id)

        response = await self.measure_execution_time(
            f"Agent {selected_agent.name} | Processing request",
            lambda: selected_agent.process_request(
                user_input, user_id, session_id, agent_chat_history, additional_params
            ),
        )

        return response

    async def agent_process_request(
        self,
        user_input: str,
        user_id: str,
        session_id: str,
        classifier_result,
        additional_params: Dict[str, str] = {},
    ):
        """Process agent response and handle chat storage."""
        try:
            agent_response = await self.dispatch_to_agent(
                {
                    "user_input": user_input,
                    "user_id": user_id,
                    "session_id": session_id,
                    "classifier_result": classifier_result,
                    "additional_params": additional_params,
                }
            )

            metadata = self.create_metadata(
                classifier_result, user_input, user_id, session_id, additional_params
            )

            await self.save_message(
                ConversationMessage(
                    role=ParticipantRole.USER.value, content=[{"text": user_input}]
                ),
                user_id,
                session_id,
                classifier_result.selected_agent,
            )

            if isinstance(agent_response, ConversationMessage):
                await self.save_message(
                    agent_response,
                    user_id,
                    session_id,
                    classifier_result.selected_agent,
                )

            # TODO: return this later as class `AgentResponse`
            return {
                "metadata": metadata,
                "output": agent_response,
                "streaming": classifier_result.selected_agent.is_streaming_enabled(),
            }

        except Exception as error:
            self.logger.error(f"Error during agent processing: {str(error)}")
            raise error

    async def route_request(
        self,
        user_input: str,
        user_id: str,
        session_id: str,
        additional_params: Dict[str, str] = {},
    ):
        """Route user request to appropriate agent."""
        self.execution_times.clear()

        try:
            classifier_result = await self.classify_request(
                user_input, user_id, session_id
            )

            if not classifier_result.selected_agent:
                # TODO: return this later as class `AgentResponse`
                return {
                    "metadata": self.create_metadata(
                        classifier_result,
                        user_input,
                        user_id,
                        session_id,
                        additional_params,
                    ),
                    "output": ConversationMessage(
                        role=ParticipantRole.ASSISTANT.value,
                        content=[{"text": self.config.NO_SELECTED_AGENT_MESSAGE}],
                    ),
                    "streaming": False,
                }

            return await self.agent_process_request(
                user_input, user_id, session_id, classifier_result, additional_params
            )

        except Exception as error:
            # TODO: return this later as class `AgentResponse`
            return {
                "metadata": self.create_metadata(
                    None, user_input, user_id, session_id, additional_params
                ),
                "output": self.config.GENERAL_ROUTING_ERROR_MSG_MESSAGE or str(error),
                "streaming": False,
            }

        finally:
            self.logger.print_execution_times(self.execution_times)

    def print_intent(self, user_input: str, intent_classifier_result) -> None:
        """Print the classified intent."""
        self.logger.log_header("Classified Intent")
        self.logger.info(f"> Text: {user_input}")
        selected_agent_string = (
            intent_classifier_result.selected_agent.name
            if intent_classifier_result.selected_agent
            else "No agent selected"
        )
        self.logger.info(f"> Selected Agent: {selected_agent_string}")
        self.logger.info(f"> Confidence: {intent_classifier_result.confidence:.2f}")
        self.logger.info("")

    async def measure_execution_time(self, timer_name: str, fn):
        if not self.config.LOG_EXECUTION_TIMES:
            return await fn()

        start_time = time.time()
        self.execution_times[timer_name] = start_time

        try:
            result = await fn()
            end_time = time.time()
            duration = end_time - start_time
            self.execution_times[timer_name] = duration
            return result
        except Exception as error:
            end_time = time.time()
            duration = end_time - start_time
            self.execution_times[timer_name] = duration
            raise error

    def create_metadata(
        self,
        intent_classifier_result,
        user_input: str,
        user_id: str,
        session_id: str,
        additional_params: Dict[str, str],
    ):
        # TODO: return this as `AgentProcessingResult`
        base_metadata = {
            "user_input": user_input,
            "agent_id": "no_agent_selected",
            "agent_name": "No Agent",
            "user_id": user_id,
            "session_id": session_id,
            "additional_params": additional_params,
        }

        if not intent_classifier_result or not intent_classifier_result.selected_agent:
            base_metadata.additional_params["error_type"] = "classification_failed"
        else:
            base_metadata.agent_id = intent_classifier_result.selected_agent.id
            base_metadata.agent_name = intent_classifier_result.selected_agent.name

        return base_metadata

    def get_fallback_result(self):
        # TODO: Return this as ClassifierResult
        return {"selected_agent": self.get_default_agent(), "confidence": 0}

    async def save_message(
        self, message: ConversationMessage, user_id: str, session_id: str, agent
    ):
        if agent and agent.save_chat:
            return await self.storage.save_chat_message(
                user_id,
                session_id,
                agent.id,
                message,
                self.config.MAX_MESSAGE_PAIRS_PER_AGENT,
            )
