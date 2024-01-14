from crewai import Agent as BaseAgent
from tools.amadeus_tool import GetFlightOffers


class Agents:
    def __init__(self, *, llm, verbose):
        self.llm = llm
        self.verbose = verbose

    def researcher(self, allow_delegation=False):
        return BaseAgent(
            role="Flight data researcher",
            goal="Get list of cheap flights data that the Travel agent can use.",
            backstory="""You are a Flight data researcher. Your expertise lies on gathering information about cheap flights. You also strictly translate the user query into the correct arguments for the function `get_flight_offers`""",
            tools=[GetFlightOffers()],
            llm=self.llm,
            verbose=self.verbose,
            allow_delegation=allow_delegation,
        )

    def travel_agent(
        self,
        allow_delegation=False,
    ):
        return BaseAgent(
            role="Travel agent",
            goal="Using Provide the best iterenary best on number of layovers and schedule closest to the user travel date. You don't have access to any tools so you have to rely ONLY on context you have.",
            backstory="""You are a knowledgeable travel consultant and will provide helpful suggestion to user travel needs.""",
            llm=self.llm,
            verbose=self.verbose,
            allow_delegation=allow_delegation,
        )
