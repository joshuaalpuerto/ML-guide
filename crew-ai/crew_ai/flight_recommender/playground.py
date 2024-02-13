from crew_ai.config import config
from langchain_community.chat_models.fireworks import ChatFireworks
from langchain.globals import set_llm_cache, set_debug
from langchain.cache import InMemoryCache
import logging
from textwrap import dedent
from langchain_community.tools.ddg_search.tool import DuckDuckGoSearchResults
from tools.search_internet import SearchInternet

logging.basicConfig(
    level=logging.DEBUG, format="%(name)s - %(levelname)s - %(message)s"
)

from tools.search_internet import SearchInternet

set_llm_cache(InMemoryCache())
# Turn this on only if you want to debug other wise it's hard to see the conversations.
set_debug(True)

llm = ChatFireworks(
    model="accounts/fireworks/models/mistral-7b-instruct-4k",
    fireworks_api_key=config.FIREWORKS_API_KEY,
    model_kwargs={"temperature": 0.1, "max_tokens": 4096},
)

if __name__ == "__main__":
    scraper = SearchInternet(llm=llm, human_interests="history, food, local experience")

    observation = scraper.run(
        "Weather in Manila, Philippines from April 1 to April 5, 2024"
    )

    print("observations", observation)
