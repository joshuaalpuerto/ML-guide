from langchain_community.chat_models.fireworks import ChatFireworks
import config


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
