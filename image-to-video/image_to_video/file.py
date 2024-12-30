import os
import base64


def get_thread_id_assets_folder(thread_id):
    # Get the directory of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Define the folder structure relative to the script's location
    folder_path = os.path.join(script_dir, "assets", thread_id)

    # Ensure the folder exists
    os.makedirs(folder_path, exist_ok=True)

    # Create the full file path
    return folder_path


def get_file_relative_location(file_name, thread_id):
    # Get the directory of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Define the folder structure relative to the script's location
    folder_path = os.path.join(script_dir, "assets", thread_id)

    # Ensure the folder exists
    os.makedirs(folder_path, exist_ok=True)

    # Create the full file path
    return os.path.join(folder_path, file_name)


def get_thread_id_recent_generated_image_file(thread_id):
    # Get the directory of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Define the folder structure relative to the script's location
    folder_path = os.path.join(script_dir, "assets", thread_id)

    # Ensure the folder exists
    if not os.path.exists(folder_path):
        print("Assets folder does not exist.")
        return None

    # Get all files in the folder
    files = [f for f in os.listdir(folder_path) if f.endswith(".jpg")]

    # Extract numerical names and find the latest
    numerical_files = []
    for file in files:
        try:
            # Extract number from file name
            num = int(os.path.splitext(file)[0])
            numerical_files.append((num, file))
        except ValueError:
            continue

    if not numerical_files:
        print("No numerical images found.")
        return None

    # Get the file with the highest number
    selected_filename = max(numerical_files, key=lambda x: x[0])[1]
    return os.path.join(folder_path, selected_filename)


def is_thread_id_assets_folder_empty(thread_id):
    folder_path = get_thread_id_assets_folder(thread_id)
    return len(os.listdir(folder_path)) == 0


# Helper function to encode the image
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")
