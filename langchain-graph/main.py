import asyncio
import logging
from typing import List, Sequence

from langgraph.graph import END, MessageGraph
from langgraph.graph import MessageGraph, END

from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.globals import set_llm_cache, set_debug
from langchain.cache import InMemoryCache

from utils import get_llm

logging.basicConfig(
    level=logging.DEBUG, format="%(name)s - %(levelname)s - %(message)s"
)

set_llm_cache(InMemoryCache())
# Turn this on only if you want to debug other wise it's hard to see the conversations.
set_debug(True)


prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an AI assistant researcher tasked with researching on a variety of topics in a short summary of 5 paragraphs."
            " Generate the best research possible as per user request."
            " If the user provides critique, respond with a revised version of your previous attempts.",
        ),
        MessagesPlaceholder(variable_name="messages"),
    ]
)

llm = get_llm()


generate = prompt | llm

reflection_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a senior researcher"
            " Provide detailed recommendations, including requests for length, depth, style, etc."
            " to an asistant researcher to help improve this researches",
        ),
        MessagesPlaceholder(variable_name="messages"),
    ]
)

reflect = reflection_prompt | llm


# Langraph alwayss store the output ot internal state.
# basically state should be a sequence of messages
async def generation_node(state: Sequence[BaseMessage]):
    print("--state--", state)
    res = await generate.ainvoke({"messages": state})

    # this will be treated as a feedback for the generator
    return AIMessage(name="Assisstant researcher", content=res.content)


async def reflection_node(messages: Sequence[BaseMessage]) -> List[BaseMessage]:
    # First message is the original user request. We hold it the same for all nodes
    translated = [messages[0]] + [
        AIMessage(name=msg.name, content=msg.content) for msg in messages[1:]
    ]
    res = await reflect.ainvoke({"messages": translated})

    # this will be treated as a feedback for the generator
    return AIMessage(name="Senior researcher", content=res.content)


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
        [HumanMessage(content="Research on climate change")],
    ):
        print(event)
        print("---")


if __name__ == "__main__":
    asyncio.run(stream_responses())
