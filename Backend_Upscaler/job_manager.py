from pathlib import Path

class JobManager:
    """
    JobManager is responsible for managing asynchronous jobs/tasks, scheduling, queueing,
    and querying the status of long-running upscaling jobs.
    """
    def __init__(self, jobs_dir: Path):
        self.jobs_dir = Path(jobs_dir)
        self.jobs = {}
        # TODO: Initialize database, status storage, or job locks as needed for queue management.

    # TODO: Implement create_job(video_path: Path) -> str
    # TODO: Implement start_job(job_id: str) -> None
    # TODO: Implement get_job_status(job_id: str) -> dict
    # TODO: Implement cancel_job(job_id: str) -> None
    # TODO: Implement list_jobs() -> list
