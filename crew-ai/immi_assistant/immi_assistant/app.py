import streamlit as st
from langchain_community.callbacks import StreamlitCallbackHandler
from immi_assistant import ImmiAssistant
from langchain.globals import set_llm_cache, set_debug
from langchain.cache import InMemoryCache
from agent import Agents
from tasks import Tasks
from utils import get_llm, get_function_calling_llm

set_llm_cache(InMemoryCache())
# Turn this on only if you want to debug other wise it's hard to see the conversations.
set_debug(True)

USER_AVATAR = "👤"
BOT_AVATAR = "🤖"

st.title("Your travel buddy")


def clear_page():
    st.empty()


with st.form(key="my_form"):
    fireworks_api_key = ""
    origin = st.text_input("Origin?", value="Philippines")
    destination = st.text_input("Destination?", value="Estonia")

    # Every form must have a submit button.
    submitted = st.form_submit_button(
        "Submit", type="primary", use_container_width=True
    )
    st.form_submit_button("Clear", on_click=clear_page, use_container_width=True)

    if submitted and fireworks_api_key != "":
        # clean any errors
        clear_page()

        st_callback = StreamlitCallbackHandler(st.container())
        llm = get_llm(fireworks_api_key=fireworks_api_key, callbacks=[st_callback])
        function_calling_llm = get_function_calling_llm(
            fireworks_api_key=fireworks_api_key, callbacks=[st_callback]
        )
        tasks = Tasks()
        capable_agents = Agents(llm=llm, verbose=True)
        cheap_agents = Agents(llm=llm, verbose=True)

        immi_assistant = ImmiAssistant(
            origin=origin,
            destination=destination,
        )

        # add flight researcher
        visa_researcher = capable_agents.visa_information_researcher(
            function_calling_llm=function_calling_llm
        )
        immi_assistant.add_agent(
            agent=visa_researcher, task=tasks.gather_visa_information
        )

        # this requires a more capable model as it will delegate tasks to other agents
        # travel_planner = capable_agents.travel_concierge(allow_delegation=True)
        # travel_buddy.add_agent(agent=travel_planner, task=tasks.create_itenirary)

        immi_assistant.execute()
