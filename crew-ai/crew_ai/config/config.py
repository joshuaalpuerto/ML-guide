import os
from dotenv import load_dotenv

load_dotenv()

FIREWORKS_API_KEY = os.getenv("FIREWORKS_API_KEY")
AMADEUS_API_KEY = os.getenv("AMADEUS_API_KEY")
AMADEUS_SECRET = os.getenv("AMADEUS_SECRET")
LLM_DEBUG = os.getenv("LLM_DEBUG", False) == "True"
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")
