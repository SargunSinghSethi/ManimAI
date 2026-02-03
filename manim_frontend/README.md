# Manim AI Generator Frontend

A modern web interface for generating mathematical animations using natural language prompts powered by AI.

![Manim AI Generator](https://raw.githubusercontent.com/SargunSinghSethi/ManimAI/refs/heads/main/manim_frontend/public/dashboard.png)

## Overview

Manim AI Generator allows users to create beautiful mathematical animations by describing them in plain English. The application uses AI to translate natural language descriptions into [Manim](https://www.manim.community/) code, which is then executed to generate animations.

Key features:
- Natural language prompt to animation generation
- Real-time job status tracking 
- Animation preview with video player
- Generated Manim code display
- Dark/light mode support
- Responsive design for all devices

## Tech Stack

- **Framework**: Next.js 15
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn or pnpm or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/manim-ai-generator.git
cd manim-ai-generator
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```
Replace the URL with your backend API server address.

4. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) to see the application.

## Docker Deployment

For containerized deployment, we provide a Dockerfile and docker-compose.yaml.

### Using Docker Compose

1. Make sure Docker and Docker Compose are installed on your system.
2. Run:
```bash
docker-compose up -d
```

### Manual Docker Build

1. Build the Docker image:
```bash
docker build -t manim-ai-frontend .
```

2. Run the container:
```bash
docker run -p 3000:3000 -e NEXT_PUBLIC_API_BASE_URL=http://your-backend-api-url manim-ai-frontend
```

## Project Structure

```
├── app/                  # Next.js app directory
│   ├── globals.css       # Global styles
│   ├── page.tsx          # Home page
│   └── prompts/          # Prompts page
├── components/           # React components
│   ├── ui/               # UI components (from shadcn/ui)
│   ├── manim-generator.tsx # Main generator component
│   └── ...
├── lib/                  # Utility functions
│   ├── api.ts            # API client functions
│   └── utils.ts          # Helper utilities
├── public/               # Static assets
└── ...
```

## Usage

1. Enter a description of the mathematical animation you want to create.
2. Click the submit button or press ⌘+Enter.
3. Wait for the animation to be processed - you'll see real-time status updates.
4. Once complete, you can view the animation and inspect the generated code.

### Example Prompts

- "Transform a square to a circle"
- "Create a 3D rotating cube"
- "Demonstrate the Pythagorean theorem using a right angled triangle"
- "Show a sine wave forming on a graph"

## Backend Requirements

This frontend application requires a compatible backend API that:
- Accepts prompts for animation generation
- Processes the prompts to create Manim code
- Renders the animations
- Provides job status tracking
- Serves the generated videos

See the backend repository for setup instructions.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Manim Community](https://www.manim.community/) for the animation engine
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Next.js](https://nextjs.org/) for the React framework
