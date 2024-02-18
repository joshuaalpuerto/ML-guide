from crewai import Agent
from tools.amadeus_tool import GetFlightOffers
from tools.search_internet import SearchInternet
from langchain.tools.render import format_tool_to_openai_function

get_flight_offers = GetFlightOffers()


def _initialize_function_calling_llm(function_calling_llm, tools):
    function_calling_llm = (
        function_calling_llm.bind_tools(tools=tools)
        if function_calling_llm is not None
        else None
    )

    return (tools, function_calling_llm)


class Agents:
    def __init__(self, *, llm, verbose):
        self.llm = llm
        self.verbose = verbose

    def flight_researcher(
        self, allow_delegation=False, max_iter=5, function_calling_llm=None
    ):
        (tools, function_calling_llm) = _initialize_function_calling_llm(
            function_calling_llm, [get_flight_offers]
        )

        return Agent(
            role="Flight researcher",
            goal="""Provide the BEST flight informations according to shortest travel time and price.""",
            backstory="""Your expertise lies on gathering informations flight information. """,
            tools=tools,
            llm=self.llm,
            function_calling_llm=function_calling_llm,
            verbose=self.verbose,
            allow_delegation=allow_delegation,
            max_iter=max_iter,
        )

    def travel_agent(
        self, allow_delegation=False, max_iter=5, function_calling_llm=None
    ):
        get_destination_information = SearchInternet(llm=self.llm)
        (tools, function_calling_llm) = _initialize_function_calling_llm(
            function_calling_llm, [get_destination_information]
        )
        return Agent(
            role="Destination researcher",
            goal="""Provide the latest and BEST travel insights about the destination city.""",
            backstory="""A resourceful travel researcher with extensive information about the city, it's attractions and customs.""",
            llm=self.llm,
            function_calling_llm=function_calling_llm,
            tools=tools,
            verbose=self.verbose,
            allow_delegation=allow_delegation,
            max_iter=max_iter,
        )

    def travel_concierge(self, allow_delegation=False, max_iter=5):
        return Agent(
            role="Travel Planner",
            goal="""Create the most amazing travel itineraries base on flight details and information about the destination city.""",
            backstory="""Specialist in travel planning and logistics with decades of experience. """,
            llm=self.llm,
            verbose=self.verbose,
            allow_delegation=allow_delegation,
            max_iter=max_iter,
        )
