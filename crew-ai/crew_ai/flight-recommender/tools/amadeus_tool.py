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


class GetAmadeusFlightOffers(BaseModel):
    originLocationCode: str = Field(
        description="City/airport IATA code from which the traveler will depart, e.g., BOS for Boston"
    )
    destinationLocationCode: str = Field(
        description="City/airport IATA code to which the traveler is going, e.g., PAR for Paris"
    )
    departureDate: str = Field(
        description="The date on which the traveler will depart from the origin to go to the destination, in YYYY-MM-DD format"
    )
    adults: int = Field(
        description="The number of adult travelers (age 12 or older on the date of departure)"
    )
    returnDate: Optional[str] = Field(
        description="The date on which the traveler will return from the destination to the origin, in YYYY-MM-DD format"
    )
    children: Optional[int] = Field(
        description="The number of child travelers (older than age 2 and younger than age 12 on the date of departure)"
    )
    infants: Optional[int] = Field(
        description="The number of infant travelers (age 2 or younger on the date of departure)"
    )
    travelClass: Optional[str] = Field(
        description="Travel class (ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST)"
    )
    includedAirlineCodes: Optional[str] = Field(
        description="IATA airline codes to include, comma-separated"
    )
    excludedAirlineCodes: Optional[str] = Field(
        description="IATA airline codes to exclude, comma-separated"
    )
    nonStop: Optional[str] = Field(
        description="If set to 'true', only non-stop flights are considered"
    )
    currencyCode: Optional[str] = Field(
        description="Preferred currency for the flight offers, in ISO 4217 format"
    )
    maxPrice: Optional[int] = Field(description="Maximum price per traveler")
    max: Optional[int] = Field(description="Maximum number of flight offers to return")


class GetFlightOffers(BaseTool):
    name = "get_flight_offers"
    description = "Search for flight information."
    args_schema: Type[BaseModel] = GetAmadeusFlightOffers
    return_direct = True

    def _run(
        self,
        originLocationCode,
        destinationLocationCode,
        departureDate,
        adults=1,
        returnDate=None,
        children=None,
        infants=None,
        travelClass=None,
        includedAirlineCodes=None,
        excludedAirlineCodes=None,
        nonStop="false",
        currencyCode="EUR",
        maxPrice=None,
        max=5,
    ):
        """
        Pulls the flight data from the amadeus server.
        """

        # # Initialize Amadeus client
        amadeus = Client(
            client_id=config.AMADEUS_API_KEY, client_secret=config.AMADEUS_SECRET
        )

        # Set up the parameters for the request
        params = {
            "originLocationCode": originLocationCode,
            "destinationLocationCode": destinationLocationCode,
            "departureDate": departureDate,
            "adults": adults,
            "returnDate": returnDate,
            "children": children,
            "infants": infants,
            "travelClass": travelClass,
            "includedAirlineCodes": includedAirlineCodes,
            "excludedAirlineCodes": excludedAirlineCodes,
            "nonStop": nonStop,
            "currencyCode": currencyCode,
            "maxPrice": maxPrice,
            "max": max,
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

            return "\n\n".join(result)
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

        itineraries_summary = dedent(f"""Flight offer {data['id']}""")
        for idx, iterenary in enumerate(itineraries):
            layovers = self.get_layovers_info_from_iterenary(iterenary)

            options = dedent(
                f"""
                Itinerary {idx + 1}:
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

                options += flight_details + "\n"

        return itineraries_summary + options

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
    search_flight_offers_with_amadeus_client_tool = GetFlightOffers()
    result = search_flight_offers_with_amadeus_client_tool.run(
        {
            "originLocationCode": "BOS",
            "destinationLocationCode": "PAR",
            "departureDate": "2024-01-30",
            "returnDate": "2024-02-14",
            "adults": 1,
            "returnDate": None,
            "children": None,
            "infants": None,
            "travelClass": None,
            "includedAirlineCodes": None,
            "excludedAirlineCodes": None,
            "nonStop": "false",
            "currencyCode": "EUR",
            "maxPrice": None,
            "max": 5,
        }
    )
