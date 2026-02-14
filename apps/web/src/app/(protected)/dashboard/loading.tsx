import { GridCardsLoading, LoadingState } from "@/components/ui/LoadingState";

export default function DashboardLoading() {
  return (
    <LoadingState title="Carregando dashboard">
      <div className="animate-pulse">
        <div className="flex gap-2 mb-6">
          <div className="h-9 w-24 bg-fb-surface rounded-lg" />
          <div className="h-9 w-24 bg-fb-surface rounded-lg" />
        </div>

        <div className="flex gap-3 mb-6">
          <div className="h-10 flex-1 bg-fb-surface rounded-lg" />
          <div className="h-10 w-32 bg-fb-surface rounded-lg" />
        </div>

        <GridCardsLoading count={6} />
      </div>
    </LoadingState>
  );
}
