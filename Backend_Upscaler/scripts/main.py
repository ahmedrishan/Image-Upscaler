# main.py
# Example usage of the reusable Real-ESRGAN model

import sys
import os

# Add parent directory to path to allow importing upscaler
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from upscaler import RealESRGANUpscaler
import random

def main():
    upscaler = RealESRGANUpscaler(
        tile=256  # safer for GPUs with limited VRAM
    )

    num=random.randint(1,10)

    input_image = "input.jpg"     # put your image here
    output_image = f"output_{num}.jpg"

    # Ensure input image exists to avoid errors if run blindly
    if not os.path.exists(input_image):
        print(f"Warning: {input_image} not found. Please place an image named 'input.jpg' in the parent directory or update the script.")
        # Try to look in parent dir if running from scripts/
        parent_input = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "input.jpg")
        if os.path.exists(parent_input):
            input_image = parent_input
            print(f"Found input image at {input_image}")
        else:
             print("Skipping processing as no input image found.")
             return

    upscaler.upscale_and_save(
        input_image,
        output_image
    )

    print(f"Upscaled image saved as {output_image}")

if __name__ == "__main__":
    main()
