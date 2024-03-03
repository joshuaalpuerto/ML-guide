import streamlit as st
from chatbot import Chatbot

language = st.selectbox(
    "What language you want to interact with", ("Spanish", "Estonian")
)

chatbot = Chatbot(
    model="accounts/fireworks/models/mistral-7b-instruct-4k",
    language=language,
    verbose=False,
)

prompt = st.chat_input(f"Start a topic with your {language} tutor")
if prompt:
    st.write(f"User has sent the following prompt: {prompt}")
