import os
import json
import re
import random
from textwrap import dedent

from typing_extensions import TypedDict
from typing import TypedDict, Dict

from langgraph.graph import StateGraph, START, END

from image_to_video.prompts import CINEMATOGRAPHER_PROMPT, NEXT_FRAME_PROMPT
from image_to_video.model import (
    completion_llm,
    generate_text_to_image,
    generate_image_to_image,
)
from image_to_video.file import (
    get_thread_id_assets_folder,
    get_file_relative_location,
    get_thread_id_recent_generated_image_file,
    is_thread_id_assets_folder_empty,
)
from image_to_video.movie import generate_interpolated_images, create_video_from_images
from image_to_video.logger import logger


class AgentState(TypedDict):
    max_iteration: int
    current_iteration: int
    acts: list[Dict]
    plot: str


class Agent:
    thread_id = int

    def __init__(self):
        graph_builder = StateGraph(AgentState)
        graph_builder.add_node("generate_plot", self.generate_plot)
        graph_builder.add_node(
            "generate_next_image_sequence", self.generate_next_image_sequence
        )
        graph_builder.add_node(
            "generate_video_from_images", self.generate_video_from_images
        )

        graph_builder.add_edge(START, "generate_plot")
        graph_builder.add_edge("generate_plot", END)
        graph_builder.add_edge("generate_plot", "generate_next_image_sequence")
        graph_builder.add_conditional_edges(
            "generate_next_image_sequence",
            self.has_more_acts,
            {True: "generate_next_image_sequence", False: "generate_video_from_images"},
        )
        graph_builder.add_edge("generate_video_from_images", END)

        self.graph = graph_builder.compile()

    def execute(self, state: AgentState, config):
        self.thread_id = config["configurable"]["thread_id"]

        # Get the directory of the current script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        folder_path = os.path.join(script_dir, "assets", self.thread_id)
        # Create folder for the asset
        os.makedirs(folder_path, exist_ok=True)

        logger.info(f"thread_id: {self.thread_id}")

        # execute
        for event in self.graph.stream(state, config):
            for value in event.values():
                logger.info(value)

    def generate_plot(self, state: AgentState):
        max_iteration = state["current_iteration"]
        plot = state["plot"]

        response = completion_llm(
            messages=[
                {
                    "role": "user",
                    "content": CINEMATOGRAPHER_PROMPT.format(
                        max_iteration=max_iteration, plot=plot
                    ),
                }
            ]
        )

        output = response.choices[0].message.content

        logger.debug(f"plot_generator: {output}")

        try:
            acts = json.loads(output)
        except json.JSONDecodeError:
            # If not, try to extract JSON content using regex
            pattern = r"```json\n(.+?)```"
            match = re.search(pattern, output, re.DOTALL)
            if match:
                json_content = match.group(1)
                acts = json.loads(json_content)
            else:
                acts = []

        return {"acts": acts}

    def generate_next_image_sequence(self, state: AgentState):

        # if the folder is empty then we need to generate our base image
        if is_thread_id_assets_folder_empty(thread_id=self.thread_id):
            # generate the initial image using text -> image
            answer = generate_text_to_image(state["plot"])
            next_iteration = 0

        else:
            current_iteration = state["current_iteration"]
            acts = state["acts"]

            previous_acts = get_range_items(acts, start=0, end=current_iteration)

            # will throw error if there's no sequence
            current_frame = acts[current_iteration]["prompt"]
            # include the base prompt
            previous_frames = [f"Frame 0: {state['plot']}"] + [
                f"Frame {index +1}: {pa['prompt']}"
                for index, pa in enumerate(previous_acts)
            ]
            previous_frames = ("\n\n").join(previous_frames)

            next_frame_prompt = NEXT_FRAME_PROMPT.format(
                current_frame=current_frame, previous_frames=previous_frames
            )
            llm_respose = completion_llm(
                messages=[
                    {
                        "role": "user",
                        "content": next_frame_prompt,
                    }
                ]
            )

            logger.debug(f"next_frame_prompt: {next_frame_prompt}")

            # pick the init_image
            init_image = get_thread_id_recent_generated_image_file(
                thread_id=self.thread_id
            )
            next_iteration = current_iteration + 1

            img2img_prompt = llm_respose.choices[0].message.content

            logger.debug(f"img2img_prompt: {img2img_prompt}")

            # # generate the image using init  image
            answer = generate_image_to_image(
                init_image=init_image,
                prompt=img2img_prompt,
            )

        # Create the full file path
        file_path = get_file_relative_location(
            file_name=f"{next_iteration}.jpg", thread_id=self.thread_id
        )

        answer.image.save(file_path)

        return {"current_iteration": next_iteration}

    def generate_video_from_images(self, state: AgentState):
        folder_path = get_thread_id_assets_folder(self.thread_id)
        interpolation_prefix = "interpolated_"
        video_file_name = "sample-video.mp4"

        # Simple image interpolation
        generate_interpolated_images(interpolation_prefix, folder_path)

        # create the video
        create_video_from_images(video_file_name, folder_path, interpolation_prefix)

    def has_more_acts(self, state: AgentState):
        current_iteration = state["current_iteration"]
        acts = state["acts"]
        return current_iteration < len(acts)


def get_range_items(items, start=0, end=-1):
    return items[start:end]


if __name__ == "__main__":
    user_prompt = "An awe-inspiring depiction of a powerful warrior resembling Goku from Dragon Ball Z, that is about to transformed into Super Saiyan 3. He stands in a dramatic pose, surrounded by an intense, glowing aura of golden light, with energy bolts crackling around him"

    # Generate a random 4-digit number
    random_number = random.randint(1, 9999)

    # Format to ensure it's always 4 digits (padded with zeros if needed)
    thread_id = f"{random_number:04}"

    config = {"configurable": {"thread_id": thread_id}}
    agent = Agent()
    agent.execute(
        {
            "plot": user_prompt,
            "max_iteration": 5,
            "current_iteration": 0,
        },
        config,
    )
