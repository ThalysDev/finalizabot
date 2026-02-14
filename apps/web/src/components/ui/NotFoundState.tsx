"use client";

import Link from "next/link";
import { ArrowLeft, Home, SearchX } from "lucide-react";

type ActionIcon = "home" | "none";

type NotFoundStateProps = {
  title?: string;
  description: string;
  primaryAction: {
    href: string;
    label: string;
    icon?: ActionIcon;
  };
  showBackAction?: boolean;
  backLabel?: string;
  className?: string;
};

export function NotFoundState({
  title = "Página não encontrada",
  description,
  primaryAction,
  showBackAction = false,
  backLabel = "Voltar",
  className,
}: NotFoundStateProps) {
  const showHomeIcon = primaryAction.icon === "home";

  return (
    <div
      className={
        className ?? "flex h-[calc(100vh-57px)] items-center justify-center p-4"
      }
    >
      <div className="max-w-md w-full text-center animate-fade-up">
        <div className="mx-auto size-16 rounded-2xl bg-fb-surface border border-fb-border flex items-center justify-center mb-6">
          <SearchX className="size-8 text-fb-text-muted" />
        </div>

        <p className="text-fb-primary text-6xl font-black mb-2">404</p>
        <h1 className="text-fb-text text-xl font-bold mb-2">{title}</h1>
        <p className="text-fb-text-secondary text-sm mb-8 leading-relaxed">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={primaryAction.href}
            className="inline-flex items-center gap-2 px-6 py-3 bg-fb-primary text-fb-primary-content font-bold text-sm rounded-lg hover:brightness-110 transition-all"
          >
            {showHomeIcon ? <Home className="size-4" /> : null}
            {primaryAction.label}
          </Link>

          {showBackAction ? (
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-fb-surface border border-fb-border text-fb-text font-medium text-sm rounded-lg hover:brightness-110 transition-colors"
            >
              <ArrowLeft className="size-4" />
              {backLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
