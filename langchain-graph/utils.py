from langchain import PromptTemplate
from langchain_community.chat_models.fireworks import ChatFireworks
from langchain_fireworks import Fireworks
import config


def get_llm(
    model="accounts/fireworks/models/mixtral-8x7b-instruct",
    fireworks_api_key=None,
    callbacks=None,
):
    return ChatFireworks(
        model=model,
        fireworks_api_key=fireworks_api_key or config.FIREWORKS_API_KEY,
        model_kwargs={"temperature": 0, "max_tokens": 4096},
        callbacks=callbacks,
    )


def generate(backstory=None, goal=None, messages=None):
    TEMPLATE = (
        f"{str(backstory)}.\n"
        f"{str(goal)}.\n\n"
        "Please use the context below to improve your answer.\n\n"
        "### Context\n"
        f"{str(messages)}\n\n"
        "### Answer"
    )

    prompt = PromptTemplate(template=TEMPLATE, input_variables=["input"])

    # Initialize a Fireworks chat model
    # For function calling we cannot use ChatFireworks integration as it doesn't properly pass functions
    mixtral_llm = Fireworks(
        model="accounts/fireworks/models/mixtral-8x7b-instruct",
        fireworks_api_key=config.FIREWORKS_API_KEY,
        base_url="https://api.fireworks.ai/inference/v1/completions",
        temperature=0,
        max_tokens=4096,
    )

    chain = prompt | mixtral_llm

    return chain.invoke(
        {
            "messages": messages,
        }
    )
