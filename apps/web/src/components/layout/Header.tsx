"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Container } from "@/components/primitives";
import { LastSyncBadge } from "@/components/layout/LastSyncBadge";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

/**
 * Header Component
 * Navigation header with logo and auth actions
 */

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-fb-border/50 bg-fb-bg/90 backdrop-blur-xl">
      <Container>
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logo.png"
              alt="FinalizaBOT"
              width={40}
              height={40}
              className="size-10 object-contain"
              priority
            />
            <span className="text-base sm:text-xl font-bold text-fb-text tracking-tight">
              FinalizaBOT
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex gap-3 sm:gap-4 items-center">
            <div className="hidden sm:flex">
              <LastSyncBadge />
            </div>
            <SignedOut>
              <Link
                href="#demo"
                className="hidden sm:block text-sm font-medium text-fb-text-secondary hover:text-fb-text transition-colors px-2 py-2"
              >
                Demo
              </Link>
              <Link
                href="#benefits"
                className="hidden sm:block text-sm font-medium text-fb-text-secondary hover:text-fb-text transition-colors px-2 py-2"
              >
                Benefícios
              </Link>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-fb-text-secondary hover:text-fb-text transition-colors px-3 py-2"
              >
                Entrar
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-fb-primary-content bg-linear-to-r from-fb-primary to-fb-accent-green px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-fb-primary/20 transition-all duration-300 btn-press"
              >
                Criar Conta
                <ArrowRight className="size-3.5" />
              </Link>
            </SignedOut>

            <SignedIn>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-fb-text-secondary hover:text-fb-primary transition-colors px-3 py-2"
              >
                Painel
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
