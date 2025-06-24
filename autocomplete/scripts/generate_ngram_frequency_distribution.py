import sys
import os
import re
import nltk
from nltk.util import ngrams
from datetime import datetime
import json

# Define the patterns to clean up the text
FORMAT_PLAIN_TEXT = [
    re.compile(r"\s-+\s"),  # Matches: spaces around hyphens
    re.compile(r"[©|]\s?"),  # Matches: various punctuation marks
    re.compile(r"\s{2,}|^\s"),  # Matches: consecutive spaces or leading spaces
]

MATCH_LOWER_UPPER = re.compile(r"([a-z])([A-Z])")
MATCH_NEW_LINES = re.compile(r"\n")


def get_project_root():
    # Find the path to the project root directory (one level above the 'module' directory)
    current_file_path = os.path.abspath(__file__)  # Path to this file (utility/file.py)
    utility_dir = os.path.dirname(current_file_path)  # Directory of this file
    project_root = os.path.abspath(
        os.path.join(utility_dir, "..")
    )  # Assuming project root is one level up

    return project_root


def load_json(file_path):
    try:
        # Get the project root directory
        project_root = get_project_root()

        # Construct the full path to the file relative to the project root
        file_path = os.path.join(project_root, file_path)
        with open(file_path, "r") as file:
            data = json.load(file)
            return data
    except FileNotFoundError:
        print(f"The file {file_path} does not exist.")
        return None
    except json.JSONDecodeError:
        print(f"Error decoding JSON from the file {file_path}.")
        return None


# Function to create a file from a JSON object
def create_json_file(file_path, json_data, options={}):
    try:
        # Get the project root directory
        project_root = get_project_root()
        ensure_ascii = options.get("ensure_ascii", True)

        # Construct the full path to the file relative to the project root
        file_path = os.path.join(project_root, file_path)
        with open(file_path, "w") as file:
            json.dump(json_data, file, indent=4, ensure_ascii=ensure_ascii)
            print(f"File {file_path} created successfully.")
    except IOError as e:
        print(f"Error writing to file {file_path}: {e}")


def to_plain_text(text):
    # Add a space between a lowercase and uppercase letter
    text = re.sub(MATCH_LOWER_UPPER, r"\1 \2", text)
    # Replace newlines with spaces
    text = re.sub(MATCH_NEW_LINES, " ", text)
    # Apply the FORMAT_PLAIN_TEXT patterns sequentially
    for pattern in FORMAT_PLAIN_TEXT:
        text = re.sub(pattern, " ", text)
    return text


def word_tokenize(text):
    plain_text = to_plain_text(text)
    return plain_text.split(" ")


def replace_anonimzed_text_to_tags(text):
    # Regular expression pattern to match <UPPERCASE_TEXT_WITH_UNDERSCORES>
    pattern = r"<([A-Z_]+)>"

    # Function to convert match to the desired format
    def replace_tag(match):
        # Extract the text inside <>
        tag_content = match.group(1)
        # Convert to lowercase and wrap in {}
        return f"{{{tag_content.lower()}}}"

    # Perform the replacement
    if re.search(pattern, text):
        text = re.sub(pattern, replace_tag, text)

    return text


def pre_processed_text(txt):
    txt = replace_anonimzed_text_to_tags(txt)
    # to properly conver unicodes to their actual character
    return txt.encode().decode()


def generate_js_friendly_lookup_frequencies_from_ngrams(ngrams):
    bigram_freq = nltk.FreqDist(ngrams.get("bigrams"))
    trigram_freq = nltk.FreqDist(ngrams.get("trigrams"))
    fourgram_freq = nltk.FreqDist(ngrams.get("fourgrams"))

    bigram_freq_dict = {" ".join(k): v for k, v in bigram_freq.items()}
    trigram_freq_dict = {" ".join(k): v for k, v in trigram_freq.items()}
    fourgram_freq_dict = {" ".join(k): v for k, v in fourgram_freq.items()}

    # Initialize an empty dictionary to hold the transformed data
    bigram_freq_dict = {}
    trigram_freq_dict = {}
    fourgram_freq_dict = {}

    # Iterate bigram_freq
    for (word1, word2), frequency in bigram_freq.items():
        key = f"{word1}"

        # If the key already exists, update the existing dictionary
        if key in bigram_freq_dict:
            bigram_freq_dict[key][word2] = frequency
        else:
            bigram_freq_dict[key] = {word2: frequency}

    # Iterate trigram_freq
    for (word1, word2, word3), frequency in trigram_freq.items():
        key = f"{word1} {word2}"
        # If the key already exists, update the existing dictionary
        if key in trigram_freq_dict:
            trigram_freq_dict[key][word3] = frequency
        else:
            trigram_freq_dict[key] = {word3: frequency}

    # Iterate fourgram_freq
    for (word1, word2, word3, word4), frequency in fourgram_freq.items():
        key = f"{word1} {word2} {word3}"
        if key in fourgram_freq_dict:
            fourgram_freq_dict[key][word4] = frequency
        else:
            fourgram_freq_dict[key] = {word4: frequency}

    # Combine the frequency distributions into a single dictionary
    return {
        "bigrams": bigram_freq_dict,
        "trigrams": trigram_freq_dict,
        "fourgrams": fourgram_freq_dict,
    }


def execute(file_name):
    base_path = os.path.join(
        "autocomplete_lm",
        "datasets",
    )

    data = load_json(os.path.join(base_path, f"{file_name}.json"))

    bigrams = []
    trigrams = []
    fourgrams = []

    # Currently we process data with [{"content": "..."}]
    # update this according to the shape of your data
    for message in data:
        formatted_text = replace_anonimzed_text_to_tags(message["content"])
        # Tokenize the sentence into words
        tokens = word_tokenize(formatted_text)

        # Generate the bigrams
        bigrams.extend(list(nltk.bigrams(tokens)))
        # Generate the trigrams
        trigrams.extend(list(nltk.trigrams(tokens)))
        # Generate the fourgrams
        fourgrams.extend(list(ngrams(tokens, 4)))

    frequencies = generate_js_friendly_lookup_frequencies_from_ngrams(
        {
            "bigrams": bigrams,
            "trigrams": trigrams,
            "fourgrams": fourgrams,
        }
    )

    # Get the current date and time
    now = datetime.now()

    # Format the date and time as YYYYMMDDHHmmss
    code = now.strftime("%Y%m%d%H%M%S")
    create_json_file(
        os.path.join(base_path, f"{file_name}-freq-{code}.json"),
        frequencies,
        options={
            # to display unicode as is
            "ensure_ascii": False
        },
    )


if __name__ == "__main__":
    execute("frequency-distribution")
