from langchain.globals import set_llm_cache, set_debug
from langchain.cache import InMemoryCache
from langchain.callbacks import StdOutCallbackHandler
import logging
from utils import get_llm, get_function_calling_llm

from agent import Agents
from tasks import Tasks
from travel_buddy import TravelBuddy

logging.basicConfig(
    level=logging.DEBUG, format="%(name)s - %(levelname)s - %(message)s"
)

set_llm_cache(InMemoryCache())
# Turn this on only if you want to debug other wise it's hard to see the conversations.
set_debug(True)

if __name__ == "__main__":
    cheaper_llm = get_llm(
        model="accounts/fireworks/models/mistral-7b-instruct-4k",
        callbacks=[StdOutCallbackHandler()],
    )

    capable_llm = get_llm(
        callbacks=[StdOutCallbackHandler()],
    )

    # this is expensive so better to use just mixtral8x
    function_calling_llm = get_function_calling_llm(
        callbacks=[StdOutCallbackHandler()],
    )

    cheaper_agents = Agents(llm=cheaper_llm, verbose=True)
    capable_agents = Agents(llm=capable_llm, verbose=True)
    tasks = Tasks()

    origin = "Tallinn, Estonia"
    destination = "Madrid, Spain"
    date_range = "2024-04-01 - 2024-04-05"
    interests = "history, food, local experience"

    print("## Welcome to Trip Planner Crew")
    print("-------------------------------")
    print(f"origin: {origin}")
    print(f"destination: {destination}")
    print(f"date_range: {date_range}")
    print(f"interests: {interests}")

    travel_buddy = TravelBuddy(
        origin=origin,
        destination=destination,
        date_range=date_range,
        interests=interests,
    )

    # add flight researcher
    flight_researcher = capable_agents.flight_researcher()
    travel_buddy.add_agent(agent=flight_researcher, task=tasks.get_cheapest_flight)

    # add add information gatherer
    # this has a simple task so we can use a smaller model
    travel_agent = capable_agents.travel_agent(max_iter=10)
    travel_buddy.add_agent(
        agent=travel_agent, task=tasks.gather_destination_information
    )

    # this requires a more capable model as it will delegate tasks to other agents
    travel_planner = capable_agents.travel_concierge(allow_delegation=True)
    travel_buddy.add_agent(agent=travel_planner, task=tasks.create_itenirary)

    travel_buddy.execute()
