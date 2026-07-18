from pathlib import Path

class VideoUpscaler:
    """
    VideoUpscaler orchestrates the entire video upscaling workflow, including metadata reading,
    frame extraction, frame-by-frame processing (upscaling), audio extraction, rebuilding,
    and audio/video merging.
    """
    def __init__(self, upload_dir: Path, output_dir: Path, temp_dir: Path):
        self.upload_dir = Path(upload_dir)
        self.output_dir = Path(output_dir)
        self.temp_dir = Path(temp_dir)
        # TODO: Initialize RealESRGANUpscaler or placeholders for AI models in future phases.

    # TODO: Implement read_metadata(video_path: Path) -> dict
    # TODO: Implement extract_frames(video_path: Path) -> Path
    # TODO: Implement extract_audio(video_path: Path) -> Path
    # TODO: Implement upscale_frames(frames_dir: Path) -> Path
    # TODO: Implement rebuild_video(frames_dir: Path, fps: float) -> Path
    # TODO: Implement merge_audio(video_path: Path, audio_file: Path, output_video: Path) -> Path
    # TODO: Implement upscale_video_pipeline(video_path: Path) -> Path
