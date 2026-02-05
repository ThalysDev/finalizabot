import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-gray-200">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {[1, 2, 3].map((j) => (
                    <div
                      key={j}
                      className="h-12 bg-gray-100 rounded animate-pulse"
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
