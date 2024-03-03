import streamlit as st
from chatbot import Chatbot

AVATAR_MAP = {"user": "👤", "assistant": "🤖"}


@st.cache_resource()
def get_chatbot(language):
    return Chatbot(
        model="accounts/fireworks/models/mistral-7b-instruct-4k",
        language=language,
        verbose=False,
    )


language = st.selectbox(
    "What language you want to interact with", ("Spanish", "Estonian")
)
chatbot = get_chatbot(language)


# Initialize chat history
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat messages from history on app rerun
for message in st.session_state.messages:
    with st.chat_message(message["role"], avatar=AVATAR_MAP[message["role"]]):
        st.markdown(message["content"])


if prompt := st.chat_input(f"Start a topic with your {language} tutor"):
    with st.chat_message("user", avatar=AVATAR_MAP["user"]):
        st.markdown(prompt)
        st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("assistant", avatar=AVATAR_MAP["assistant"]):
        with st.spinner("Thinking..."):
            response = chatbot.get_response(input=prompt)
            st.write(response)
            st.session_state.messages.append({"role": "assistant", "content": response})
