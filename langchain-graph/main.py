import asyncio
import logging
from typing import List, Sequence
from textwrap import dedent

from langgraph.graph import END, MessageGraph
from langgraph.graph import MessageGraph, END

from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.globals import set_llm_cache, set_debug
from langchain.cache import InMemoryCache

from utils import get_llm, generate

logging.basicConfig(
    level=logging.DEBUG, format="%(name)s - %(levelname)s - %(message)s"
)

set_llm_cache(InMemoryCache())
# Turn this on only if you want to debug other wise it's hard to see the conversations.
set_debug(True)


# Langraph alwayss store the output ot internal state.
# basically state should be a sequence of messages
async def generation_node(messages: Sequence[BaseMessage]):
    role = "Assisstant researcher"
    # We cannot use Chat prompt as we cannot change their prefix(human and ai is only supported).
    formatted_messages = [f"{msg.name}: {msg.content}\n" for msg in messages]
    conversation_history = "".join(formatted_messages)
    result = generate(
        backstory=f"You are an {role} tasked with researching on a variety of topics in a short summary of 5 paragraphs.",
        goal=(
            "Generate the best research possible as per user request. "
            "If you are given feedback, revise your previous attempts accordingly."
        ),
        messages=conversation_history,
    )

    # this will be treated as a feedback for the generator
    return AIMessage(name=role, content=result)


async def reflection_node(messages: Sequence[BaseMessage]) -> List[BaseMessage]:
    role = "Senior researcher"
    # First message is the original user request. We hold it the same for all nodes
    human_message = messages[0]
    formatted_messages = [f"{human_message.name}: {human_message.content}\n"] + [
        f"{msg.name}: {msg.content}\n" for msg in messages[1:]
    ]
    conversation_history = "".join(formatted_messages)
    result = generate(
        backstory=f"You are a {role}",
        goal=(
            "Analyze and provide detailed recommendations, "
            "including requests for length, depth, style, etc. "
            "to assistant researcher to help improve the answer. "
            "If you are satisfied just answer: `ALL_GOOD`"
        ),
        messages=conversation_history,
    )

    # this will be treated as a feedback for the generator
    return AIMessage(name=role, content=result)


builder = MessageGraph()
builder.add_node("generate", generation_node)
builder.add_node("reflect", reflection_node)
builder.set_entry_point("generate")


def should_continue(state: List[BaseMessage]):
    if len(state) > 6:
        # End after 5 iterations
        return END
    return "reflect"


builder.add_conditional_edges("generate", should_continue)
builder.add_edge("reflect", "generate")
graph = builder.compile()


async def stream_responses():
    async for event in graph.astream(
        [HumanMessage(content="Research on climate change", name="Human")],
    ):
        print(event)
        print("---")


if __name__ == "__main__":
    asyncio.run(stream_responses())
