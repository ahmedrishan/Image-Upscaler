import json
import subprocess
import shutil
from pathlib import Path

class VideoUtils:
    """
    VideoUtils handles video extraction, rebuilding, and audio manipulation using FFmpeg/FFprobe.
    """
    def __init__(self):
        # Initialize configurations, custom FFmpeg paths, and verify installation.
        pass

    @staticmethod
    def get_video_info(video_path: Path) -> dict:
        """
        Runs ffprobe to extract information about the video.
        
        Args:
            video_path: Path to the input video file.
            
        Returns:
            dict: A dictionary containing:
                - width (int)
                - height (int)
                - fps (float)
                - duration (float)
                - codec_name (str)
                - has_audio (bool)
                
        Raises:
            FileNotFoundError: If the input video path does not exist.
            RuntimeError: If ffprobe execution fails or yields invalid output.
        """
        video_path = Path(video_path)
        if not video_path.exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")

        cmd = [
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_streams",
            "-show_format",
            str(video_path)
        ]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            data = json.loads(result.stdout)
        except FileNotFoundError as e:
            raise RuntimeError(
                "ffprobe is not installed or not found in the system PATH. "
                "Please install FFmpeg/FFprobe and add them to your environment variables."
            ) from e
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"ffprobe execution failed: {e.stderr or e.stdout or str(e)}")
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Failed to parse ffprobe JSON output: {str(e)}")

        streams = data.get("streams", [])
        v_stream = next((s for s in streams if s.get("codec_type") == "video"), None)
        a_stream = next((s for s in streams if s.get("codec_type") == "audio"), None)
        fmt = data.get("format", {})

        if not v_stream:
            raise ValueError(f"No video stream found in: {video_path}")

        # Extract FPS
        r_frame_rate = v_stream.get("r_frame_rate", "0/0")
        fps = 0.0
        if "/" in r_frame_rate:
            try:
                num, den = map(int, r_frame_rate.split("/"))
                if den != 0:
                    fps = num / den
            except (ValueError, ZeroDivisionError):
                pass
        else:
            try:
                fps = float(r_frame_rate)
            except ValueError:
                pass

        # Extract Duration
        duration = 0.0
        for source in (fmt, v_stream):
            dur_str = source.get("duration")
            if dur_str:
                try:
                    duration = float(dur_str)
                    break
                except ValueError:
                    pass

        # Extract Frame Count
        nb_frames_str = v_stream.get("nb_frames")
        frame_count = 0
        if nb_frames_str and nb_frames_str != "N/A":
            try:
                frame_count = int(nb_frames_str)
            except ValueError:
                pass
        if frame_count <= 0:
            frame_count = int(duration * fps)

        return {
            "width": int(v_stream.get("width", 0)),
            "height": int(v_stream.get("height", 0)),
            "fps": fps,
            "duration": duration,
            "codec_name": v_stream.get("codec_name", "unknown"),
            "has_audio": a_stream is not None,
            "frame_count": frame_count
        }

    @staticmethod
    def extract_frames(video_path: Path, frames_dir: Path) -> list[Path]:
        """
        Extracts all frames of the video as png images inside frames_dir.
        
        Args:
            video_path: Path to the input video file.
            frames_dir: Path to directory where extracted PNG frames will be saved.
            
        Returns:
            list[Path]: A list of Paths to the extracted frame files, sorted alphabetically.
            
        Raises:
            FileNotFoundError: If the input video path does not exist.
            RuntimeError: If ffmpeg extraction execution fails.
        """
        video_path = Path(video_path)
        frames_dir = Path(frames_dir)
        
        if not video_path.exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")
            
        frames_dir.mkdir(parents=True, exist_ok=True)
        
        # %08d.png gives frames named 00000001.png, 00000002.png, etc.
        output_pattern = frames_dir / "%08d.png"
        
        cmd = [
            "ffmpeg",
            "-y",
            "-i", str(video_path),
            "-q:v", "2",
            str(output_pattern)
        ]
        
        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
        except FileNotFoundError as e:
            raise RuntimeError(
                "ffmpeg is not installed or not found in the system PATH. "
                "Please install FFmpeg and add it to your environment variables."
            ) from e
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"ffmpeg frame extraction failed: {e.stderr or e.stdout or str(e)}")
            
        frames = sorted(list(frames_dir.glob("*.png")))
        return frames

    @staticmethod
    def extract_audio(video_path: Path, output_audio: Path) -> bool:
        """
        Extracts audio track from a video.
        
        Args:
            video_path: Path to the input video file.
            output_audio: Path to save the extracted audio stream.
            
        Returns:
            bool: True if audio was successfully extracted, False if no audio stream exists.
            
        Raises:
            FileNotFoundError: If the input video path does not exist.
            RuntimeError: If ffmpeg audio extraction execution fails.
        """
        video_path = Path(video_path)
        output_audio = Path(output_audio)
        
        if not video_path.exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")
            
        # Inspect for audio stream
        info = VideoUtils.get_video_info(video_path)
        if not info.get("has_audio", False):
            return False
            
        output_audio.parent.mkdir(parents=True, exist_ok=True)
        
        cmd = [
            "ffmpeg",
            "-y",
            "-i", str(video_path),
            "-vn",
            str(output_audio)
        ]
        
        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            return True
        except FileNotFoundError as e:
            raise RuntimeError(
                "ffmpeg is not installed or not found in the system PATH. "
                "Please install FFmpeg and add it to your environment variables."
            ) from e
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"ffmpeg audio extraction failed: {e.stderr or e.stdout or str(e)}")

    @staticmethod
    def rebuild_video(frames_dir: Path, fps: float, output_video: Path) -> Path:
        """
        Reconstructs a video from individual frame files in frames_dir.
        
        Args:
            frames_dir: Path to directory containing frame files (PNG).
            fps: Target frames per second.
            output_video: Path to save the reconstructed video file.
            
        Returns:
            Path: Path to the reconstructed video file.
            
        Raises:
            FileNotFoundError: If frames_dir does not exist or has no PNG frames.
            RuntimeError: If ffmpeg reconstruction fails.
        """
        frames_dir = Path(frames_dir)
        output_video = Path(output_video)
        
        if not frames_dir.exists() or not frames_dir.is_dir():
            raise FileNotFoundError(f"Frames directory not found or invalid: {frames_dir}")
            
        frames = list(frames_dir.glob("*.png"))
        if not frames:
            raise FileNotFoundError(f"No PNG frames found in directory: {frames_dir}")
            
        output_video.parent.mkdir(parents=True, exist_ok=True)
        
        input_pattern = frames_dir / "%08d.png"
        
        cmd = [
            "ffmpeg",
            "-y",
            "-framerate", str(fps),
            "-i", str(input_pattern),
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            str(output_video)
        ]
        
        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            return output_video
        except FileNotFoundError as e:
            raise RuntimeError(
                "ffmpeg is not installed or not found in the system PATH. "
                "Please install FFmpeg and add it to your environment variables."
            ) from e
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"ffmpeg video rebuild failed: {e.stderr or e.stdout or str(e)}")

    @staticmethod
    def merge_audio(video_without_audio: Path, audio_file: Path, final_output: Path) -> Path:
        """
        Merges a video stream and audio stream into a single output file.
        If audio_file is not valid or doesn't exist, copies video_without_audio to final_output.
        
        Args:
            video_without_audio: Path to input video file (typically without audio).
            audio_file: Path to input audio file.
            final_output: Path to save the final merged file.
            
        Returns:
            Path: Path to the final merged file.
            
        Raises:
            FileNotFoundError: If input video file does not exist.
            RuntimeError: If ffmpeg merging fails.
        """
        video_without_audio = Path(video_without_audio)
        audio_file = Path(audio_file) if audio_file else None
        final_output = Path(final_output)
        
        if not video_without_audio.exists():
            raise FileNotFoundError(f"Input video file not found: {video_without_audio}")
            
        final_output.parent.mkdir(parents=True, exist_ok=True)
        
        # If audio_file does not exist, copy the video directly
        if not audio_file or not audio_file.exists():
            shutil.copy2(video_without_audio, final_output)
            return final_output
            
        # Try stream copy first for maximum speed and quality preservation
        cmd = [
            "ffmpeg",
            "-y",
            "-i", str(video_without_audio),
            "-i", str(audio_file),
            "-c:v", "copy",
            "-c:a", "copy",
            "-map", "0:v:0",
            "-map", "1:a:0",
            "-shortest",
            str(final_output)
        ]
        
        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            return final_output
        except FileNotFoundError as e:
            raise RuntimeError(
                "ffmpeg is not installed or not found in the system PATH. "
                "Please install FFmpeg and add it to your environment variables."
            ) from e
        except subprocess.CalledProcessError:
            # Fallback to transcoding the audio to AAC if copy fails (e.g., container format mismatch)
            cmd_transcode = [
                "ffmpeg",
                "-y",
                "-i", str(video_without_audio),
                "-i", str(audio_file),
                "-c:v", "copy",
                "-c:a", "aac",
                "-map", "0:v:0",
                "-map", "1:a:0",
                "-shortest",
                str(final_output)
            ]
            try:
                subprocess.run(cmd_transcode, capture_output=True, text=True, check=True)
                return final_output
            except FileNotFoundError as e:
                raise RuntimeError(
                    "ffmpeg is not installed or not found in the system PATH. "
                    "Please install FFmpeg and add it to your environment variables."
                ) from e
            except subprocess.CalledProcessError as e_transcode:
                raise RuntimeError(
                    f"ffmpeg audio merge failed (copy and transcoding fallback failed): "
                    f"{e_transcode.stderr or e_transcode.stdout or str(e_transcode)}"
                )

    @staticmethod
    def cleanup_temp_directory(temp_directory: Path) -> bool:
        """
        Cleans up and removes the temporary directory recursively.
        
        Args:
            temp_directory: Path to temporary directory.
            
        Returns:
            bool: True if folder was cleaned up, False if directory did not exist.
            
        Raises:
            RuntimeError: If cleanup fails.
        """
        temp_directory = Path(temp_directory)
        if temp_directory.exists() and temp_directory.is_dir():
            try:
                shutil.rmtree(temp_directory)
                return True
            except Exception as e:
                raise RuntimeError(f"Failed to clean up temp directory {temp_directory}: {str(e)}")
        return False
