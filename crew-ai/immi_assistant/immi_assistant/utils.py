from langchain_community.chat_models.fireworks import ChatFireworks
from langchain_openai import ChatOpenAI
from crew_ai.config import config


def get_llm(
    model="accounts/fireworks/models/mixtral-8x7b-instruct",
    fireworks_api_key=None,
    callbacks=None,
):
    return ChatFireworks(
        model=model,
        fireworks_api_key=fireworks_api_key or config.FIREWORKS_API_KEY,
        model_kwargs={"temperature": 0.1, "max_tokens": 4096},
        callbacks=callbacks,
    )


def get_function_calling_llm(
    model="accounts/fireworks/models/firefunction-v2",
    fireworks_api_key=None,
    callbacks=None,
):
    return ChatOpenAI(
        model=model,
        openai_api_key=fireworks_api_key or config.FIREWORKS_API_KEY,
        openai_api_base="https://api.fireworks.ai/inference/v1",
        temperature=0,
        max_tokens=1024,
        callbacks=callbacks,
    )
