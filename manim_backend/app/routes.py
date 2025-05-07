import os
import uuid
from flask import  request
from threading import Thread
from sqlalchemy.exc import SQLAlchemyError
from flask_restx import Namespace, Resource, fields


from app.utils.filters import is_prompt_unsafe
from app.utils.openai_client import get_manim_code
from app.utils.ast_sanitizer import sanitize_ast
from app.utils.s3_handler import upload_file_to_s3, generate_presigned_url

from app.sandbox.docker_runner import run_code_in_docker

from app.db.db import SessionLocal
from app.db.models.job import Job, JobStatus
from app.db.models.video import Video 

main = Namespace('main', description='Main routes for video generation')

# Define request/response models (optional but recommended for Swagger)
prompt_model = main.model('Prompt', {
    'prompt': fields.String(required=True, description='User prompt for video generation')
})

job_status_model = main.model('JobStatus', {
    'status': fields.String,
    'job_uuid': fields.String,
    'created_at': fields.String,
    'video_url': fields.String,
    'error_message': fields.String
})

@main.route('/')
class IndexRoute(Resource):
    def get(self):
        return {"message": "Flask backend is working!"}

@main.route('/generate')
class GenerateRoute(Resource):
    @main.expect(prompt_model)
    def post(self):
        db = SessionLocal()
        data = request.get_json()
        user_prompt = data.get("prompt","")
        print(user_prompt)

        # Step 1: Pre-check for malicious intent
        flagged, reason = is_prompt_unsafe(user_prompt)

        if flagged:
            return {
                "status": "abort",
                "reason": reason
            }, 400
        

        print(user_prompt)
        # Step 2: Create job entry
        job_uuid = str(uuid.uuid4())
        job = Job(
            user_id=1,
            prompt=user_prompt,
            job_uuid=job_uuid,
            status=JobStatus.pending
        )

        print(job)
        try:
            db.add(job)
            db.commit()
            db.refresh(job)
        except SQLAlchemyError as e:
            db.rollback()
            return {"status": "error", "message": str(e)}, 500
        finally:
            db.close()

        # Step 3. Start background processing
        Thread(target=process_job, args=(job_uuid, user_prompt)).start()

        # 4. Respond immediately with job UUID
        return {
            "status": "queued",
            "jobId": job_uuid
        }, 202
    


@main.route('/job_status/<string:job_uuid>')
@main.param('job_uuid', 'Job UUID')
class JobStatusRoute(Resource):
    @main.response(200, 'Success', job_status_model)
    def get(self, job_uuid):
        db = SessionLocal()
        try:
            job = db.query(Job).filter(Job.job_uuid == job_uuid).first()
            if not job:
                return {"status": "error", "message": "Job not found"}, 404
        
            response = {
                "status": job.status,
                "jobId": job.job_uuid,
                "created_at": job.created_at.isoformat()
            }

            if job.status == "completed":
                video = db.query(Video).filter(Video.job_id == job_uuid).first()
                if video:
                    response["videoId"] = video.id
                    response["codeText"] = video.associated_code

            elif job.status == "failed":
                response["error_message"] = job.error_message

            print("JOB_STATUS:" ,response)
            return response, 200
        finally:
            db.close()


@main.route('/get_presigned_url/<string:video_id>')
@main.param('video_id', 'VIDEO ID')
class PresignedUrlRoute(Resource):
    def get(self, video_id):
        if not video_id:
            return {'error': 'Missing video ID'}, 400

        db = SessionLocal()
        try:
            video = db.query(Video).filter(Video.id == video_id).first()
            if not video:
                return {'error': 'Video not found'}, 404
            response = generate_presigned_url(video.video_url)
            return response
        except Exception as e:
            print(e)
            return {'error': str(e)}, 500
        finally:
            db.close()



def process_job(job_uuid: str, prompt: str):
    db = SessionLocal()
    try:
        job = db.query(Job).filter(Job.job_uuid == job_uuid).first()
        if not job:
            print(f"Job {job_uuid} not found.")
            return
        
        job.status = JobStatus.running
        db.commit()
    
        # Step 1: OpenAI call
        print(f"PROMPT: {prompt}")
        response = get_manim_code(prompt)

        if response.get("status") == "rejected":
            job.status = JobStatus.failed
            job.error_message = response.get("reason")
            db.commit()
            return
                
        code = response.get("code", "")
        print(code)

        job.generated_code=code
        db.commit()

        print("AST")

        # Step 2: AST sanitizer
        safe, reason = sanitize_ast(code)
        if not safe:
            print(safe,reason)
            job.status = JobStatus.failed
            job.error_message = f"AST Sanitizer: {reason}"
            db.commit()
            return

        # Step 5: Run in Docker
        print("DOCKER CODE")
        result = run_code_in_docker(code)
        print(result["video_path"])
        if result["status"] == "success":
            s3_result = upload_file_to_s3(result["video_path"])
            if(s3_result["status"] != "success"):
                job.status = JobStatus.failed
                job.error_message = f"S3 Upload Error: {s3_result['message']}"
                db.commit()
                return
            job.status = JobStatus.completed
            db.commit()

            video = Video(
                user_id=job.user_id,
                job_id=job.job_uuid,
                title=f"Video for {prompt[:30]}",
                associated_code=code,
                video_url=s3_result["url"]
            )
            db.add(video)
            db.commit()

            # Clean up local file after successful upload
            if os.path.exists(result['video_path']):
                print(f"VIDEO PATH = {result['video_path']}")
                # os.remove(result["video_path"])
            return
        
        
        # If Docker fails
        job.status = JobStatus.failed
        job.error_message = result.get("error", "Unknown error during Docker run")
        db.commit()

    except Exception as e:
        job.status = JobStatus.failed
        job.error_message = f"Exception: {str(e)}"
        db.commit()
    finally:
        db.close()


