import streamlit as st
from langchain_community.callbacks import StreamlitCallbackHandler
from travel_buddy import TravelBuddy
from agent import Agents
from tasks import Tasks
from utils import get_llm, get_function_calling_llm

USER_AVATAR = "👤"
BOT_AVATAR = "🤖"

st.title("Your travel buddy")


def clear_page():
    st.empty()


with st.form(key="my_form"):
    fireworks_api_key = st.text_input("FIREWORKS_API", value="")
    origin = st.text_input("Origin?", value="Tallinn, Estonia")
    destination = st.text_input("Destination?", value="Madrid, Spain")
    date_range = st.text_input(
        "When do you plan to go?", value="2024-04-01 - 2024-04-05"
    )
    interests = st.text_input(
        "List of of your interests to do (history, food, local experience)?",
        value="history, food, local experience",
    )

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

        travel_buddy = TravelBuddy(
            origin=origin,
            destination=destination,
            date_range=date_range,
            interests=interests,
        )

        # add flight researcher
        flight_researcher = cheap_agents.flight_researcher(
            function_calling_llm=function_calling_llm
        )
        travel_buddy.add_agent(agent=flight_researcher, task=tasks.get_cheapest_flight)

        # add add information gatherer
        # this has a simple task so we can use a smaller model
        travel_agent = capable_agents.travel_agent(
            function_calling_llm=function_calling_llm, max_iter=10
        )
        travel_buddy.add_agent(
            agent=travel_agent, task=tasks.gather_destination_information
        )

        # this requires a more capable model as it will delegate tasks to other agents
        travel_planner = capable_agents.travel_concierge(allow_delegation=True)
        travel_buddy.add_agent(agent=travel_planner, task=tasks.create_itenirary)

        travel_buddy.execute()
