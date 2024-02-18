from langchain_community.chat_models.fireworks import ChatFireworks
from langchain_openai import ChatOpenAI
from crew_ai.config import config


def get_llm(model="accounts/fireworks/models/mixtral-8x7b-instruct", callbacks=None):
    return ChatFireworks(
        model=model,
        fireworks_api_key=config.FIREWORKS_API_KEY,
        model_kwargs={"temperature": 0.1, "max_tokens": 4096},
        callbacks=callbacks,
    )


def get_function_calling_llm(
    model="accounts/fireworks/models/fw-function-call-34b-v0", callbacks=None
):
    return ChatOpenAI(
        model=model,
        openai_api_key=config.FIREWORKS_API_KEY,
        openai_api_base="https://api.fireworks.ai/inference/v1",
        temperature=0,
        max_tokens=1024,
        callbacks=None,
    )
