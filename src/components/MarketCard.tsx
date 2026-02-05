import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface MarketCardProps {
  match: {
    homeTeam: string;
    awayTeam: string;
    competition: string;
    kickoffAt: Date | string;
  };
  player: {
    name: string;
    position: string;
    sofascoreId: string;
    sofascoreUrl: string;
  };
  line: number;
  odds: number;
  u5Hits: number;
  u10Hits: number;
  cv: number | null;
  shotsSeries: number[];
  minutesSeries: number[];
}

export default function MarketCard({
  match,
  player,
  line,
  odds,
  u5Hits,
  u10Hits,
  cv,
  shotsSeries,
  minutesSeries,
}: MarketCardProps) {
  const formattedLine = Number.isInteger(line)
    ? line.toFixed(0)
    : line.toFixed(1);
  const formattedOdds = odds.toFixed(2);

  return (
    <Card className="w-full">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{player.name}</CardTitle>
            <CardDescription>
              {player.position} • {match.homeTeam} vs {match.awayTeam}
            </CardDescription>
            <CardDescription>{match.competition}</CardDescription>
          </div>
          <a
            href={player.sofascoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            ID: {player.sofascoreId}
          </a>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Over {formattedLine} Finalizações</Badge>
          <Badge variant="outline">@ {formattedOdds}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-emerald-50 p-2">
            <p className="text-xs text-emerald-700">U5</p>
            <p className="text-lg font-semibold text-emerald-800">{u5Hits}/5</p>
          </div>
          <div className="rounded-md bg-emerald-50 p-2">
            <p className="text-xs text-emerald-700">U10</p>
            <p className="text-lg font-semibold text-emerald-800">
              {u10Hits}/10
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-gray-500">CV: </span>
            <span className="font-semibold text-gray-900">
              {cv !== null ? cv.toFixed(2) : "N/A"}
            </span>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Shots (últimos 10)
          </p>
          <div className="flex flex-wrap gap-2">
            {shotsSeries.map((shot, idx) => (
              <Badge
                key={`${shot}-${idx}`}
                variant={shot >= line ? "default" : "destructive"}
                className="px-2 py-1"
              >
                {shot}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Minutos (últimos 10)
          </p>
          <div className="flex flex-wrap gap-2">
            {minutesSeries.map((min, idx) => (
              <Badge
                key={`${min}-${idx}`}
                variant="outline"
                className="px-2 py-1"
              >
                {min}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
