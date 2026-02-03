"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

export function AuthButton() {
  const { isSignedIn, user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />;
  }

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Hello, {user.firstName || user.username || 'User'}
        </span>
        <UserButton afterSignOutUrl="/" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <Button variant="outline">Sign In</Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button>Sign Up</Button>
      </SignUpButton>
    </div>
  );
}
