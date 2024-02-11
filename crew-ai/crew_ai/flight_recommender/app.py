import streamlit as st
from langchain_community.callbacks import StreamlitCallbackHandler
from travel_buddy import TravelBuddy
from agent import Agents
from tasks import Tasks
from utils import get_llm

USER_AVATAR = "👤"
BOT_AVATAR = "🤖"

st.title("Your travel buddy")

if "messages" not in st.session_state:
    st.session_state.messages = []

with st.form("my_form"):
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
    submitted = st.form_submit_button("Submit")
    if submitted:
        st_callback = StreamlitCallbackHandler(st.container())
        llm = get_llm(callbacks=[st_callback])
        tasks = Tasks()
        capable_agents = Agents(llm=llm, verbose=True)

        travel_buddy = TravelBuddy(
            origin=origin,
            destination=destination,
            date_range=date_range,
            interests=interests,
        )

        # add flight researcher
        flight_researcher = capable_agents.flight_researcher()
        travel_buddy.add_agent(agent=flight_researcher, task=tasks.get_cheapest_flight)

        # add add information gatherer
        # this has a simple task so we can use a smaller model
        travel_agent = capable_agents.travel_agent()
        travel_buddy.add_agent(
            agent=travel_agent, task=tasks.gather_destination_information
        )

        # this requires a more capable model as it will delegate tasks to other agents
        travel_planner = capable_agents.travel_concierge(allow_delegation=True)
        travel_buddy.add_agent(agent=travel_planner, task=tasks.create_itenirary)

        travel_buddy.execute()
