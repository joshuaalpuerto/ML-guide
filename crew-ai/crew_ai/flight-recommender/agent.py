from crewai import Agent
import tools


class Agents:
    def __init__(self, *, llm, verbose):
        self.llm = llm
        self.llm = verbose

    def researcher(self):
        return Agent(
            role="Flight data researcher",
            goal="Get list of cheap flights data that the Travel agent can use.",
            backstory="""You are a Flight data researcher. Your expertise lies on gathering information about cheap flights. You also strictly translate the user query into the correct arguments for the function `search_flight_offers_with_amadeus_client`""",
            tools=[tools.search_flight_offers_with_amadeus_client],
            llm=self.llm,
            verbose=self.verbose,
        )

    def travel_agent(self):
        return Agent(
            role="Travel agent",
            goal="Provide the BEST insights about the selected city",
            backstory="""You are a knowledgeable travel consultant and will provide helpful suggestion to user travel needs.""",
            llm=self.llm,
            verbose=self.verbose,
        )
