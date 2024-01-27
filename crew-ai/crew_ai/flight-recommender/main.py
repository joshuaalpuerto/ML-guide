from crew_ai.config import config
from crewai import Crew, Process
from langchain_community.chat_models.fireworks import ChatFireworks
from langchain.globals import set_llm_cache, set_debug
from langchain.cache import InMemoryCache
import logging

from agent import Agents
from tasks import Tasks

logging.basicConfig(
    level=logging.DEBUG, format="%(name)s - %(levelname)s - %(message)s"
)

set_llm_cache(InMemoryCache())
# Turn this on only if you want to debug other wise it's hard to see the conversations.
set_debug(True)

cheaper_llm = ChatFireworks(
    model="accounts/fireworks/models/mistral-7b-instruct-4k",
    fireworks_api_key=config.FIREWORKS_API_KEY,
    model_kwargs={"temperature": 0.1, "max_tokens": 4096},
)

capable_llm = ChatFireworks(
    model="accounts/fireworks/models/mixtral-8x7b-instruct",
    fireworks_api_key=config.FIREWORKS_API_KEY,
    model_kwargs={"temperature": 0.1, "max_tokens": 4096},
)

if __name__ == "__main__":
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

    cheaper_agents = Agents(llm=cheaper_llm, verbose=True)
    capable_agents = Agents(llm=capable_llm, verbose=True)

    tasks = Tasks()

    # this has a simple task so we can use a smaller model
    flight_researcher = capable_agents.flight_researcher()
    # this has a simple task so we can use a smaller model
    travel_agent = capable_agents.travel_agent()

    # this requires a more capable model as it will delegate tasks to other agents
    travel_planner = capable_agents.travel_concierge(allow_delegation=True)

    flight_research_task = tasks.get_cheapest_flight(
        agent=flight_researcher,
        origin=origin,
        destination=destination,
        date_range=date_range,
        interests=interests,
    )
    gather_destination_information_task = tasks.gather_destination_information(
        agent=travel_agent,
        origin=origin,
        destination=destination,
        date_range=date_range,
        interests=interests,
    )
    create_itinerary_task = tasks.create_itenirary(
        agent=travel_planner,
        destination=destination,
        date_range=date_range,
        interests=interests,
    )

    # Instantiate your crew with a sequential process
    crew = Crew(
        agents=[flight_researcher, travel_agent, travel_planner],
        tasks=[
            flight_research_task,
            gather_destination_information_task,
            create_itinerary_task,
        ],
        verbose=2,  # Crew verbose more will let you know what tasks are being worked on, you can set it to 1 or 2 to different logging levels
        process=Process.sequential,  # Sequential process will have tasks executed one after the other and the outcome of the previous one is passed as extra content into this next.
    )

    # Get your crew to work!
    crew.kickoff()
