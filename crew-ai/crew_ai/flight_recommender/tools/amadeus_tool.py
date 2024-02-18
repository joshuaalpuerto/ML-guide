import logging
import json
from typing import Optional, Type
from crew_ai.config import config
from amadeus import Client, ResponseError
from pydantic import BaseModel, Field
from langchain.agents import tool
from langchain.tools import BaseTool
import airportsdata
from textwrap import dedent


# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("amadeus")


class GetFlightOffersInput(BaseModel):
    originLocationCode: str = Field(
        description="City/airport IATA code from which the traveler will depart, e.g., BOS for Boston (Required)"
    )
    destinationLocationCode: str = Field(
        description="City/airport IATA code to which the traveler is going, e.g., PAR for Paris (Required)"
    )
    departureDate: str = Field(
        description="The date on which the traveler will depart from the origin to go to the destination, in YYYY-MM-DD format (Required)"
    )
    returnDate: str = Field(
        description="The date on which the traveler will depart from the destination to return to the origin, in YYYY-MM-DD format"
    )
    adults: int = Field(
        description="The number of adult travelers (age 12 or older on the date of departure) (Required)"
    )


class GetFlightOffers(BaseTool):
    name = "Get flights offers"
    description = "Search for flight information"
    args_schema: Type[BaseModel] = GetFlightOffersInput

    return_direct = True

    def _run(self, **payload):
        """
        Pulls the flight data from the amadeus server.
        """

        # # Initialize Amadeus client
        amadeus = Client(
            client_id=config.AMADEUS_API_KEY, client_secret=config.AMADEUS_SECRET
        )

        logger.debug("llm paylaod:", payload)

        adults = payload.get("adults", 1)
        return_date = payload.get("returnDate", None)
        # Set up the parameters for the request
        params = {
            **payload,
            "adults": adults,
            "returnDate": return_date,
            "currencyCode": "EUR",
            "max": 5,
        }

        # Remove None values
        params = {k: v for k, v in params.items() if v is not None}
        logger.debug("Request parameters: %s", params)

        # Make the request using Amadeus client

        try:
            response = amadeus.shopping.flight_offers_search.get(**params)
            # logger.debug("Response data: %s", response.data)
            # we need to filter the response because it's alot, let's focus on what we care about.
            # price, number of stops, etc.
            result = [self.format_item_result(item) for item in response.data]

            return "------".join(result)

        except ResponseError as error:
            logger.error(f"An error occurred: {error}")
            logger.error(f"Error code: {error.code}")
            logger.error(f"Error message: {error.description}")
            if hasattr(error, "response"):
                logger.error(
                    "Full error response: %s", error.response.body
                )  # Log full error response
            return ""

    def format_item_result(self, data):
        itineraries = data["itineraries"]
        price = data["price"]["total"]

        itineraries_summary = dedent(
            f"""
            Flight offer {data['id']} with price of `{price}`
            """
        )

        for idx, iterenary in enumerate(itineraries):
            layovers = self.get_layovers_info_from_iterenary(iterenary)
            title = "To Destination" if idx == 0 else "Going back"
            itineraries_summary += dedent(
                f"""
                {title}
                Layover(s): {", ".join(layovers)}
                """
            )

            for segment in iterenary["segments"]:
                departure_details = segment["departure"]
                arrival_details = segment["arrival"]

                departure_airport_details = self.get_iata_info(
                    departure_details["iataCode"]
                )
                arrival_airport_details = self.get_iata_info(
                    arrival_details["iataCode"]
                )

                flight_details = dedent(
                    f"""
                Departure: {departure_airport_details['name']}
                Terminal: {departure_details.get('terminal', '')}
                Date: {departure_details['at']}

                Arrival: {arrival_airport_details['name']}
                Terminal: {arrival_details.get('terminal', '')}
                Date: {arrival_details['at']}
                """
                )

                itineraries_summary += flight_details

        return itineraries_summary

    def get_layovers_info_from_iterenary(self, iterenary):
        segments = iterenary["segments"]
        layovers = []

        for segment in segments[1:]:
            airport_info = self.get_iata_info(segment["departure"]["iataCode"])
            layovers.append(airport_info["name"])

        return layovers

    def get_iata_info(self, iataCode):
        airports = airportsdata.load("IATA")
        return airports[iataCode]


if __name__ == "__main__":
    # search_flight_offers_with_amadeus_client_tool = GetFlightOffers()
    # result = search_flight_offers_with_amadeus_client_tool.run(
    #     {
    #         "input_string": '{\n    "originLocationCode": "BOS",\n    "destinationLocationCode": "PAR",\n    "departureDate": "2024-04-10"\n}\n'
    #     }
    # )
    # print(result)
    airports = airportsdata.load("IATA")
    print(airports["EEM"])
