from pathlib import Path
import shutil
import uuid
import logging
import gc
from video_utils import VideoUtils

try:
    import torch  # type: ignore
except ImportError:
    torch = None

logger = logging.getLogger("video_upscaler")

class VideoUpscaler:
    """
    VideoUpscaler orchestrates the entire video upscaling workflow, including metadata reading,
    frame extraction, frame-by-frame processing (upscaling), audio extraction, rebuilding,
    and audio/video merging.
    """
    def __init__(self, upload_dir: Path, output_dir: Path, temp_dir: Path, upscaler=None):
        """
        Initializes the VideoUpscaler with base directories and shared upscaler instance.
        
        Args:
            upload_dir: Directory where uploaded files are stored.
            output_dir: Directory where processed output files will be saved.
            temp_dir: Base directory for temporary workspaces.
            upscaler: Shared RealESRGANUpscaler instance.
        """
        self.upload_dir = Path(upload_dir)
        self.output_dir = Path(output_dir)
        self.temp_dir = Path(temp_dir)
        self.upscaler = upscaler
        
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        
        # Ensure thread-safety lock is present on the shared upscaler
        if self.upscaler is not None and not hasattr(self.upscaler, 'lock'):
            from threading import Lock
            self.upscaler.lock = Lock()

    def process_frame(self, frame_path: Path, output_frame_path: Path) -> Path:
        """
        Upscales a single video frame using the shared RealESRGANUpscaler.
        If no upscaler is registered, falls back to copying.
        
        Args:
            frame_path: Path to the input frame image.
            output_frame_path: Path where the processed frame image should be saved.
            
        Returns:
            Path: Path to the processed frame image.
        """
        frame_path = Path(frame_path)
        output_frame_path = Path(output_frame_path)
        
        if self.upscaler is not None:
            # Synchronize model calls to avoid concurrent GPU inference issues
            with self.upscaler.lock:
                self.upscaler.upscale_and_save(str(frame_path), str(output_frame_path))
            
            # Release GPU VRAM cache dynamically after processing
            if torch is not None and torch.cuda.is_available():
                torch.cuda.empty_cache()
        else:
            shutil.copy2(frame_path, output_frame_path)
            
        return output_frame_path

    def upscale_video(self, video_path: Path, job_id: str = None, job_manager = None) -> Path:
        """
        Runs the full video upscaling pipeline:
        1. Read metadata
        2. Extract frames
        3. Extract audio (if present)
        4. Process frames one by one (placeholder for AI upscale)
        5. Rebuild video from processed frames
        6. Merge original audio with the rebuilt video
        7. Clean up temporary frame folders
        
        Args:
            video_path: Path to the input video file.
            job_id: Optional ID of the job for progress tracking.
            job_manager: Optional JobManager instance for progress reporting.
            
        Returns:
            Path: Path to the final output video file.
            
        Raises:
            FileNotFoundError: If the input video path does not exist.
            RuntimeError: If any pipeline stage fails.
        """
        video_path = Path(video_path)
        if not video_path.exists():
            raise FileNotFoundError(f"Input video file not found: {video_path}")

        # Establish job directory
        if job_id and job_manager:
            try:
                job_info = job_manager.get_progress(job_id)
                job_dir = Path(job_info["job_dir"])
            except KeyError:
                raise RuntimeError(f"Job ID '{job_id}' not registered in JobManager.")
        else:
            # Standalone execution
            job_id = f"standalone_{uuid.uuid4()}"
            job_dir = self.temp_dir / job_id
            
        job_dir.mkdir(parents=True, exist_ok=True)

        raw_frames_dir = job_dir / "raw_frames"
        processed_frames_dir = job_dir / "processed_frames"
        raw_frames_dir.mkdir(parents=True, exist_ok=True)
        processed_frames_dir.mkdir(parents=True, exist_ok=True)
        
        audio_path = job_dir / "extracted_audio.aac"
        rebuilt_video_no_audio = job_dir / "rebuilt_no_audio.mp4"
        final_output_path = self.output_dir / f"upscaled_{video_path.name}"

        # Setup reporting helper
        def report(stage: str, status: str = "processing", current: int = 0, total: int = 0, error: str = None):
            if job_manager and job_id:
                try:
                    job_manager.update_progress(
                        job_id=job_id,
                        status=status,
                        current_stage=stage,
                        current_frame=current,
                        total_frames=total,
                        error=error
                    )
                except KeyError:
                    pass

        logger.info(f"Starting video upscaling pipeline for {video_path} (Job: {job_id})")
        try:
            # 1. Read Metadata
            logger.info("Stage 1: Reading video metadata info")
            report("analyzing")
            info = VideoUtils.get_video_info(video_path)
            fps = info.get("fps", 24.0)
            has_audio = info.get("has_audio", False)
            logger.info(f"Metadata read successfully. FPS={fps}, Has Audio={has_audio}")

            # 2. Extract Frames
            logger.info("Stage 2: Extracting raw video frames")
            report("extracting_frames")
            extracted_frames = VideoUtils.extract_frames(video_path, raw_frames_dir)
            total_frames = len(extracted_frames)
            logger.info(f"Extracted {total_frames} frames successfully.")
            if total_frames == 0:
                raise RuntimeError("No frames were extracted from the video.")

            # Free memory after frame extraction
            gc.collect()

            # 3. Extract Audio
            audio_extracted = False
            if has_audio:
                logger.info("Stage 3: Extracting audio track")
                audio_extracted = VideoUtils.extract_audio(video_path, audio_path)
                logger.info(f"Audio extraction status: {audio_extracted}")

            # 4. Process Frames
            logger.info("Stage 4: Upscaling frames page-by-page using RealESRGAN")
            report("upscaling", current=0, total=total_frames)
            for idx, frame_path in enumerate(extracted_frames):
                out_frame_path = processed_frames_dir / frame_path.name
                self.process_frame(frame_path, out_frame_path)
                
                # Perform garbage collection periodically during upscaling
                if (idx + 1) % 10 == 0:
                    gc.collect()
                    
                report("upscaling", current=idx + 1, total=total_frames)
            logger.info("Frame upscaling completed.")

            # Free GPU memory after frame upscaling loop
            gc.collect()
            if torch is not None and torch.cuda.is_available():
                torch.cuda.empty_cache()

            # 5. Rebuild Video
            logger.info("Stage 5: Rebuilding video from processed frames")
            report("rebuilding")
            VideoUtils.rebuild_video(processed_frames_dir, fps, rebuilt_video_no_audio)
            logger.info("Video rebuild completed successfully.")

            # 6. Merge Audio
            logger.info("Stage 6: Merging original audio with upscaled video")
            report("merging_audio")
            actual_audio = audio_path if audio_extracted else None
            VideoUtils.merge_audio(rebuilt_video_no_audio, actual_audio, final_output_path)
            logger.info(f"Audio merge completed. Output saved at: {final_output_path}")

            # Completion
            report("completed", status="complete", current=total_frames, total=total_frames)
            if job_manager and job_id:
                try:
                    job_manager.update_progress(job_id=job_id, output_path=str(final_output_path))
                except KeyError:
                    pass
            return final_output_path

        except Exception as e:
            logger.error(f"Video upscaling pipeline failed: {str(e)}", exc_info=True)
            report("error", status="error", error=str(e))
            raise RuntimeError(f"Video upscaling pipeline failed: {str(e)}") from e
            
        finally:
            logger.info("Cleaning up pipeline workspace directory files")
            # Clean up frame directories to release disk space.
            # Do not let cleanup exceptions shadow the primary exception.
            try:
                VideoUtils.cleanup_temp_directory(raw_frames_dir)
            except Exception as err:
                logger.warning(f"Error cleaning raw_frames_dir: {err}")
                
            try:
                VideoUtils.cleanup_temp_directory(processed_frames_dir)
            except Exception as err:
                logger.warning(f"Error cleaning processed_frames_dir: {err}")
                
            if audio_path.exists():
                try:
                    audio_path.unlink()
                except OSError as err:
                    logger.warning(f"Error deleting temp audio file {audio_path}: {err}")
                    
            if rebuilt_video_no_audio.exists():
                try:
                    rebuilt_video_no_audio.unlink()
                except OSError as err:
                    logger.warning(f"Error deleting rebuilt video file {rebuilt_video_no_audio}: {err}")
            
            # If standalone, delete the whole job directory since we have no JobManager tracking
            if not job_manager:
                try:
                    VideoUtils.cleanup_temp_directory(job_dir)
                except Exception as err:
                    logger.warning(f"Error cleaning job_dir {job_dir}: {err}")
                    
            # Final CUDA cache clearing
            gc.collect()
            if torch is not None and torch.cuda.is_available():
                torch.cuda.empty_cache()
