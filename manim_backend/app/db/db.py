from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from app.db.models.base import Base
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set.")

engine = create_engine(DATABASE_URL)

# Use scoped_session to ensure thread safety
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

def init_db():
    from app.db.models import user, video, job  # Import to register models
    Base.metadata.create_all(bind=engine)
