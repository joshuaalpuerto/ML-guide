import os
from crew_ai.config import config
from crewai import Agent, Task, Crew, Process

from langchain_community.chat_models.fireworks import ChatFireworks
from langchain.globals import set_llm_cache, set_debug
from langchain.cache import InMemoryCache

from tools.amadeus_tool import GetFlightOffers

set_llm_cache(InMemoryCache())
# Turn this on only if you want to debug other wise it's hard to see the conversations.
set_debug(True)

llm = ChatFireworks(
    model="accounts/fireworks/models/mistral-7b-instruct-4k",
    fireworks_api_key=config.FIREWORKS_API_KEY,
    model_kwargs={"temperature": 0.5, "max_tokens": 4096},
)


if __name__ == "__main__":
    search_flight_offers_with_amadeus_client_tool = GetFlightOffers()
    search_flight_offers_with_amadeus_client_tool.run({
        "originLocationCode":"BOS",
        "destinationLocationCode":"PAR",
        "departureDate":"2024-01-30",
        "returnDate":"2024-02-14",
        "adults":1,
        "returnDate":None,
        "children":None,
        "infants":None,
        "travelClass":None,
        "includedAirlineCodes":None,
        "excludedAirlineCodes":None,
        "nonStop":"false",
        "currencyCode":"EUR",
        "maxPrice":None,
        "max":5,
    })

