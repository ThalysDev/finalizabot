import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface DashboardCardProps {
  playerName: string;
  position: string;
  team: string;
  u5: { value: number; total: number };
  u10: { value: number; total: number };
  cv: number;
  matchId: string;
}

export function DashboardCard({
  playerName,
  position,
  team,
  u5,
  u10,
  cv,
  matchId,
}: DashboardCardProps) {
  const u5Percentage = Math.round((u5.value / u5.total) * 100);
  const u10Percentage = Math.round((u10.value / u10.total) * 100);

  return (
    <Link href={`/match/${matchId}`}>
      <Card className="border-gray-200 hover:shadow-lg hover:border-blue-300 transition cursor-pointer">
        <CardContent className="pt-4">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-gray-900">
              {playerName}
            </h3>
            <p className="text-xs text-gray-600">
              {position} • {team}
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-blue-50 p-2 rounded text-center">
              <p className="text-xs text-gray-600">U5</p>
              <p className="text-sm font-bold text-blue-600">
                {u5.value}/{u5.total}
              </p>
              <p className="text-xs text-gray-500">{u5Percentage}%</p>
            </div>
            <div className="bg-green-50 p-2 rounded text-center">
              <p className="text-xs text-gray-600">U10</p>
              <p className="text-sm font-bold text-green-600">
                {u10.value}/{u10.total}
              </p>
              <p className="text-xs text-gray-500">{u10Percentage}%</p>
            </div>
            <div className="bg-gray-50 p-2 rounded text-center">
              <p className="text-xs text-gray-600">CV</p>
              <p className="text-sm font-bold text-gray-900">{cv.toFixed(2)}</p>
              <p className="text-xs text-gray-500">variação</p>
            </div>
          </div>

          {/* CTA */}
          <button className="w-full text-sm text-blue-600 font-medium hover:text-blue-700 transition">
            Ver análise →
          </button>
        </CardContent>
      </Card>
    </Link>
  );
}
