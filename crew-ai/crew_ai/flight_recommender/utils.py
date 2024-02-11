from langchain_community.chat_models.fireworks import ChatFireworks
from crew_ai.config import config


def get_llm(model="accounts/fireworks/models/mixtral-8x7b-instruct", callbacks=None):
    return ChatFireworks(
        model=model,
        fireworks_api_key=config.FIREWORKS_API_KEY,
        model_kwargs={"temperature": 0.1, "max_tokens": 4096},
        callbacks=callbacks,
    )
