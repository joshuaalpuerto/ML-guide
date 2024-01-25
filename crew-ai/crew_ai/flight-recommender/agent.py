from crewai import Agent
from tools.amadeus_tool import GetFlightOffers
from tools.search_internet import SearchInternet

get_flight_offers = GetFlightOffers()


class Agents:
    def __init__(self, *, llm, verbose):
        self.llm = llm
        self.verbose = verbose

    def flight_researcher(self, allow_delegation=False, max_iter=5):
        return Agent(
            role="Flight researcher",
            goal="Get the BEST flight date and affordable price informations.",
            backstory="""Your expertise lies on gathering informations about best flight date and  affordable price. You also strictly translate the user query into the correct arguments for the function `get_flight_offers`""",
            tools=[get_flight_offers],
            llm=self.llm,
            verbose=self.verbose,
            allow_delegation=allow_delegation,
            max_iter=max_iter,
        )

    def travel_agent(self, allow_delegation=False):
        get_destination_information = SearchInternet(llm=self.llm)
        return Agent(
            role="Destination researcher",
            goal="Provide the latest and BEST travel insights about the destination city.",
            backstory="""A resourceful travel researcher with extensive information
        about the city, it's attractions and customs.""",
            llm=self.llm,
            tools=[
                get_destination_information,
            ],
            verbose=self.verbose,
            allow_delegation=allow_delegation,
        )

    def travel_concierge(self, allow_delegation=False):
        return Agent(
            role="Travel Planner",
            goal="""Create the most amazing travel itineraries base on flight details and information about the destination city.""",
            backstory="""Specialist in travel planning and logistics with 
            decades of experience. """,
            llm=self.llm,
            verbose=self.verbose,
            allow_delegation=allow_delegation,
        )
