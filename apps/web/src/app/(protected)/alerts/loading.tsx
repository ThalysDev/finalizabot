import { LoadingState } from "@/components/ui/LoadingState";

export default function AlertsLoading() {
  return (
    <LoadingState title="Carregando alertas">
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 w-48 bg-fb-surface rounded-lg" />
          <div className="h-9 w-28 bg-fb-surface rounded-lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-56 bg-fb-surface rounded-xl border border-fb-border/40"
            />
          ))}
        </div>
      </div>
    </LoadingState>
  );
}
