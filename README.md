# Manim AI Math Video Generator

A web application that uses AI to generate mathematical animations with the Manim library based on natural language prompts.

![Manim AI Generator](https://raw.githubusercontent.com/SargunSinghSethi/ManimAI/refs/heads/main/manim_frontend/public/dashboard.png)

## Project Overview

Manim AI Math Video Generator allows users to create beautiful mathematical animations by describing them in plain English. The application uses OpenAI's GPT models to translate natural language descriptions into [Manim](https://www.manim.community/) code, which is then executed to generate animations.

The project consists of two main components:
- **Backend**: Flask-based REST API that handles prompt processing, code generation, and video rendering
- **Frontend**: Next.js web interface for submitting prompts and viewing animations

## Key Features

- Convert natural language prompts to mathematical animations
- Multi-layered security for code execution
- Real-time job status tracking
- Animation preview with video player
- Generated Manim code display
- Dark/light mode support
- Responsive design for all devices

## System Architecture

The system consists of several components working together:

1. **Frontend Application**: Next.js 15 web interface
2. **Backend API**: Flask-RESTX API for handling requests
3. **OpenAI Integration**: Uses GPT models to generate Manim code
4. **Code Sanitization**: Multi-layered security checks
5. **Docker Sandbox**: Executes Manim code in isolated containers
6. **Cloud Storage**: Stores rendered videos in S3 or MinIO
7. **Database**: PostgreSQL for job tracking and video metadata

## Prerequisites

- Docker and Docker Compose
- OpenAI API key
- S3-compatible storage (AWS S3 or MinIO)

## Quick Start

### Clone the Repository

```bash
git clone https://github.com/SargunSinghSethi/ManimAI.git
cd ManimAI
```

### Set Up Environment Variables

Create a `.env` file in the project root directory:

```
# Backend settings
FLASK_ENV=development
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://user:password@postgres:5432/manimdb
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=manim-videos
AWS_REGION=us-east-1
S3_ENDPOINT_URL=http://minio:9000  # For MinIO

# Frontend settings
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### Project Structure

Ensure your project is organized with frontend and backend code in their respective directories:

```
ManimAI/
├── docker-compose.yml
├── .env
├── frontend/
    ├── app/ 
        ├── prompts/
            ├── page.tsx/        # Page Route for Showing Generating Video  
        ├── globals.css/
        ├── layout.tsx/         
        ├── page.tsx/            # Landing Page

    ├── components/
        ├── ui/                  # Folder for shadcn UI    
        ├── code-display.tsx/    # Display Code
        ├── header.tsx/          # Navigation Bar for the Application
        ├── job-status.tsx/      # Showing Job Status, when it is being handled
        ├── manim-generator.tsx/ # Prompt Input Window
        ├── mode-toggle.tsx/     # Dark/Light Mode Toggle
        ├── video-player.tsx/    # Showing Video
    ├── lib/
        ├── api.ts/              # API Routes Handling Logic Here
        ├── utils.ts/           
│   └── Dockerfile
└── backend/
    ├── app/                     # Main application package
    │   ├── __init__.py          # Flask app initialization
    │   ├── db/                  # Database models and connections
    │   │   ├── models/          # SQLAlchemy models
    │   │   └── db.py            # Database connection handling
    │   ├── sandbox/             # Docker sandbox for code execution
    │   ├── utils/               # Utility functions
    │   │   ├── ast_sanitizer.py # Code safety analysis
    │   │   ├── filters.py       # Prompt safety filters
    │   │   ├── openai_client.py # OpenAI API integration
    │   │   └── s3_uploader.py   # S3/MinIO storage utilities
    │   └── routes.py            # API endpoints
    ├── alembic/                 # Database migrations
    ├── .env                     # Environment variables (not in repo)
    ├── Dockerfile               # Docker configuration
    └── requirements.txt         # Python dependencies
```

### Start the Services

```bash
# Start all services with a single command
docker-compose up -d
```

The frontend will be available at http://localhost:3000 and the backend API at http://localhost:5000.

## Using the Application

1. Enter a description of the mathematical animation you want to create
2. Click the submit button or press ⌘+Enter
3. Wait for the animation to be processed - you'll see real-time status updates
4. Once complete, you can view the animation and inspect the generated code

### Example Prompts

- "Transform a square to a circle"
- "Create a 3D rotating cube"
- "Demonstrate the Pythagorean theorem using a right angled triangle"
- "Show a sine wave forming on a graph"

## Development

For development instructions, refer to the individual README files in the backend and frontend repositories:

- [Backend Development Guide](backend/README.md)
- [Frontend Development Guide](frontend/README.md)

## Troubleshooting

### Docker Issues

If you encounter issues with Docker containers:

```bash
# View container logs
docker-compose logs service_name

# Restart containers
docker-compose restart service_name

# Check network connectivity
docker network inspect manim-network
```

### Frontend Can't Connect to Backend

- Ensure the `NEXT_PUBLIC_API_BASE_URL` is set correctly
- Check that the backend service is running and accessible
- Verify that all services are in the same network

### Animation Generation Fails

- Check the OpenAI API key is valid
- Verify the Docker sandbox is properly configured
- Inspect backend logs for detailed error messages

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Manim Community](https://www.manim.community/) for the animation engine
- [OpenAI](https://openai.com/) for AI models
- [Next.js](https://nextjs.org/) for the React framework
- [Flask](https://flask.palletsprojects.com/) for the backend framework
- [shadcn/ui](https://ui.shadcn.com/) for the UI components
