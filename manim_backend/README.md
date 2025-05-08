# Manim AI Math Video Generator Backend

The backend service for Manim AI - a Flask-based application that uses AI to generate mathematical animations with the Manim library based on natural language prompts. This repository contains only the API server component of the Manim AI system.

## Overview

This backend service provides the API for the Manim AI system, allowing users to create mathematical animations using natural language prompts. It leverages OpenAI's GPT models to generate Manim code, which is then executed in a Docker container to produce animations. The service is designed to be used with a separate frontend application, but can also be used directly via its RESTful API.

## Features

- Natural language prompt to Manim animation
- Multi-layered security for code execution
- RESTful API with Swagger documentation
- Background job processing
- S3 / MinIO storage for rendered videos
- PostgreSQL database for storing jobs and videos

## System Architecture

This backend consists of several components:

1. **Flask Backend**: RESTful API built with Flask-RESTX for handling requests
2. **OpenAI Integration**: Uses GPT models to generate Manim code from natural language
3. **Code Sanitization**: Multi-layered security checks before execution
4. **Docker Sandbox**: Executes Manim code in isolated containers for safety
5. **Cloud Storage**: Stores rendered videos in S3 or MinIO
6. **Database**: PostgreSQL for job tracking and video metadata

This backend is designed to be part of a larger system that includes a separate frontend application that interacts with this API.

## Prerequisites

- Docker and Docker Compose
- Python 3.12+
- OpenAI API key
- S3-compatible storage (AWS S3 or MinIO)
- PostgreSQL database

## Setup

### Environment Variables

Copy the `.env.example` file to `.env` and fill in the required environment variables:

```
FLASK_ENV=development
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://user:password@postgres:5432/manimdb
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_bucket_name
AWS_REGION=us-east-1
S3_ENDPOINT_URL=http://minio:9000  # For MinIO
```

### Using Docker Compose

The easiest way to run the application is with Docker Compose:

```bash
# Build and start all services
docker-compose up -d

# Run database migrations
docker-compose exec app alembic upgrade head
```

The API will be available at http://localhost:5000 and the Swagger UI at http://localhost:5000/docs.

### Manual Setup

1. Create a virtual environment and install dependencies:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. Set up the database:

```bash
alembic upgrade head
```

3. Run the application:

```bash
flask run
```

## API Endpoints

### Available Endpoints

- `GET /api/`: Health check endpoint that verifies the backend is running
- `POST /api/generate`: Submit a natural language prompt to generate a math video
  - Request body: `{ "prompt": "Your mathematical animation description" }`
  - Response: `{ "status": "queued", "jobId": "uuid" }`
- `GET /api/job_status/<job_uuid>`: Check the status of a submitted job
  - Response for pending/running: `{ "status": "pending|running", "jobId": "uuid", "created_at": "timestamp" }`
  - Response for completed: `{ "status": "completed", "jobId": "uuid", "created_at": "timestamp", "videoUrl": "url", "codeText": "generated_manim_code" }`
  - Response for failed: `{ "status": "failed", "jobId": "uuid", "created_at": "timestamp", "error_message": "error details" }`

### API Documentation

The API documentation is available via Swagger UI at `/docs` when the application is running.

## Security

The application implements multiple security layers:

1. **Input Filtering**: Rejects suspicious prompts
2. **OpenAI Prompt Engineering**: Instructs GPT to generate only safe code
3. **AST Sanitization**: Analyzes the code structure for security issues
4. **Docker Sandboxing**: Executes code in an isolated environment

## Development

### Project Structure

```
├── app/                    # Main application package
│   ├── __init__.py         # Flask app initialization
│   ├── db/                 # Database models and connections
│   │   ├── models/         # SQLAlchemy models
│   │   └── db.py           # Database connection handling
│   ├── sandbox/            # Docker sandbox for code execution
│   ├── utils/              # Utility functions
│   │   ├── ast_sanitizer.py # Code safety analysis
│   │   ├── filters.py      # Prompt safety filters
│   │   ├── openai_client.py # OpenAI API integration
│   │   └── s3_uploader.py  # S3/MinIO storage utilities
│   └── routes.py           # API endpoints
├── alembic/                # Database migrations
├── .env                    # Environment variables (not in repo)
├── Dockerfile              # Docker configuration
├── docker-compose.yaml     # Docker Compose configuration
└── requirements.txt        # Python dependencies
```

### Running Tests

```bash
pytest
```

### Adding Database Migrations

```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Development Workflow

1. Make code changes
2. Run tests to verify functionality
3. Create database migrations if models changed
4. Build and test with Docker Compose
5. Commit changes

## Troubleshooting

### Docker Issues

If you encounter issues with the Docker container:

```bash
# View container logs
docker-compose logs app

# Restart the container
docker-compose restart app

# Check if the Docker socket is properly mounted
docker-compose exec app ls -la /var/run/docker.sock
```

### Database Connectivity

If you have issues connecting to the database:

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check the database logs
docker-compose logs postgres

# Test database connection from the app container
docker-compose exec app python -c "from app.db.db import SessionLocal; print(SessionLocal())"
```

### MinIO/S3 Issues

If videos are not being stored or retrieved:

```bash
# Check if MinIO is running
docker-compose ps minio

# Check MinIO logs
docker-compose logs minio

# List buckets to verify they're created correctly
docker-compose logs createbuckets

# Test S3/MinIO connection from the app container
docker-compose exec app python -c "import boto3; s3=boto3.client('s3', endpoint_url='http://minio:9000', aws_access_key_id='minioadmin', aws_secret_access_key='minioadmin'); print(s3.list_buckets())"
```

### OpenAI API Issues

If code generation is failing:

```bash
# Check if your OpenAI API key is set correctly
docker-compose exec app python -c "import os; print(bool(os.getenv('OPENAI_API_KEY')))"

# Test the OpenAI client directly
docker-compose exec app python -c "from app.utils.openai_client import client; print(client.models.list())"
```

## License

MIT License

## Integration with Frontend

This backend is designed to be used with a separate frontend application. The frontend can interact with this API to:

1. Submit new animation requests
2. Check the status of pending jobs
3. Display completed animations
4. Show generated Manim code

### API Integration

Frontend applications should implement:

1. A form to submit prompts to `/api/generate`
2. Polling mechanism to check job status at `/api/job_status/<job_uuid>`
3. Video player to display completed animations
4. Code viewer to show the generated Manim code

## Acknowledgements

- [Manim Community](https://www.manim.community/) - Mathematical Animation Engine
- [OpenAI](https://openai.com/) - AI models for code generation
- [Flask](https://flask.palletsprojects.com/) - Web framework
- [Docker](https://www.docker.com/) - Containerization
- [SQLAlchemy](https://www.sqlalchemy.org/) - ORM for database interactions
