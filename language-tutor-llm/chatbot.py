from langchain.globals import set_llm_cache, set_debug
from langchain.cache import InMemoryCache
from langchain.chains import LLMChain
from langchain.memory import ConversationSummaryMemory
from langchain.prompts import PromptTemplate
from langchain.llms import Fireworks

import constants
import prompts.mistral as prompts

set_llm_cache(InMemoryCache())
# Turn this on only if you want to debug other wise it's hard to see the conversations.
set_debug(constants.LLM_DEBUG)


class Chatbot:
    """
    This class is used to communicate with the tutor
    """

    def __init__(
        self,
        model="accounts/fireworks/models/mixtral-8x7b-instruct",
        prompts=prompts,
        language="Spanish",
        verbose=True,
    ):
        self.prompts = prompts
        self.llm = Fireworks(
            fireworks_api_key=constants.FIREWORKS_API_KEY,
            model=model,
            model_kwargs={"temperature": 0.1, "max_tokens": 1024, "top_p": 0.9},
        )
        self.language = language
        self.verbose = verbose

        self.memory = ConversationSummaryMemory(
            llm=self.llm,
            prompt=PromptTemplate(
                input_variables=["summary", "new_lines"],
                template=self.prompts.DEFAULT_SUMMARIZER_TEMPLATE,
            ),
            return_messages=True,
        )

    def get_response(
        self,
        input,
    ):
        chat_history = self.memory.buffer
        output = self._generate(input, chat_history)

        # save the conversations so we can compute the summary and use it for the next round
        self.memory.save_context({"input": input}, {"output": output})

        return output

    def _generate(self, input, chat_history):
        # Use the standard chain instead of ConversationChain because if we have more variables it's hard to use the helper
        llm_chain = LLMChain(
            llm=self.llm,
            prompt=PromptTemplate(
                input_variables=["chat_history", "input"],
                template=self.prompts.SYSTEM_PROMPT,
            ),
            verbose=self.verbose,
        )

        return llm_chain.predict(
            input=input, chat_history=chat_history, language=self.language
        )
