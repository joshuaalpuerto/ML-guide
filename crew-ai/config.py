import os
from dotenv import load_dotenv

load_dotenv()

FIREWORKS_API_KEY = os.getenv("FIREWORKS_API_KEY")
LLM_DEBUG = os.getenv("LLM_DEBUG", False) == "True"
