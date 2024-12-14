from crewai import Task
from textwrap import dedent


class Tasks:

    def gather_visa_information(self, agent, **inputs):
        origin = inputs.get("origin", "")
        destination = inputs.get("destination", "")

        return Task(
            description=dedent(
                f"""
            You must compile THE latest information about visa information for someone relocating to the destination country
            You have tools access to gather information about visa information.

            The final answer must be a comprehensive visa information.

            If you do your BEST WORK, I'll give you a $10,000 tip!

            Origin: {origin}
            Destination: {destination}
        """
            ),
            agent=agent,
        )
