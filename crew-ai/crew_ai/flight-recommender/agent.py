from crewai import Agent
from tools.amadeus_tool import GetFlightOffers
from tools.scraper_tool import Scraper
from langchain_community.tools.ddg_search.tool import DuckDuckGoSearchResults

get_flight_offers = GetFlightOffers()
# Get the snippets + url of base on search
search_tool = DuckDuckGoSearchResults()


class Agents:
    def __init__(self, *, llm, verbose):
        self.llm = llm
        self.verbose = verbose

    def flight_researcher(self, allow_delegation=False):
        return Agent(
            role="Flight researcher",
            goal="Get the a cheap flights data that the Travel agent can use.",
            backstory="""You are a Flight researcher. Your expertise lies on gathering information about cheap flights. You also strictly translate the user query into the correct arguments for the function `get_flight_offers`""",
            tools=[get_flight_offers],
            llm=self.llm,
            verbose=self.verbose,
            allow_delegation=allow_delegation,
        )

    def travel_agent(self, allow_delegation=False):
        website_scrapper = Scraper(llm=self.llm)
        return Agent(
            role="Travel agent",
            goal="Provide the latest and  BEST insights about the destination city.",
            backstory="""A resourceful travel agent with extensive information
        about the city, it's attractions and customs.""",
            llm=self.llm,
            tools=[
                search_tool,
                website_scrapper,
            ],
            verbose=self.verbose,
            allow_delegation=allow_delegation,
        )

    def travel_concierge(self, allow_delegation=False):
        return Agent(
            role="Amazing Travel Concierge",
            goal="""Create the most amazing travel itineraries base on flight details and information about the destination city.""",
            backstory="""Specialist in travel planning and logistics with 
            decades of experience. You don't have access to any tools so you have to rely ONLY on context you have.""",
            llm=self.llm,
            verbose=self.verbose,
            allow_delegation=allow_delegation,
        )
