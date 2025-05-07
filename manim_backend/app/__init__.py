import os
from flask import Flask
from dotenv import load_dotenv
from flask_cors import CORS
from flask_restx import Api

from app.db.db import init_db
from app.routes import main as main_app

def create_app():
    load_dotenv()
    init_db()
    app = Flask(__name__)

    app.config['ENV'] = os.getenv('FLASK_ENV','production')
    
    CORS(app, origins=["http://localhost:3000","*"])  # adjust as needed

    api = Api(app, 
              version="1.0", 
              title="Manim AI Math Video Generator API", 
              description="API for generating videos from natural language math prompts.",
              doc="/docs")
    
    api.add_namespace(main_app, path="/api")
    
    return app