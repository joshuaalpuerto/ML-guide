# Image to Video Generator

This project allows you to generate a video from a given plot or sentence. Using the LLaMA 3.1 70B model, the system generates scenes based on the input plot, converts each scene into an image using a text-to-image model, and then stitches the images into a video using a Python script.

## Workflow
1. **Scene Generation:**
   - Input a plot or sentence into the system.
   - The LLaMA 3.1 70B model processes the input to generate individual scene descriptions.

2. **Image Generation:**
   - Each scene description is passed to a text-to-image model to generate images.

3. **Video Creation:**
   - All generated images are compiled into a video using the `movie.py` script.

## Pre-requisites
To run this project, ensure you have the following installed:

1. **Python 3.10**
   - The project requires Python 3.10 or newer.

2. **FFmpeg**
   - FFmpeg is used for seamless video generation by the `moviepy` Python library.
   - Install FFmpeg:
     - **Linux:** `sudo apt install ffmpeg`
     - **MacOS:** `brew install ffmpeg`
     - **Windows:** [Download FFmpeg](https://ffmpeg.org/download.html) and add it to your PATH.

3. **Fireworks.ai Account**
   - This project requires access to Fireworks.ai services. Create an account at [Fireworks.ai](https://fireworks.ai) if you don't already have one.

## Usage
1. Clone the repository and navigate to the project directory:
   ```bash
   git clone <repository_url>
   cd <repository_directory>
   ```

2. Install dependencies using Poetry:
   ```bash
   poetry install
   ```

3. Activate the Poetry environment:
   ```bash
   poetry shell
   ```

4. Change `.env.sample` to `.env` and add your API keys

5. Run the main script:
   ```bash
   python main.py
   ```

6. The generated video will be saved in the generated `thread_id` inside assets directory.

## Troubleshooting
- Ensure FFmpeg is correctly installed and added to your system PATH.
- Verify your Fireworks.ai API credentials are correctly configured in the `.env` file.

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.
