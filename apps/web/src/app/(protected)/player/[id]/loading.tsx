import { LoadingState } from "@/components/ui/LoadingState";
import { LOADING_COPY } from "@/lib/copy/navigation";

export default function PlayerLoading() {
  return (
    <LoadingState title={LOADING_COPY.player}>
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="bg-fb-surface rounded-2xl border border-fb-border/40 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="size-16 rounded-full bg-fb-surface-lighter" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-48 bg-fb-surface-lighter rounded" />
              <div className="h-4 w-32 bg-fb-surface-lighter rounded" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="h-16 bg-fb-surface-lighter rounded-lg" />
            <div className="h-16 bg-fb-surface-lighter rounded-lg" />
            <div className="h-16 bg-fb-surface-lighter rounded-lg" />
          </div>
        </div>

        <div className="bg-fb-surface rounded-2xl border border-fb-border/40 p-6 mb-6">
          <div className="h-5 w-40 bg-fb-surface-lighter rounded mb-4" />
          <div className="h-48 bg-fb-surface-lighter rounded-lg" />
        </div>

        <div className="bg-fb-surface rounded-2xl border border-fb-border/40 p-6">
          <div className="h-5 w-40 bg-fb-surface-lighter rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-fb-surface-lighter rounded" />
            ))}
          </div>
        </div>
      </div>
    </LoadingState>
  );
}
