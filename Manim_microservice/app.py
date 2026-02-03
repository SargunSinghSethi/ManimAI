from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.serving import run_simple
import threading
import queue
import time
from dotenv import load_dotenv
from services.manim_executor import ManimExecutor
from services.file_manager import FileManager
import atexit
import requests


load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize services
manim_executor = ManimExecutor()
file_manager = FileManager()

# Initialize queue system
job_queue = queue.Queue()
job_status={}
job_results={}

# Register cleanup function
atexit.register(lambda: manim_executor.stop_container())

def background_worker():
    """Background worker to process jobs continuously"""
    print("🔥 Background worker started")

    while True:
        job_data = None
        job_uuid = None
        try:
            job_data = job_queue.get() # blocks
            job_uuid = job_data.get('job_uuid')
            print(f"📋 Processing job: {job_uuid}")
            job_status[job_uuid] = 'processing'
             # Process the job using your existing logic
            result = manim_executor.process_job(
                job_data['job_uuid'],
                job_data['code'],
                job_data.get('config', {}) or {}
            )

            job_results[job_uuid] = result

            if result.get('success'):
                job_status[job_uuid] = 'completed'
                print(f"✅ Job {job_uuid} completed successfully")
                notify_backend_async(job_uuid, result)  # always notify
            else:
                job_status[job_uuid] = 'failed'
                err_msg = result.get('error') or 'Unknown error'
                print(f"❌ Job {job_uuid} failed: {err_msg}")
                notify_backend_async(job_uuid, {
                    'success': False,
                    'video_path': None,
                    'file_size': 0,
                    'error': err_msg
                })
        except Exception as e:
            err_msg = str(e)
            print(f"❌ Job {job_uuid or 'unknown'} exception: {err_msg}")
            if job_uuid:
                job_status[job_uuid] = 'failed'
                job_results[job_uuid] = {
                    'success': False,
                    'video_path': None,
                    'file_size': 0,
                    'error': err_msg
                }
                notify_backend_async(job_uuid, {
                    'success': False,
                    'video_path': None,
                    'file_size': 0,
                    'error': err_msg
                })
        finally:
            try:
                job_queue.task_done()
            except Exception:
                pass

def notify_backend_async(job_uuid, result):
    """Send completion notification to backend"""
    try:
        backend_url = os.getenv('BACKEND_URL', 'http://localhost:5000')
        webhook_key = os.getenv('WEBHOOK_API_KEY')
        if not webhook_key:
            print("⚠️ WEBHOOK_API_KEY not configured")
            return

        payload = {
            'job_uuid': job_uuid,
            'status': 'completed' if result.get('success') else 'failed',
            'video_url': result.get('video_path'),
            'file_size': result.get('file_size', 0),
            'error_message': result.get('error') if not result.get('success') else None
        }

        headers = {
            'Content-Type': 'application/json',
            'X-Webhook-Key': webhook_key
        }

        def send_notification():
            attempts = 3
            backoff = 1.0
            for i in range(attempts):
                try:
                    response = requests.post(
                        f"{backend_url}/webhooks/job-completion",
                        json=payload,
                        headers=headers,
                        timeout=10
                    )
                    if response.status_code == 200:
                        print(f"✅ Successfully notified backend for job {job_uuid}")
                        return
                    else:
                        print(f"⚠️ Backend notification failed for job {job_uuid}: {response.status_code} - {response.text}")
                except Exception as e:
                    print(f"❌ Notify attempt {i+1} failed for job {job_uuid}: {str(e)}")
                time.sleep(backoff)
                backoff *= 2
            print(f"🚨 Giving up notifying backend for job {job_uuid} after {attempts} attempts")

        threading.Thread(target=send_notification, daemon=True).start()

    except Exception as e:
        print(f"⚠️ Error setting up backend notification: {str(e)}")

# Start background worker thread
worker_thread = threading.Thread(target=background_worker, daemon=True)
worker_thread.start()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'manim-python-service',
        'queue_size': job_queue.qsize(),
        'manim_version': manim_executor.get_manim_version(),
        'container_ready': manim_executor.container is not None,
        'active_jobs': len([s for s in job_status.values() if s == 'processing'])
    })

@app.route('/render', methods=['POST'])
def render_animation():
    """
    Queue job for background processing instead of blocking
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        job_uuid = data.get('job_uuid')
        code = data.get('code')
        config = data.get('config', {})
        print(code)
        
        if not job_uuid or not code:
            return jsonify({
                'error': 'Missing required fields',
                'required': ['job_uuid', 'code']
            }), 400
        
        job_queue.put(data)
        job_status[job_uuid] = 'queued'
        
        queue_position = job_queue.qsize()
        estimated_wait = queue_position * 30  # Rough estimate: 30 seconds per job

        print(f"📋 Queued job: {job_uuid} (Position: {queue_position})")

        return jsonify({
            'status': 'queued',
            'job_uuid': job_uuid,
            'queue_position': queue_position,
            'estimated_wait_seconds': estimated_wait,
            'message': 'Job queued for processing'
        })
        
    except Exception as e:
        print(f"Error in queue_render: {str(e)}")
        return jsonify({
            'status': 'failed',
            'error_message': f'Internal server error: {str(e)}',
            'message': 'Unexpected error during queuing'
        }), 500

if __name__ == '__main__':
    os.makedirs('output', exist_ok=True)
    os.makedirs('temp', exist_ok=True)
    
    port = int(os.environ.get('PORT', 8000))
    debug = os.environ.get('FLASK_ENV') == 'development'  # ✅ Define debug variable
    
    print(f"Starting Manim Python Service with persistent Docker container on port {port}")
    
    if debug:
        print("Running in development mode with auto-reload")
        run_simple(
            hostname='0.0.0.0',
            port=port,
            application=app,
            use_reloader=True,
            use_debugger=True,
            exclude_patterns=['*/temp/*', '*/output/*'] 
        )
    else:
        # Production mode
        print("Running in production mode")
        app.run(host='0.0.0.0', port=port, debug=False)