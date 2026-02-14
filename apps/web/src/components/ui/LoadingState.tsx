import Image from "next/image";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type LoadingStateProps = {
  title?: string;
  description?: string;
  fullHeight?: boolean;
  children?: ReactNode;
};

export function LoadingState({
  title = "Carregando dados…",
  description,
  fullHeight = false,
  children,
}: LoadingStateProps) {
  return (
    <div
      className={
        fullHeight
          ? "flex h-[calc(100vh-57px)] items-center justify-center p-4"
          : "p-4 md:p-6 max-w-7xl mx-auto"
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={
          fullHeight ? "w-full max-w-md text-center" : "w-full animate-pulse"
        }
      >
        {children ?? (
          <div className="flex flex-col items-center gap-4 animate-fade-up">
            <div className="size-14 flex items-center justify-center animate-pulse">
              <Image
                src="/logo.png"
                alt="FinalizaBOT"
                width={56}
                height={56}
                className="size-14 object-contain"
              />
            </div>
            <div className="flex flex-col items-center gap-2 w-48">
              <div className="h-3 w-full rounded-full bg-fb-surface animate-shimmer" />
              <div className="h-3 w-3/4 rounded-full bg-fb-surface animate-shimmer [animation-delay:150ms]" />
              <div className="h-3 w-1/2 rounded-full bg-fb-surface animate-shimmer [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <p
          className={fullHeight ? "text-fb-text-muted text-sm mt-3" : "sr-only"}
        >
          {title}
        </p>
        {description ? (
          <p
            className={
              fullHeight ? "text-fb-text-muted text-xs mt-1" : "sr-only"
            }
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function GridCardsLoading({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-64 bg-fb-surface rounded-2xl border border-fb-border/40"
        />
      ))}
    </div>
  );
}

export function TableLoading({
  rows = 10,
  cols = 9,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="rounded-xl bg-fb-surface overflow-hidden">
      <div className="flex items-center gap-4 p-4 border-b border-fb-border">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="flex items-center gap-4 p-4 border-b border-fb-border/50"
        >
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-4 flex-[2]" />
          <Skeleton className="h-4 flex-1" />
          {Array.from({ length: Math.max(cols - 3, 1) }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
