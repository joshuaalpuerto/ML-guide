from crewai import Task
from textwrap import dedent


class Tasks:
    def get_cheapest_flight(self, agent, *, origin, destination, date_range, interests):
        return Task(
            description=dedent(
                f"""As a researcher your task is to analyze the user trip details and conduct a comprehensive research to get cheap flights.
                
                Travel information:
                origin: {origin}
                destination: {destination}
                date_range: {date_range}
                interests: {interests}
                """
            ),
            agent=agent,
        )

    def gather_destination_information(
        self, agent, *, origin, destination, date_range, interests
    ):
        return Task(
            description=dedent(
                f"""
            You must compile THE latest in-depth guide for someone traveling and wanting to have THE BEST trip ever with limited budget!
            You have tools access to gather information about key attractions, local customs, special events, and daily activity recommendations.
            Search for the best spots to go to during the season of their trip date {date_range}.

            You should provide a thorough overview of what the city has to offer, including hidden gems, cultural hotspots, must-visit landmarks, weather forecasts, and high level costs based on travelers interest {interests}.
            
            The final answer must be a comprehensive city guide, rich in cultural insights and practical tips, tailored to enhance the travel experience.

            If you do your BEST WORK, I'll give you a $10,000 tip!

            Trip Date: {date_range}
            Traveling from: {origin}
            Traveling to: {destination}
            Traveler Interests: {interests}
        """
            ),
            agent=agent,
        )

    def create_itenirary(
        self,
        agent,
        *,
        destination,
        date_range,
        interests,
    ):
        return Task(
            description=dedent(
                f"""
                Using the current information provided, expand this guide base on the trip-range itinerary with detailed per-day plans, including weather forecasts,places to eat, packing suggestions, and a budget breakdown.
            
            You MUST cover all aspects of the trip:
            1. Provide cheap flight information base on trip details ({date_range}).
            2. Must-visit landmarks, be specific and give it a reason why you picked
            # up each place, what make them special!
            3. Must-visit places to eat, be specific and give it a reason why you picked
            # up each place, what make them special!

            Your final answer MUST be a complete expanded travel plan, formatted as markdown, encompassing a daily schedule. 

            If you do your BEST WORK, I'll give you a $10,000 tip!
        """
            ),
            agent=agent,
        )
