export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto animate-pulse">
      {/* Day tabs skeleton */}
      <div className="flex gap-2 mb-6">
        <div className="h-9 w-24 bg-fb-surface rounded-lg" />
        <div className="h-9 w-24 bg-fb-surface rounded-lg" />
      </div>

      {/* Search + filters skeleton */}
      <div className="flex gap-3 mb-6">
        <div className="h-10 flex-1 bg-fb-surface rounded-lg" />
        <div className="h-10 w-32 bg-fb-surface rounded-lg" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-64 bg-fb-surface rounded-2xl border border-fb-border/40"
          />
        ))}
      </div>
    </div>
  );
}
