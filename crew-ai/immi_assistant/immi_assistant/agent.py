from crewai import Agent
from tools.search_internet import SearchInternet
from langchain.tools.render import format_tool_to_openai_function


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

    def visa_information_researcher(
        self, allow_delegation=False, max_iter=5, function_calling_llm=None
    ):
        get_destination_information = SearchInternet(llm=self.llm)
        (tools, function_calling_llm) = _initialize_function_calling_llm(
            function_calling_llm, [get_destination_information]
        )
        return Agent(
            role="Destination visa researcher",
            goal="""Provide the latest visa information to the destination country""",
            backstory="""A resourceful visa researcher with extensive information about the destination country.""",
            llm=self.llm,
            function_calling_llm=function_calling_llm,
            tools=tools,
            verbose=self.verbose,
            allow_delegation=allow_delegation,
            max_iter=max_iter,
        )

    # def travel_concierge(self, allow_delegation=False, max_iter=5):
    #     return Agent(
    #         role="Travel Planner",
    #         goal="""Create the most amazing travel itineraries base on flight details and information about the destination city.""",
    #         backstory="""Specialist in travel planning and logistics with decades of experience. """,
    #         llm=self.llm,
    #         verbose=self.verbose,
    #         allow_delegation=allow_delegation,
    #         max_iter=max_iter,
    #     )
