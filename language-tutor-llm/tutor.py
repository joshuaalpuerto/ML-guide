import argparse
from chatbot import Chatbot


if __name__ == "__main__":
    # Create an ArgumentParser object
    parser = argparse.ArgumentParser(description="Your language teacher.")

    # Add arguments
    parser.add_argument(
        "--language", help="What language you want to interact with.", required=True
    )

    # Parse the command-line arguments
    args = parser.parse_args()
    language = args.language

    chatbot = Chatbot(
        model="accounts/fireworks/models/mistral-7b-instruct-4k",
        language=language,
        verbose=False,
    )

    finished = False
    while not finished:
        text = input("Your message: ")
        if text == "EXIT":
            finished = True
            continue
        response = chatbot.get_response(input=text)
        print("\n --------------------------------")
        print(">>", response)
        print("\n --------------------------------")
