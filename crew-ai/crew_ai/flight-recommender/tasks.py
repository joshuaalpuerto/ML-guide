from crewai import Task
from textwrap import dedent
from datetime import date


class Tasks:
    def research(self, query, agent):
        return Task(
            description=dedent(
                f"""Analyze the user query about its trip and conduct a comprehensive research to get cheap flights. Query: {query}"""
            ),
            agent=agent,
        )

    def suggest(self, agent):
        return Task(
            description=dedent(
                f"""Using the insights from the researcher's report, provide a comprehensive summary of what is the cheapest flight for the user. Suggest the best itinerary that has the fastest travel time, less layovers and date align with user travel date.
      """
            ),
            agent=agent,
        )
