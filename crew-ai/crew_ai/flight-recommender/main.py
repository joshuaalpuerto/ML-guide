from crew_ai.config import config
from crewai import Crew, Process
from langchain_community.chat_models.fireworks import ChatFireworks
from langchain.globals import set_llm_cache, set_debug
from langchain.cache import InMemoryCache

from agent import Agents
from tasks import Tasks

set_llm_cache(InMemoryCache())
# Turn this on only if you want to debug other wise it's hard to see the conversations.
set_debug(True)

llm = ChatFireworks(
    model="accounts/fireworks/models/mistral-7b-instruct-4k",
    fireworks_api_key=config.FIREWORKS_API_KEY,
    model_kwargs={"temperature": 0.5, "max_tokens": 4096},
)

if __name__ == "__main__":
    # query = input("""Please enter your travel infomration:""")
    query = "I want to go to Paris on April 10, 2024. Currently I'm in Boston."

    agents = Agents(llm=llm, verbose=True)
    tasks = Tasks()

    researcher = agents.researcher()
    travel_agent = agents.travel_agent()

    research_task = tasks.research(query=query, agent=researcher)
    suggest_task = tasks.suggest(agent=travel_agent)

    # Instantiate your crew with a sequential process
    crew = Crew(
        agents=[agents.researcher(), agents.travel_agent()],
        tasks=[research_task, suggest_task],
        verbose=2,  # Crew verbose more will let you know what tasks are being worked on, you can set it to 1 or 2 to different logging levels
        process=Process.sequential,  # Sequential process will have tasks executed one after the other and the outcome of the previous one is passed as extra content into this next.
    )

    # Get your crew to work!
    crew.kickoff()
