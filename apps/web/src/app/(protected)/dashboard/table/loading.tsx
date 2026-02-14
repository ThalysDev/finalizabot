import { LoadingState } from "@/components/ui/LoadingState";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for the advanced analytics table page.
 * Shows a realistic table placeholder while data is being fetched.
 */
export default function TableLoading() {
  return (
    <LoadingState title="Carregando tabela avançada">
      <div className="max-w-[1400px] mx-auto animate-pulse">
        <div className="rounded-xl bg-fb-surface p-4 mb-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>

        <div className="mt-6 mb-4">
          <Skeleton className="h-7 w-72 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="rounded-xl bg-fb-surface overflow-hidden">
          <div className="flex items-center gap-4 p-4 border-b border-fb-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, row) => (
            <div
              key={row}
              className="flex items-center gap-4 p-4 border-b border-fb-border/50"
            >
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="size-8 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-28 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </LoadingState>
  );
}
