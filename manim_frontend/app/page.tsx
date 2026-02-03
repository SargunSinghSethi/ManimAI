"use client";

import { useUser } from '@clerk/nextjs';
import { ManimGenerator } from "@/components/manim-generator";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();

  // Show loading while Clerk loads
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
        <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
          {isSignedIn ? (
            // Authenticated user sees the full app
            <>
              <div className="text-center mb-12 mt-16">
                <h1 className="text-5xl font-bold tracking-tight text-foreground mb-4">
                  What animation can I help you create?
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Generate mathematical animations using natural language prompts powered by AI
                </p>
              </div>
              <ManimGenerator />
            </>
          ) : (
            // Unauthenticated user sees welcome screen
            <div className="text-center py-12 mt-16">
              <h1 className="text-5xl font-bold tracking-tight text-foreground mb-4">
                Welcome to Manim AI
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                Generate beautiful mathematical animations with AI. Sign in to get started.
              </p>
              <p className="text-sm text-muted-foreground">
                Please use the sign-in button in the header to continue.
              </p>
            </div>
          )}
        </main>
    </>
  );
}
