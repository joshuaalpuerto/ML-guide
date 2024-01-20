from crew_ai.config import config
from crewai import Crew, Process
from langchain_community.chat_models.fireworks import ChatFireworks
from langchain.globals import set_llm_cache, set_debug
from langchain.cache import InMemoryCache
from textwrap import dedent

from agent import Agents
from tasks import Tasks

set_llm_cache(InMemoryCache())
# Turn this on only if you want to debug other wise it's hard to see the conversations.
set_debug(True)

llm = ChatFireworks(
    model="accounts/fireworks/models/mistral-7b-instruct-4k",
    fireworks_api_key=config.FIREWORKS_API_KEY,
    model_kwargs={"temperature": 0.1, "max_tokens": 4096},
)

if __name__ == "__main__":
    print("## Welcome to Trip Planner Crew")
    print("-------------------------------")
    # origin = input(
    #     dedent(
    #         """
    #     What is your current location?(City, Country)
    #     """
    #     )
    # )
    # destination = input(
    #     dedent(
    #         """
    #     Where do you want to go?(City, Country) (optional)
    #     """
    #     )
    # )
    # date_range = input(
    #     dedent(
    #         """
    #     What is the date range you are interested in traveling? (YYYY-MM-DD - YYYY-MM-DD)
    #     """
    #     )
    # )
    # interests = input(
    #     dedent(
    #         """
    #     What are some of your high level interests and hobbies? (History, Food, etc.)
    #     """
    #     )
    # )
    origin = "Tallinn, Estonia"
    destination = "Madrid, Spain"
    date_range = "2024-04-01 - 2024-04-10"
    interests = "history, food, local experience"

    agents = Agents(llm=llm, verbose=True)
    tasks = Tasks()

    flight_researcher = agents.flight_researcher()
    local_expert = agents.local_expert()
    travel_planner = agents.travel_concierge()

    flight_research_task = tasks.get_cheapest_flight(
        agent=flight_researcher,
        origin=origin,
        destination=destination,
        date_range=date_range,
        interests=interests,
    )
    gather_destination_information_task = tasks.gather_destination_information(
        agent=local_expert,
        origin=origin,
        destination=destination,
        date_range=date_range,
        interests=interests,
    )
    create_itinerary_task = tasks.create_itenirary(
        agent=local_expert,
        destination=destination,
        date_range=date_range,
        interests=interests,
    )

    # Instantiate your crew with a sequential process
    crew = Crew(
        agents=[flight_researcher, local_expert, travel_planner],
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
