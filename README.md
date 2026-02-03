# Manim AI Math Video Generator

Generate Manim math animations from natural-language prompts.

Manim AI is an end-to-end app where you type a math/animation idea (e.g., “visualize the derivative as a tangent line moving along a curve”), and the system:

- turns your prompt into **Manim Python code** using an LLM (OpenAI and/or Gemini)
- **renders** the animation inside an isolated **Docker** execution environment
- stores the result and lets you **track status**, **preview**, and **download** completed videos from the UI

This repo is a **3-service** system:

- **Frontend**: Next.js app (`manim_frontend/`)
- **Backend API**: Express + TypeScript + Prisma + Clerk (`manim_backend/`)
- **Render service**: Python Flask service that executes Manim via Docker and notifies the backend via webhook (`Manim_microservice/`)

![Manim AI Generator](https://raw.githubusercontent.com/SargunSinghSethi/ManimAI/refs/heads/main/manim_frontend/public/dashboard.png)

## How it works (high level)

1. User submits a prompt in the frontend.
2. Frontend calls the backend `POST /api/generate` (authenticated via Clerk bearer token).
3. Backend creates a `Job` in Postgres, generates Manim code via LLM, then calls the Python render service `POST /render`.
4. Python service queues the render, runs Manim in a persistent Docker container, and then **calls back** the backend webhook `POST /webhooks/job-completion`.
5. Backend marks the job completed/failed and (on success) creates a `Video` record. Frontend polls `GET /api/status/:jobUuid`.

## Project structure

```
Manim_Ai_Project/
├── manim_frontend/        # Next.js 15 + React 19 UI
├── manim_backend/         # Express API + Prisma (Postgres) + Clerk auth
└── Manim_microservice/    # Python Flask render queue + Manim-in-Docker executor
```

## Prerequisites

- **Node.js**: 18+ (recommended)
- **Python**: 3.10+ recommended
- **Docker**: required for rendering (the Python service uses Docker to run Manim)
- **PostgreSQL**: required for the backend (Prisma)
- **Clerk**: required for authenticated API calls (frontend uses Clerk)
- **LLM API key**: OpenAI and/or Gemini (backend supports both)
- **S3-compatible storage** (optional but supported): AWS S3 or MinIO (backend generates presigned download URLs)

## Quick start (local dev)

### 1) Backend (Express + Prisma)

From `manim_backend/`:

```bash
cd manim_backend
npm install
```

Create `manim_backend/.env` from `manim_backend/.env.example` and update values. Recommended local ports:

- Backend: **5000**
- Frontend: **3000**
- Python render service: **8000**

Important env vars:

- **`DATABASE_URL`**: Postgres connection string
- **`CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`**: Clerk keys
- **`OPENAI_API_KEY`** and/or **`GEMINI_API_KEY`** (+ optional `GEMINI_MODEL`)
- **`PYTHON_SERVICE_URL`**: usually `http://localhost:8000`
- **`FRONTEND_URL`**: usually `http://localhost:3000` (CORS allowlist)
- **`WEBHOOK_API_KEY`**: shared secret used to validate render callbacks

Initialize Prisma:

```bash
npm run db:generate
npm run db:migrate
```

Start the backend:

```bash
npm run dev
```

Health check:

- `GET /health`
- `GET /api/health`

### 2) Render service (Python Flask + Docker)

From `Manim_microservice/`:

```bash
cd Manim_microservice
python -m venv .venv
source .venv/Scripts/activate  # Windows Git Bash
pip install -r requirements.txt
```

Create `Manim_microservice/.env` from `Manim_microservice/.env.example`.

Critical env vars:

- **`BACKEND_URL`**: should match your backend, e.g. `http://localhost:5000`
- **`WEBHOOK_API_KEY`**: must match the backend `WEBHOOK_API_KEY`
- **`PORT`**: default `8000`

Run the service:

```bash
python app.py
```

Health check:

- `GET /health` (python service)

### 3) Frontend (Next.js)

From `manim_frontend/`:

```bash
cd manim_frontend
npm install
```

Create `manim_frontend/.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open:

- Frontend: `http://localhost:3000`

## API (backend)

All `/api/*` routes below are **authenticated** (Clerk bearer token required).

- **`POST /api/generate`**: create a job (returns `{ jobUuid }`)
- **`GET /api/status/:jobUuid`**: poll job status; returns status, progress, and `videoId` when available
- **`GET /api/videos`**: list user videos (paginated)
- **`GET /api/video/:videoId/download`**: get a presigned download URL (S3)

Webhook (called by the Python render service):

- **`POST /webhooks/job-completion`**: expects header `X-Webhook-Key: <WEBHOOK_API_KEY>`

## Notes / gotchas

- **Port consistency**: the frontend defaults to `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000`, so it’s easiest to run the backend on **5000** (set `PORT=5000` in `manim_backend/.env`).
- **CORS allowlist**: backend CORS origins are restricted; ensure `FRONTEND_URL` and `PYTHON_SERVICE_URL` are set correctly in production.
- **Rendering requires Docker**: the Python service uses Docker to run Manim; make sure Docker Desktop is running.

## License

MIT (see `LICENSE` if present).

## Acknowledgments

- [Manim Community](https://www.manim.community/)
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Clerk](https://clerk.com/)
- [OpenAI](https://openai.com/)
