from crewai import Task
from textwrap import dedent
from datetime import date


class Tasks:
    def get_cheapest_flight(self, agent, *, origin, destination, date_range, interests):
        return Task(
            description=dedent(
                f"""As a researcher you task is to analyze the user trip details and conduct a comprehensive research to get cheap flights
                
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
            You must compile THE latest
            in-depth guide for someone traveling and wanting 
            to have THE BEST trip ever!
            You have tools access to gather information about key attractions, local customs,
            special events, and daily activity recommendations.
            Search for the best spots to go to, the kind of place only a
            local would know.
            Base on what you search, you should provide a thorough overview of what 
            the city has to offer, including hidden gems, cultural
            hotspots, must-visit landmarks, weather forecasts, and
            high level costs.
            
            The final answer must be a comprehensive city guide, 
            rich in cultural insights and practical tips, 
            tailored to enhance the travel experience.

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
                Using insights from the travel researcher, expand this guide base on the trip-range 
            itinerary with detailed per-day plans, including 
            weather forecasts, places to eat, packing suggestions, 
            and a budget breakdown.
            
            You MUST suggest actual places to visit, actual hotels 
            to stay and actual restaurants to go to.
            
            This itinerary should cover all aspects of the trip, 
            from cheap flight information, integrating the city guide
            information with practical travel logistics.
            
            Your final answer MUST be a complete expanded travel plan,
            formatted as markdown, encompassing a daily schedule,
            anticipated weather conditions, recommended clothing and
            items to pack, and a detailed budget, ensuring THE BEST
            TRIP EVER, Be specific and give it a reason why you picked
            # up each place, what make them special!

            Trip Date: {date_range}
            Traveling to: {destination}
            Traveler Interests: {interests}
        """
            ),
            agent=agent,
        )
