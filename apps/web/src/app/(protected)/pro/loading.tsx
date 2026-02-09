import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for the PRO analytics table.
 */
export default function ProLoading() {
  return (
    <div className="theme-pro">
      <div className="flex flex-col h-[calc(100vh-57px)]">
        <div className="p-5 pb-3">
          <Skeleton className="h-8 w-80 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="flex-1 px-5">
          <div className="rounded-xl bg-fb-surface overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 border-b border-fb-border">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
              ))}
            </div>
            {/* Rows */}
            {Array.from({ length: 10 }).map((_, row) => (
              <div
                key={row}
                className="flex items-center gap-4 p-4 border-b border-fb-border/50"
              >
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-4 flex-[2]" />
                <Skeleton className="h-4 flex-1" />
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
