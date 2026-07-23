import uuid
import shutil
from pathlib import Path
from threading import Lock

class JobManager:
    """
    JobManager is responsible for managing asynchronous jobs, creating temporary directories,
    and tracking job status, stage, and frame-by-frame progress in-memory.
    """
    
    # Supported stages of video upscaling
    SUPPORTED_STAGES = {
        "uploaded",
        "analyzing",
        "extracting_frames",
        "upscaling",
        "rebuilding",
        "merging_audio",
        "completed",
        "error"
    }

    def __init__(self, jobs_dir: Path):
        """
        Initializes the JobManager.
        
        Args:
            jobs_dir: The directory where temporary job-specific folders will be created.
        """
        self.jobs_dir = Path(jobs_dir)
        self.jobs_dir.mkdir(parents=True, exist_ok=True)
        self.jobs = {}
        self.lock = Lock()

    def create_job(self) -> str:
        """
        Generates a unique job ID, creates a temporary workspace folder for the job,
        and initializes its state in-memory.
        
        Returns:
            str: The generated unique job ID.
        """
        job_id = str(uuid.uuid4())
        job_dir = self.jobs_dir / job_id
        
        # Create directory
        job_dir.mkdir(parents=True, exist_ok=True)
        
        with self.lock:
            self.jobs[job_id] = {
                "job_id": job_id,
                "job_dir": job_dir,
                "status": "uploaded",
                "progress": 0.0,
                "current_stage": "uploaded",
                "current_frame": 0,
                "total_frames": 0,
                "error": None,
                "video_path": None,
                "output_path": None
            }
            
        return job_id

    def update_progress(
        self,
        job_id: str,
        status: str = None,
        progress: float = None,
        current_stage: str = None,
        current_frame: int = None,
        total_frames: int = None,
        error: str = None,
        video_path: str = None,
        output_path: str = None
    ) -> None:
        """
        Updates the progress and details of a job in-memory.
        
        Args:
            job_id: The ID of the job to update.
            status: Optional new overall status (e.g. 'processing', 'completed', 'failed').
            progress: Optional explicit progress percentage (0.0 to 100.0).
            current_stage: Optional current processing stage. Must be one of SUPPORTED_STAGES.
            current_frame: Optional index of the frame currently being processed.
            total_frames: Optional total count of frames in the video.
            error: Optional error message string if an error occurred.
            
        Raises:
            KeyError: If the job_id does not exist.
            ValueError: If an unsupported stage is supplied.
        """
        if current_stage is not None and current_stage not in self.SUPPORTED_STAGES:
            raise ValueError(
                f"Unsupported stage: '{current_stage}'. "
                f"Must be one of: {sorted(list(self.SUPPORTED_STAGES))}"
            )

        with self.lock:
            if job_id not in self.jobs:
                raise KeyError(f"Job ID '{job_id}' not found.")
                
            job = self.jobs[job_id]
            
            if status is not None:
                job["status"] = status
            if current_stage is not None:
                job["current_stage"] = current_stage
            if current_frame is not None:
                job["current_frame"] = current_frame
            if total_frames is not None:
                job["total_frames"] = total_frames
            if error is not None:
                job["error"] = error
            if video_path is not None:
                job["video_path"] = video_path
            if output_path is not None:
                job["output_path"] = output_path
                
            # Compute automatic progress if frames are given and progress is not explicitly passed
            if progress is not None:
                job["progress"] = max(0.0, min(100.0, float(progress)))
            elif current_frame is not None and total_frames is not None and total_frames > 0:
                calc_progress = (current_frame / total_frames) * 100.0
                job["progress"] = max(0.0, min(100.0, round(calc_progress, 2)))

    def get_progress(self, job_id: str) -> dict:
        """
        Retrieves the current progress information of a job.
        
        Args:
            job_id: The ID of the job to retrieve.
            
        Returns:
            dict: The copy of the job's tracking state dictionary.
            
        Raises:
            KeyError: If the job_id does not exist.
        """
        with self.lock:
            if job_id not in self.jobs:
                raise KeyError(f"Job ID '{job_id}' not found.")
            return dict(self.jobs[job_id])

    def delete_job(self, job_id: str) -> None:
        """
        Removes the job from the in-memory dictionary and deletes its temporary directory.
        
        Args:
            job_id: The ID of the job to delete.
            
        Raises:
            KeyError: If the job_id does not exist.
        """
        with self.lock:
            if job_id not in self.jobs:
                raise KeyError(f"Job ID '{job_id}' not found.")
            job = self.jobs[job_id]
            job_dir = job.get("job_dir")
            
        # Clean up directory on disk safely outside the lock to avoid slow I/O blocks
        if job_dir and job_dir.exists() and job_dir.is_dir():
            shutil.rmtree(job_dir, ignore_errors=True)
            
        with self.lock:
            if job_id in self.jobs:
                del self.jobs[job_id]
