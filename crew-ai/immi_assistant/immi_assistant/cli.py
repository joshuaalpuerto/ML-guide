from langchain.globals import set_llm_cache, set_debug
from langchain.cache import InMemoryCache
from langchain.callbacks import StdOutCallbackHandler
import logging
from utils import get_llm, get_function_calling_llm

from agent import Agents
from tasks import Tasks
from immi_assistant import ImmiAssistant

logging.basicConfig(
    level=logging.DEBUG, format="%(name)s - %(levelname)s - %(message)s"
)

set_llm_cache(InMemoryCache())
# Turn this on only if you want to debug other wise it's hard to see the conversations.
set_debug(True)

if __name__ == "__main__":
    fireworks_api_key = ""
    llm = get_llm(fireworks_api_key=fireworks_api_key)
    function_calling_llm = get_function_calling_llm(
        fireworks_api_key=fireworks_api_key,
    )

    origin = "Philippines"
    destination = "Spain"

    tasks = Tasks()
    agents = Agents(llm=llm, verbose=True)

    immi_assistant = ImmiAssistant(
        origin=origin,
        destination=destination,
    )

    # add flight researcher
    visa_researcher = agents.visa_information_researcher(
        function_calling_llm=function_calling_llm
    )
    immi_assistant.add_agent(agent=visa_researcher, task=tasks.gather_visa_information)

    # this requires a more capable model as it will delegate tasks to other agents
    # travel_planner = capable_agents.travel_concierge(allow_delegation=True)
    # travel_buddy.add_agent(agent=travel_planner, task=tasks.create_itenirary)

    immi_assistant.execute()
