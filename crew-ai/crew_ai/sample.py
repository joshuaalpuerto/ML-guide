import os
from crewai import Agent, Task, Crew, Process
from langchain_community.tools.ddg_search.tool import DuckDuckGoSearchResults
from langchain_community.chat_models.fireworks import ChatFireworks
from langchain.globals import set_llm_cache, set_debug
from langchain.cache import InMemoryCache
from crew_ai.config import config

set_llm_cache(InMemoryCache())
# Turn this on only if you want to debug other wise it's hard to see the conversations.
set_debug(True)

search_tool = DuckDuckGoSearchResults()

llm = ChatFireworks(
    model="accounts/fireworks/models/mistral-7b-instruct-4k",
    fireworks_api_key=config.FIREWORKS_API_KEY,
    model_kwargs={"temperature": 0.5, "max_tokens": 4096},
)

# Define your agents with roles and goals
researcher = Agent(
    role="Senior Research Analyst",
    goal="Uncover cutting-edge developments in AI and data science in",
    backstory="""You are a Senior Research Analyst at a leading tech think tank.
  Your expertise lies in identifying emerging trends and technologies in AI and
  data science. You have a knack for dissecting complex data and presenting
  actionable insights.""",
    verbose=True,
    allow_delegation=False,
    tools=[search_tool],
    llm=llm,
)
writer = Agent(
    role="Tech Content Strategist",
    goal="Craft compelling content on tech advancements",
    backstory="""You are a renowned Tech Content Strategist, known for your insightful
  and engaging articles on technology and innovation. With a deep understanding of
  the tech industry, you transform complex concepts into compelling narratives.""",
    verbose=True,
    llm=llm,
    allow_delegation=True,
)

# Create tasks for your agents
task1 = Task(
    description="""Conduct a comprehensive analysis of the latest advancements in AI in 2024.
  Identify key trends, breakthrough technologies, and potential industry impacts.
  Compile your findings in a detailed report. Your final answer MUST be a full analysis report""",
    agent=researcher,
)

task2 = Task(
    description="""Using the insights from the researcher's report, develop an engaging blog
  post that highlights the most significant AI advancements.
  Your post should be informative yet accessible, catering to a tech-savvy audience.
  Aim for a narrative that captures the essence of these breakthroughs and their
  implications for the future. Your final answer MUST be the full blog post of at least 3 paragraphs.""",
    agent=writer,
)


if __name__ == "__main__":
    # # Instantiate your crew with a sequential process
    # crew = Crew(
    #     agents=[researcher, writer],
    #     tasks=[task1, task2],
    #     verbose=2,  # Crew verbose more will let you know what tasks are being worked on, you can set it to 1 or 2 to different logging levels
    #     process=Process.sequential,  # Sequential process will have tasks executed one after the other and the outcome of the previous one is passed as extra content into this next.
    # )

    # # Get your crew to work!
    # crew.kickoff()
    search_tool.run("10 day itinerary trip for Madrid")
