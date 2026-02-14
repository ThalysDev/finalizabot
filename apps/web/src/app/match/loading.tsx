import Image from "next/image";
import { LOADING_COPY } from "@/lib/copy/navigation";

/**
 * Loading state para página de partida (/match/[id]).
 */
export default function MatchLoading() {
  return (
    <div className="min-h-[calc(100vh-57px)] bg-fb-bg">
      {/* Banner skeleton */}
      <div className="bg-fb-surface border-b border-fb-border/40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="animate-pulse flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="size-14 rounded-full bg-fb-surface-lighter" />
              <div className="h-5 w-32 rounded bg-fb-surface-lighter" />
            </div>
            <div className="flex flex-col items-center px-8">
              <div className="h-8 w-16 rounded bg-fb-surface-lighter" />
              <div className="h-3 w-24 rounded bg-fb-surface-lighter mt-2" />
            </div>
            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="h-5 w-32 rounded bg-fb-surface-lighter" />
              <div className="size-14 rounded-full bg-fb-surface-lighter" />
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-6 animate-pulse">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-9 w-24 rounded-lg bg-fb-surface" />
          <div className="h-9 w-24 rounded-lg bg-fb-surface" />
          <div className="h-9 w-24 rounded-lg bg-fb-surface" />
        </div>

        {/* Player cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-2xl bg-fb-surface border border-fb-border/40"
            />
          ))}
        </div>
      </div>

      {/* Center loading indicator */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-fb-surface border border-fb-border rounded-full px-4 py-2 shadow-xl">
        <div className="size-5 flex items-center justify-center animate-pulse">
          <Image
            src="/logo.png"
            alt="FinalizaBOT"
            width={20}
            height={20}
            className="size-5 object-contain"
          />
        </div>
        <span className="text-xs text-fb-text-muted">{LOADING_COPY.match}</span>
      </div>
    </div>
  );
}
