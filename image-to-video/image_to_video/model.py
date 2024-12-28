import requests
import json
import fireworks.client
from fireworks.client import Fireworks
from fireworks.client.image import ImageInference, Answer
from image_to_video.config import FIREWORKS_API_KEY

# Initialize the ImageInference client
fireworks.client.api_key = FIREWORKS_API_KEY


def completion_llm(messages, **args):
    client = Fireworks(api_key=FIREWORKS_API_KEY)
    response = client.chat.completions.create(
        model="accounts/fireworks/models/mixtral-8x22b-instruct",
        max_tokens=4096,
        top_p=1,
        top_k=40,
        presence_penalty=0,
        frequency_penalty=0,
        temperature=0.5,
        messages=messages,
        **args,
    )
    return response


def generate_text_to_image(prompt):
    inference_client = ImageInference(model="playground-v2-1024px-aesthetic")

    # Generate an image using the text_to_image method
    answer: Answer = inference_client.text_to_image(
        prompt=prompt,
        cfg_scale=7,
        height=1024,
        width=1024,
        sampler=None,
        steps=30,
        seed=1,
        safety_check=False,
        output_image_format="JPG",
    )

    if answer.image is None:
        raise RuntimeError(f"No return image, {answer.finish_reason}")
    else:
        return answer


def generate_image_to_image(init_image, prompt):
    inference_client = ImageInference(model="playground-v2-1024px-aesthetic")
    # Modify an existing image using the image_to_image method
    answer: Answer = inference_client.image_to_image(
        init_image=init_image,
        prompt=prompt,
        cfg_scale=3,
        sampler=None,
        steps=30,
        seed=1,
        safety_check=False,
        output_image_format="JPG",
        init_image_mode="STEP_SCHEDULE",
        step_schedule_start=0,
        step_schedule_end=1,
    )

    if answer.image is None:
        raise RuntimeError(f"No return image, {answer.finish_reason}")
    else:
        return answer


def vision_llm(prompt, base64_encoded_image, **args):
    fireworks.client.api_key = "<FIREWORKS_API_KEY>"
    response = fireworks.client.ChatCompletion.create(
        model="accounts/fireworks/models/phi-3-vision-128k-instruct",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt,
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_encoded_image}"
                        },
                    },
                ],
            }
        ],
    )
    print(response.choices[0].message.content)
