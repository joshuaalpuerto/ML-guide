import os
import cv2
from moviepy.editor import ImageClip, concatenate_videoclips, vfx


# Motivation https://www.reddit.com/r/StableDiffusion/comments/1evhrro/making_video_with_flux_images_workflow_included/
def create_video_from_images(
    video_file_name="sample-video.mp4",
    folder_path=".",
    interpolation_prefix="",
    frame_duration=0.8,
):
    # Step 1: Load and sort images
    image_files = sorted(
        [
            f
            for f in os.listdir(folder_path)
            if f.startswith(interpolation_prefix) and f.endswith(".jpg")
        ]
    )
    if not image_files:
        print("No images found in the specified folder.")
        return

    # Step 2: Create clips with fade effects
    clips = []
    for img in image_files:
        img_path = os.path.join(folder_path, img)
        clip = ImageClip(img_path).set_duration(frame_duration)
        clips.append(clip)

    # Step 3: Add cross-dissolve transitions
    if len(clips) > 1:
        # NOTE: uncomment if you want transition
        #     final_clips = [clips[0]]  # Start with the first clip
        #     for i in range(1, len(clips)):
        #         transition = clips[i].crossfadein(fade_duration)
        #         clips[i] = clips[i].set_start(final_clips[-1].end - fade_duration)
        #         final_clips.append(transition)

        final_clips = clips
        # Step 4: Concatenate the clips (forward only, no backward)
        final_video = concatenate_videoclips(final_clips, method="compose")

        # Step 5: Write to file
        output_path = os.path.join(folder_path, video_file_name)
        final_video.write_videofile(
            output_path,
            fps=25,
            codec="libx264",
            threads=8,
        )
        print(f"Video created successfully: {output_path}")
    else:
        print("Not enough clips for transition.")


def interpolate_frames(frame1, frame2, num_intermediate_frames=5):
    frame1_gray = cv2.cvtColor(frame1, cv2.COLOR_BGR2GRAY)
    frame2_gray = cv2.cvtColor(frame2, cv2.COLOR_BGR2GRAY)

    flow = cv2.calcOpticalFlowFarneback(
        frame1_gray, frame2_gray, None, 0.5, 3, 15, 3, 5, 1.2, 0
    )

    intermediate_frames = []
    for i in range(1, num_intermediate_frames + 1):
        alpha = i / (num_intermediate_frames + 1)
        intermediate_frame = cv2.addWeighted(frame1, 1 - alpha, frame2, alpha, 0)
        intermediate_frames.append(intermediate_frame)

    return intermediate_frames


def generate_interpolated_images(
    interpolation_prefix="interpolated_",
    folder_path=".",
):
    image_files = sorted([f for f in os.listdir(folder_path) if f.endswith(".jpg")])

    if len(image_files) < 2:
        print("Not enough images to interpolate.")
        return

    num_intermediate_frames = 5
    counter = 0  # Sequential numbering for filenames

    for i in range(len(image_files) - 1):
        frame1 = cv2.imread(os.path.join(folder_path, image_files[i]))
        frame2 = cv2.imread(os.path.join(folder_path, image_files[i + 1]))

        # Save the first frame only at the start of each iteration
        if i == 0:  # Save the first image only once
            interpolated_filename = f"{interpolation_prefix}{counter:04d}.jpg"
            cv2.imwrite(os.path.join(folder_path, interpolated_filename), frame1)
            counter += 1

        # Generate and save interpolated frames
        interpolated_frames = interpolate_frames(
            frame1, frame2, num_intermediate_frames
        )
        for frame in interpolated_frames:
            interpolated_filename = f"{interpolation_prefix}{counter:04d}.jpg"
            cv2.imwrite(os.path.join(folder_path, interpolated_filename), frame)
            counter += 1

    # Save the last frame exactly once
    final_frame = cv2.imread(os.path.join(folder_path, image_files[-1]))
    interpolated_filename = f"{interpolation_prefix}{counter:04d}.jpg"
    cv2.imwrite(os.path.join(folder_path, interpolated_filename), final_frame)
