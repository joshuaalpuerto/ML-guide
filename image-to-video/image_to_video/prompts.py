from textwrap import dedent

CINEMATOGRAPHER_PROMPT = dedent(
    """
  Think like a cinematographer who has keen to details, your tasks is to describe in detailed what should happen on each frame of the video given a plot below. You should output {max_iteration} frames to complete the video. When writing prompts, focus on detailed, chronological descriptions of actions and scenes. Include specific movements, appearances, camera angles, and environmental details - all in a single flowing paragraph. Start directly with the action, and keep descriptions literal and precise. Your output should be wrapped in JSON format: ```json```. 

  >> Example:
  Plot: 
  A ball rolls from the left side of a grassy field to the right

  Output:
  [
      {{
        "prompt": "The camera captures a sunny grassy field from a slightly low angle, showing a small red ball resting still on the far-left side of the frame. The ball casts a soft shadow onto the grass, and the sunlight highlights its glossy surface. Gentle blades of grass sway slightly in the breeze, and the distant horizon is a blurred line of trees under a clear blue sky."
      }},
      {{
        "prompt": "The red ball begins rolling toward the center of the frame, its shadow shifting subtly along with its motion. The camera tracks the ball smoothly, keeping it in focus while the background remains slightly blurred. The grass near the ball bends gently as it moves, and faint tire-like streaks mark its rolling path."
      }},
      {{
        "prompt": "The ball has rolled halfway across the frame, now slightly scuffed from the grass. Its shadow elongates toward the right as the sun’s angle changes slightly. The camera adjusts to follow the motion, centering the ball, while a faint breeze ripples the distant tree line."
      }},
      {{
        "prompt": "The ball approaches the right side of the frame, moving slightly faster. The sunlight glints off its surface, and the shadow narrows as the ball slows near a small patch of clover. The camera pans slightly to keep the ball in view, with subtle grass movement maintaining realism."
      }},
      {{
        "prompt": "The red ball comes to a stop on the far-right edge of the frame, partially hidden in taller grass. Its shadow darkens slightly as the sun lowers, casting a warm golden light over the field. The breeze subsides, and the distant horizon grows dimmer as evening approaches."
      }}
    ]
  >> end of example

  Plot: 
  {plot}

  Output:
  """
)


NEXT_FRAME_PROMPT = dedent(
    """
  Your goal is is to generate a prompt that will generate the image frame based of the previous frames. These frames are given provided by a cinematographer, so make sure to capture specific movements, appearances, camera angles, and environmental details - all in a single flowing paragraph. Your output should only contain the prompt.

  Current frame:
  {current_frame}

  Previous frames:
  {previous_frames}
  """
)
