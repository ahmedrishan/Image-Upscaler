# upscaler.py
# Reusable Real-ESRGAN 4x Upscaler (Python 3.10 compatible)

import os
import requests
import torch
import numpy as np
from PIL import Image

from realesrgan import RealESRGANer
from basicsr.archs.rrdbnet_arch import RRDBNet


class RealESRGANUpscaler:
    """
    Reusable Real-ESRGAN Upscaler

    Example:
        upscaler = RealESRGANUpscaler()
        output = upscaler.upscale("input.jpg")
    """

    def __init__(
        self,
        scale=4,
        weights_dir="weights",
        tile=0,
        tile_pad=10,
        use_half=True
    ):
        self.scale = scale
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        self.weights_dir = weights_dir
        os.makedirs(self.weights_dir, exist_ok=True)

        self.model_path = os.path.join(
            self.weights_dir, "RealESRGAN_x4plus.pth"
        )

        self._download_weights()
        self._load_model(tile, tile_pad, use_half)

    # -------------------------------------------------
    # Download weights (runs only once)
    # -------------------------------------------------
    def _download_weights(self):
        if os.path.exists(self.model_path):
            return

        print("Downloading Real-ESRGAN weights...")
        url = (
            "https://github.com/xinntao/Real-ESRGAN/"
            "releases/download/v0.1.0/RealESRGAN_x4plus.pth"
        )
        response = requests.get(url, stream=True)
        response.raise_for_status()

        with open(self.model_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        print("Weights downloaded.")

    # -------------------------------------------------
    # Initialize model
    # -------------------------------------------------
    def _load_model(self, tile, tile_pad, use_half):
        model = RRDBNet(
            num_in_ch=3,
            num_out_ch=3,
            num_feat=64,
            num_block=23,
            num_grow_ch=32,
            scale=self.scale
        )

        self.upsampler = RealESRGANer(
            scale=self.scale,
            model_path=self.model_path,
            model=model,
            tile=tile,
            tile_pad=tile_pad,
            pre_pad=0,
            half=use_half and self.device == "cuda",
            device=self.device
        )

    # -------------------------------------------------
    # Public API
    # -------------------------------------------------
    def upscale(self, image):
        """
        image: str path | PIL.Image | numpy array
        returns: numpy array (upscaled image)
        """

        if isinstance(image, str):
            image = Image.open(image).convert("RGB")
            image = np.array(image)
        elif isinstance(image, Image.Image):
            image = np.array(image)

        output, _ = self.upsampler.enhance(
            image, outscale=self.scale
        )
        return output

    def upscale_and_save(self, image, output_path):
        output = self.upscale(image)
        Image.fromarray(output).save(output_path)
        return output_path
