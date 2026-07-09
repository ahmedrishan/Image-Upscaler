# upscaler.py
# Reusable Real-ESRGAN 4x Upscaler (Python 3.10 compatible)

import os
import math
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
        use_half=True,
        progress_callback=None
    ):
        self.scale = scale
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Upscaler initialized on device: {self.device}")
        self.progress_callback = progress_callback

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

    def _report_progress(self, current, total):
        if self.progress_callback:
            self.progress_callback(current, total)

    def _tile_process_with_progress(self):
        batch, channel, height, width = self.upsampler.img.shape
        output_height = height * self.upsampler.scale
        output_width = width * self.upsampler.scale
        output_shape = (batch, channel, output_height, output_width)

        self.upsampler.output = self.upsampler.img.new_zeros(output_shape)
        tiles_x = math.ceil(width / self.upsampler.tile_size)
        tiles_y = math.ceil(height / self.upsampler.tile_size)
        total_tiles = tiles_x * tiles_y
        self._report_progress(0, total_tiles)

        for y in range(tiles_y):
            for x in range(tiles_x):
                ofs_x = x * self.upsampler.tile_size
                ofs_y = y * self.upsampler.tile_size
                input_start_x = ofs_x
                input_end_x = min(ofs_x + self.upsampler.tile_size, width)
                input_start_y = ofs_y
                input_end_y = min(ofs_y + self.upsampler.tile_size, height)

                input_start_x_pad = max(input_start_x - self.upsampler.tile_pad, 0)
                input_end_x_pad = min(input_end_x + self.upsampler.tile_pad, width)
                input_start_y_pad = max(input_start_y - self.upsampler.tile_pad, 0)
                input_end_y_pad = min(input_end_y + self.upsampler.tile_pad, height)

                input_tile_width = input_end_x - input_start_x
                input_tile_height = input_end_y - input_start_y
                tile_idx = y * tiles_x + x + 1
                input_tile = self.upsampler.img[
                    :,
                    :,
                    input_start_y_pad:input_end_y_pad,
                    input_start_x_pad:input_end_x_pad,
                ]

                try:
                    with torch.no_grad():
                        output_tile = self.upsampler.model(input_tile)
                except RuntimeError as error:
                    print("Error", error)
                    raise

                print(f"\tTile {tile_idx}/{total_tiles}")
                self._report_progress(tile_idx, total_tiles)

                output_start_x = input_start_x * self.upsampler.scale
                output_end_x = input_end_x * self.upsampler.scale
                output_start_y = input_start_y * self.upsampler.scale
                output_end_y = input_end_y * self.upsampler.scale

                output_start_x_tile = (input_start_x - input_start_x_pad) * self.upsampler.scale
                output_end_x_tile = output_start_x_tile + input_tile_width * self.upsampler.scale
                output_start_y_tile = (input_start_y - input_start_y_pad) * self.upsampler.scale
                output_end_y_tile = output_start_y_tile + input_tile_height * self.upsampler.scale

                self.upsampler.output[
                    :,
                    :,
                    output_start_y:output_end_y,
                    output_start_x:output_end_x,
                ] = output_tile[
                    :,
                    :,
                    output_start_y_tile:output_end_y_tile,
                    output_start_x_tile:output_end_x_tile,
                ]

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

        original_tile_process = self.upsampler.tile_process
        self.upsampler.tile_process = self._tile_process_with_progress
        try:
            output, _ = self.upsampler.enhance(
                image, outscale=self.scale
            )
        finally:
            self.upsampler.tile_process = original_tile_process

        return output

    def upscale_and_save(self, image, output_path):
        output = self.upscale(image)
        Image.fromarray(output).save(output_path)
        return output_path
