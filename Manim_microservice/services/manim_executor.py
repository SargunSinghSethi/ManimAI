import os
import tempfile
import time
import json
import uuid
from pathlib import Path
import docker
import shutil
import threading
import queue

from services.s3_manager import upload_file_to_s3
class ManimExecutor:
    def __init__(self):
        self.output_dir = Path('output')
        self.temp_dir = Path('temp')
        self.jobs = {}  # In-memory job tracking
        
        # Ensure directories exist
        self.output_dir.mkdir(exist_ok=True)
        self.temp_dir.mkdir(exist_ok=True)
        
        # Initialize Docker client
        try:
            self.docker_client = docker.from_env()
            self.container = None
            self._start_persistent_container()
            print("Persistent Docker container initialized successfully")
        except Exception as e:
            print(f"Failed to initialize Docker client: {e}")
            self.docker_client = None
            self.container = None
    
    def _start_persistent_container(self):
        """Start a persistent Docker container for Manim execution"""
        try:
            # Pull latest manim image if needed
            self.docker_client.images.pull("manimcommunity/manim:latest")
            
            # Create volumes for persistent container
            container_temp_dir = "/manim/temp"
            container_output_dir = "/manim/output"

            container_name = f"manim-worker-{uuid.uuid4().hex[:8]}"
            
            # Start persistent container with sleep to keep it running
            self.container = self.docker_client.containers.run(
                image="manimcommunity/manim:latest",
                command="sleep infinity",  # Keep container alive
                volumes={
                    str(self.temp_dir.absolute()): {'bind': container_temp_dir, 'mode': 'rw'},
                    str(self.output_dir.absolute()): {'bind': container_output_dir, 'mode': 'rw'}
                },
                detach=True,
                name=container_name,
                remove=True  # Auto-remove when stopped
            )
            
            print(f"Started persistent container: {self.container.id[:12]}")
            
        except Exception as e:
            print(f"Failed to start persistent container: {e}")
            self.container = None
    
    def get_manim_version(self):
        """Get Manim version from Docker container"""
        if not self.container:
            return "Container not available"
        
        try:
            result = self.container.exec_run("manim --version")
            return result.output.decode('utf-8').strip()
        except Exception as e:
            return f"Container error: {str(e)}"
    
    def process_job(self, job_uuid, code, config):
        """
        Main job processing function with your S3 upload
        """
        try:
            self.jobs[job_uuid] = {'status': 'running', 'start_time': time.time()}
            
            print(f"PROMPT: Starting job {job_uuid}")
            
            # Step 1: Execute Manim code in persistent container  
            print("EXECUTING IN PERSISTENT DOCKER CONTAINER")
            result = self._run_code_in_persistent_container(job_uuid, code, config)
            
            if result["status"] == "success":
                print(f"VIDEO PATH = {result['video_path']}")
                
                # Step 2: Upload to S3 using your function
                print("UPLOADING TO S3")
                s3_result = upload_file_to_s3(
                    result['video_path'], 
                    object_name=f"videos/{job_uuid}.mp4"  # ✅ Use job_uuid as filename
                )
                
                print(s3_result)
                if s3_result["status"] == "success":
                    # Step 3: Clean up local file after successful upload

                    if os.path.exists(result['video_path']):
                        os.remove(result['video_path'])
                        print(f"Cleaned up local file: {result['video_path']}")
                    
                    self.jobs[job_uuid] = {
                        'status': 'completed',
                        'video_url': s3_result['url'],  # ✅ S3 URL from your function
                        'file_size': result.get('file_size', 0),
                        'completion_time': time.time()
                    }
                    print("SUCCESS")
                    return {
                        'success': True,
                        'video_path': s3_result['url'],  # ✅ S3 URL returned
                        'file_size': result.get('file_size', 0)
                    }
                else:
                    # S3 Upload failed
                    error_msg = f"S3 Upload Error: {s3_result['message']}"
                    self.jobs[job_uuid] = {'status': 'failed', 'error': error_msg}
                    return {'success': False, 'error': error_msg}
            else:
                # Manim execution failed
                error_msg = result.get("error", "Unknown error during execution")
                self.jobs[job_uuid] = {'status': 'failed', 'error': error_msg}
                return {'success': False, 'error': error_msg}
                
        except Exception as e:
            error_msg = f"Exception: {str(e)}"
            self.jobs[job_uuid] = {'status': 'failed', 'error': error_msg}
            return {'success': False, 'error': error_msg}
    
    def _run_code_in_persistent_container(self, job_uuid, code, config):
        """
        Execute Manim code in the persistent Docker container
        """
        try:
            if not self.container:
                raise Exception("Persistent container not available")
            
            # Check if container is still running
            self.container.reload()
            if self.container.status != 'running':
                print("Container stopped, restarting...")
                self._start_persistent_container()
            
            # Clean and validate code
            cleaned_code = self._clean_code(code)
            scene_class = self._extract_scene_class(cleaned_code)
            
            if not scene_class:
                raise Exception("No Scene class found in the provided code")
            
            # Create job-specific temp file
            python_file_path = self.temp_dir / f"{job_uuid}.py"
            with open(python_file_path, 'w') as f:
                f.write(cleaned_code)
            
            # Determine quality settings
            quality_map = {
                'low': '-ql',
                'medium': '-qm',  
                'high': '-qh'
            }
            quality_flag = quality_map.get(config.get('quality', 'medium'), '-qm')
            
            # Container paths
            container_python_file = f"/manim/temp/{job_uuid}.py"
            container_output_file = f"/manim/output/{job_uuid}.mp4"
            
            # Build command for execution inside container
            manim_cmd = [
                'manim',
                container_python_file,
                scene_class,
                quality_flag,
                '--disable_caching',
                '--output_file', container_output_file
            ]
            
            cmd_string = ' '.join(manim_cmd)
            print(f"Executing in container: {cmd_string}")
            
            # Execute command in persistent container
            result = self.container.exec_run(
                cmd_string,
                stdout=True,
                stderr=True
            )
            
            # Check execution result
            if result.exit_code == 0:
                # Success - check if file was created
                output_file = self.output_dir / f"{job_uuid}.mp4"
                
                if output_file.exists():
                    file_size = output_file.stat().st_size
                    print(f"VIDEO PATH = {output_file}")
                    
                    return {
                        'status': 'success',
                        'video_path': str(output_file),
                        'file_size': file_size
                    }
                else:
                    # Check for video in subdirectories (Manim's default structure)
                    possible_paths = [
                        self.output_dir / "videos" / f"{job_uuid}" / "1080p60" / f"{scene_class}.mp4",
                        self.output_dir / "videos" / f"{job_uuid}" / "720p30" / f"{scene_class}.mp4",
                        self.output_dir / "videos" / f"{job_uuid}" / "480p15" / f"{scene_class}.mp4"
                    ]
                    
                    for path in possible_paths:
                        if path.exists():
                            # Move to expected location
                            final_path = self.output_dir / f"{job_uuid}.mp4"
                            shutil.move(str(path), str(final_path))
                            file_size = final_path.stat().st_size
                            print(f"VIDEO PATH = {final_path}")
                            return {
                                'status': 'success',
                                'video_path': str(final_path),
                                'file_size': file_size
                            }
                    
                    raise Exception("Manim completed but no video file was found")
            else:
                # Execution failed
                error_output = result.output.decode('utf-8') if result.output else "Unknown error"
                raise Exception(f"Manim execution failed: {error_output}")
                
        except Exception as e:
            return {
                'status': 'failed',
                'error': str(e)
            }
        finally:
            # Clean up temporary Python file
            if 'python_file_path' in locals() and python_file_path.exists():
                python_file_path.unlink()
    
    def _clean_code(self, code):
        """Clean and validate Python code"""
        # Remove escaped newlines and normalize
        cleaned = code.replace('\\n', '\n')
        
        # Ensure proper imports
        if 'from manim import *' not in cleaned and 'import manim' not in cleaned:
            cleaned = 'from manim import *\n\n' + cleaned
        
        return cleaned
    
    def _extract_scene_class(self, code):
        """Extract the Scene class name from code"""
        import re
        
        # Look for class that inherits from Scene
        pattern = r'class\s+(\w+)\s*\(\s*Scene\s*\)'
        match = re.search(pattern, code)
        if match:
            return match.group(1)
        
        # Fallback: look for any class
        pattern = r'class\s+(\w+)'
        match = re.search(pattern, code)
        if match:
            return match.group(1)
        
        return None
    
    def get_job_status(self, job_uuid):
        """Get job status"""
        if job_uuid in self.jobs:
            return self.jobs[job_uuid]
        else:
            return {'status': 'not_found', 'error': 'Job not found'}
    
    def stop_container(self):
        """Stop the persistent container"""
        if self.container:
            try:
                self.container.stop()
                print("Persistent container stopped")
            except Exception as e:
                print(f"Error stopping container: {e}")
    
    def __del__(self):
        """Cleanup when service shuts down"""
        self.stop_container()
