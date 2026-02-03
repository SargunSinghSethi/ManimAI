"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { History, Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
              >
                <path d="M12 3a9 9 0 1 0 9 9" />
                <path d="M12 3v9l9 9" />
                <path d="M3 3v18h18" />
              </svg>
              <span className="font-bold text-xl">Manim AI</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            {isSignedIn && (
              <Link
                href="/history"
                aria-label="Open video history"
                className="group hidden sm:block"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 px-3 py-2 transition-all duration-200 hover:bg-muted hover:shadow-sm hover:scale-[1.03] active:scale-[0.97]"
                >
                  <History
                    className="h-4 w-4 text-muted-foreground transition-colors duration-200 group-hover:text-primary"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium">Video History</span>
                </Button>
              </Link>
            )}

            <ModeToggle />

            {/* Mobile Menu Button */}
            {isSignedIn && (
              <Button
                variant="ghost"
                size="sm"
                className="sm:hidden p-2"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open mobile menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}

            {/* Desktop Auth Buttons */}
            {!isLoaded ? (
              <div className="flex items-center gap-2">
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
              </div>
            ) : isSignedIn ? (
              <div className="items-center gap-3 hidden sm:flex">
                <span className="text-sm text-muted-foreground">
                  Welcome, {user.firstName || user.username || 'User'}
                </span>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8"
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <SignInButton mode="modal">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Sidebar + Backdrop (always in DOM, animates open/close) */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-64 bg-background shadow-xl border-l border-border sm:hidden transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 space-y-4">
            {isSignedIn && (
              <>
                {/* User Info */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10"
                      }
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {user.firstName || user.username || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.emailAddresses?.[0]?.emailAddress}
                    </p>
                  </div>
                </div>

                {/* Navigation Links */}
                <nav className="space-y-2">
                  <Link
                    href="/history"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <History className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Video History</span>
                  </Link>
                </nav>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
