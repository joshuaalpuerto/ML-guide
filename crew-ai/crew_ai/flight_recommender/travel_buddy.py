from crewai import Crew, Process


class TravelBuddy:

    def __init__(self, **inputs):
        self.inputs = inputs
        self.agents = []
        self.tasks = []

    def add_agent(self, agent, task):
        initialize_task = task(agent=agent, **self.inputs)

        self.agents.append(agent)
        self.tasks.append(initialize_task)

    def execute(self):
        # Instantiate your crew with a sequential process
        self.crew = Crew(
            agents=self.agents,
            tasks=self.tasks,
            verbose=2,  # Crew verbose more will let you know what tasks are being worked on, you can set it to 1 or 2 to different logging levels
            process=Process.sequential,  # Sequential process will have tasks executed one after the other and the outcome of the previous one is passed as extra content into this next.
        )
        # Get your crew to work!
        self.crew.kickoff()
