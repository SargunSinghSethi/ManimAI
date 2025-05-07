import os
import uuid
import shutil
import subprocess

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.join(CURRENT_DIR, "temp")
os.makedirs(BASE_DIR, exist_ok=True)

def run_code_in_docker(code: str):
    job_id = str(uuid.uuid4())
    job_dir = os.path.join(BASE_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)

    # Write the code to a Python file
    script_path = os.path.join(job_dir, "main.py")
    with open(script_path, "w",encoding="utf-8") as f:
        f.write(code)

    # Run Docker
    docker_command = [
        "docker", "run", "--rm",
        "-v", f"{os.path.abspath(job_dir)}:/manim",  # mount volume
        "manimcommunity/manim",
        "manim","-ql", "main.py",
    ]

    try:
        result = subprocess.run(docker_command, capture_output=True, text=True, timeout=300)
        stdout, stderr = result.stdout, result.stderr

        # Check if Docker ran successfully
        if result.returncode != 0:
            return {
                "status": "error",
                "error": stderr or stdout or "Unknown error",
                "job_id": job_id
            }
        

        OUTPUT_DIR = os.path.join(job_dir,"media","videos","main", "480p15")
        print("Docker Run successfully")
        # Look for MP4 output
        for root, dirs, files in os.walk(OUTPUT_DIR):
            for file in files:
                if file.endswith(".mp4"):
                    video_path = os.path.join(root, file)
                    return {
                        "status": "success",
                        "video_path": video_path,
                        "job_id": job_id
                    }
                
        return {
            "status": "error",
            "error": stderr or stdout or "No video file generated.",
            "job_id": job_id
        }

    except subprocess.TimeoutExpired:
        return {
            "status": "error",
            "error": "Execution timed out",
            "job_id": job_id
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "job_id": job_id
        }
