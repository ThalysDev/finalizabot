import Link from "next/link";
import { notFound } from "next/navigation";
import MarketCard from "@/components/MarketCard";
import { formatMatchDate } from "@/lib/format/date";
import { getBaseUrl } from "@/lib/http/base-url";

type MarketAnalysisItem = {
  id: string;
  line: number;
  odds: number;
  u5Hits: number;
  u10Hits: number;
  cv: number | null;
  shotsSeries: number[];
  minutesSeries: number[];
  player: {
    name: string;
    position: string;
    sofascoreId: string;
    sofascoreUrl: string;
  };
};

type MatchResponse = {
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    competition: string;
    matchDate: string;
    marketAnalyses: MarketAnalysisItem[];
  };
};

async function getMatch(id: string): Promise<MatchResponse | null> {
  const baseUrl = await getBaseUrl();
  const res = await fetch(`${baseUrl}/api/matches/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getMatch(id);

  if (!data || !data.match) {
    notFound();
  }

  const { match } = data;

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
             Voltar para Home
          </Link>
        </nav>

        <header className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {match.homeTeam} vs {match.awayTeam}
          </h1>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between text-gray-600">
            <p className="text-sm md:text-base">{match.competition}</p>
            <p className="text-sm md:text-base font-semibold">
              {formatMatchDate(match.matchDate)}
            </p>
          </div>
        </header>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Análises de Mercado
          </h2>

          {match.marketAnalyses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-600">
                Nenhuma análise disponível para esta partida.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {match.marketAnalyses.map((analysis) => (
                <MarketCard
                  key={analysis.id}
                  match={{
                    homeTeam: match.homeTeam,
                    awayTeam: match.awayTeam,
                    competition: match.competition,
                    matchDate: match.matchDate,
                  }}
                  player={{
                    name: analysis.player.name,
                    position: analysis.player.position,
                    sofascoreId: analysis.player.sofascoreId,
                    sofascoreUrl: analysis.player.sofascoreUrl,
                  }}
                  line={analysis.line}
                  odds={analysis.odds}
                  u5Hits={analysis.u5Hits}
                  u10Hits={analysis.u10Hits}
                  cv={analysis.cv}
                  shotsSeries={analysis.shotsSeries}
                  minutesSeries={analysis.minutesSeries}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
