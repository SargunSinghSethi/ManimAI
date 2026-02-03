import os
from pathlib import Path
import time
import shutil

class FileManager:
    def __init__(self):
        self.output_dir = Path('output')
        self.cleanup_age = 3600 * 24  # 24 hours
    
    def get_download_url(self, job_uuid):
        """Get download URL for video file"""
        # Check main output directory
        video_path = self.output_dir / job_uuid / f"{job_uuid}.mp4"
        
        if video_path.exists():
            file_size = video_path.stat().st_size
            return {
                'download_url': f'/download/file/{job_uuid}.mp4',
                'file_size': file_size,
                'expires_in': self.cleanup_age
            }
        return None
    
    def cleanup_old_files(self):
        """Clean up old video files and directories"""
        try:
            current_time = time.time()
            for job_dir in self.output_dir.iterdir():
                if job_dir.is_dir():
                    dir_age = current_time - job_dir.stat().st_mtime
                    if dir_age > self.cleanup_age:
                        shutil.rmtree(job_dir)
                        print(f"Cleaned up old job directory: {job_dir}")
        except Exception as e:
            print(f"Error during cleanup: {e}")
