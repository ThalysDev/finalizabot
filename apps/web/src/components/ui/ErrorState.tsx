"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { ERROR_COPY } from "@/lib/copy/navigation";

type ErrorStateProps = {
  title: string;
  description: string;
  digest?: string;
  onRetry?: () => void;
  retryLabel?: string;
  secondaryAction?: {
    href: string;
    label: string;
  };
  className?: string;
  contentClassName?: string;
  children?: ReactNode;
};

export function ErrorState({
  title,
  description,
  digest,
  onRetry,
  retryLabel = ERROR_COPY.retry,
  secondaryAction,
  className,
  contentClassName,
  children,
}: ErrorStateProps) {
  return (
    <div
      className={
        className ?? "flex h-[calc(100vh-57px)] items-center justify-center p-4"
      }
    >
      <div
        className={
          contentClassName ?? "max-w-md w-full text-center animate-fade-up"
        }
      >
        <div className="mx-auto size-16 rounded-2xl bg-fb-accent-red/10 border border-fb-accent-red/20 flex items-center justify-center mb-6">
          <AlertTriangle className="size-8 text-fb-accent-red" />
        </div>
        <h1 className="text-fb-text text-2xl font-bold mb-2">{title}</h1>
        <p className="text-fb-text-secondary text-sm mb-6 leading-relaxed">
          {description}
        </p>
        {digest ? (
          <p className="text-fb-text-muted text-xs font-mono mb-6 bg-fb-surface rounded-lg px-3 py-2">
            ID do erro: {digest}
          </p>
        ) : null}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-2 px-6 py-3 bg-fb-primary text-fb-primary-content font-bold text-sm rounded-lg hover:brightness-110 transition-all"
            >
              <RefreshCw className="size-4" />
              {retryLabel}
            </button>
          ) : null}

          {secondaryAction ? (
            <Link
              href={secondaryAction.href}
              className="flex items-center gap-2 px-6 py-3 bg-fb-surface border border-fb-border text-fb-text font-medium text-sm rounded-lg hover:brightness-110 transition-colors"
            >
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </div>
  );
}
