from crew_ai.config import config
from langchain_community.chat_models.fireworks import ChatFireworks
from langchain.globals import set_llm_cache, set_debug
from langchain.cache import InMemoryCache

from tools.scraper_tool import Scraper

set_llm_cache(InMemoryCache())
# Turn this on only if you want to debug other wise it's hard to see the conversations.
set_debug(True)

llm = ChatFireworks(
    model="accounts/fireworks/models/mistral-7b-instruct-4k",
    fireworks_api_key=config.FIREWORKS_API_KEY,
    model_kwargs={"temperature": 0.5, "max_tokens": 4096},
)

if __name__ == "__main__":
    scraper = Scraper(llm=llm)
    input_string = "https://www.kimkim.com/c/highlights-of-estonia-tallinn-tartu-lahemaa-national-park-haapsalu-5-days, https://www.theworldwasherefirst.com/estonia-itinerary/"

    observation = scraper.run(input_string)

    print(observation)
