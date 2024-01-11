from crewai import Task
from textwrap import dedent
from datetime import date


class Tasks:
    def research(self, agent):
        return Task(
            description=dedent(
                f"""Analyze the user query about its trip and conduct a comprehensive research to get cheap flights."""
            ),
            agent=agent,
        )

    def suggest(self, agent, origin, interests, range):
        return Task(
            description=dedent(
                f"""Using the insights from the researcher's report, provide a comprehensive summary of what is the cheapest flight for the user.
      """
            ),
            agent=agent,
        )
