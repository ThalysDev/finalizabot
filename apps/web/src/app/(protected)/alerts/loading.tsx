export default function AlertsLoading() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-48 bg-fb-surface rounded-lg" />
        <div className="h-9 w-28 bg-fb-surface rounded-lg" />
      </div>

      {/* Alert cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-56 bg-fb-surface rounded-xl border border-fb-border/40"
          />
        ))}
      </div>
    </div>
  );
}
