import json
from pydantic import BaseModel, Field
from langchain.tools import BaseTool
from typing import Literal, Optional, Type

TemperatureUnitSymbol = Literal["celcius", "fahrenheit"]


class GetCurrentWeatherInput(BaseModel):
    location: str = Field(description="The city and state, e.g. San Francisco, CA")
    unit: Optional[TemperatureUnitSymbol] = Field(description="The temperature unit value")

# This is not working for crew-ai
# @tool("get_current_weather", args_schema=GetCurrentWeatherInput, return_direct=True)
# def get_current_weather(location, unit="fahrenheit"):
#     """Get the current weather in a given location"""
#     weather_info = {
#         "location": location,
#         "temperature": "72",
#         "unit": unit,
#         "forecast": ["sunny", "windy"],
#     }
#     return json.dumps(weather_info)

class GetCurrentWeather(BaseTool):
    name = "get_current_weather"
    description = "Get the current weather in a given location"
    args_schema: Type[BaseModel] = GetCurrentWeatherInput
    return_direct = True

    def _run(
        self, location: str, unit: TemperatureUnitSymbol = "fahrenheit"
    ) -> str:
        weather_info = {
            "location": location,
            "temperature": "72",
            "unit": unit,
            "forecast": ["sunny", "windy"],
        }
        return json.dumps(weather_info)

if __name__ == "__main__":
    get_current_weather_tool = GetCurrentWeather()  
    print(get_current_weather_tool.name)
    print(get_current_weather_tool.description)
    print(get_current_weather_tool.args)
    print(get_current_weather_tool.return_direct)
    print(get_current_weather_tool.run({ "location":'SF', "unit": "fahrenheit"}))
