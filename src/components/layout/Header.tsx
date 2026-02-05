"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/primitives";
import { Container } from "@/components/primitives";
import { cn } from "@/lib/cn";

/**
 * Header Component
 * Navigation header with logo and auth actions
 */

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
      <Container>
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div
              className={cn(
                "w-8 h-8 sm:w-10 sm:h-10",
                "bg-blue-600 rounded-lg",
                "flex items-center justify-center",
                "font-bold text-white text-xs sm:text-sm",
              )}
            >
              FB
            </div>
            <span className="text-lg sm:text-xl font-bold text-neutral-900 hidden sm:inline">
              FinalizaBOT
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex gap-3 sm:gap-4 items-center">
            <SignedOut>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="text-sm">
                  Entrar
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="primary" size="sm" className="text-sm">
                  Criar Conta
                </Button>
              </Link>
            </SignedOut>

            <SignedIn>
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm hidden sm:inline-flex"
                >
                  Dashboard
                </Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </nav>
        </div>
      </Container>
    </header>
  );
}

Header.displayName = "Header";
