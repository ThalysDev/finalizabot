import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/format/date";
import { getBaseUrl } from "@/lib/http/base-url";

type PlayerMatchStat = {
  id: string;
  matchDate: string;
  shots: number;
  minutesPlayed: number;
};

type PlayerMarketAnalysis = {
  id: string;
  line: number;
  odds: number;
  u5Hits: number;
  u10Hits: number;
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    competition: string;
  };
};

type PlayerResponse = {
  player: {
    id: string;
    name: string;
    position: string;
    sofascoreId: string;
    sofascoreUrl: string;
    matchStats: PlayerMatchStat[];
    marketAnalyses: PlayerMarketAnalysis[];
  };
};

async function getPlayer(id: string): Promise<PlayerResponse | null> {
  const baseUrl = await getBaseUrl();
  const res = await fetch(`${baseUrl}/api/players/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPlayer(id);

  if (!data || !data.player) {
    notFound();
  }

  const { player } = data;

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
             Voltar para Home
          </Link>
        </nav>

        <header className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                {player.name}
              </h1>
              <p className="text-gray-600">{player.position}</p>
            </div>
            <a
              href={player.sofascoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Ver no SofaScore
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            SofaScore ID: {player.sofascoreId}
          </p>
        </header>

        {player.marketAnalyses.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Última Análise de Mercado
            </h2>
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              {player.marketAnalyses.map((analysis) => (
                <div key={analysis.id}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {analysis.match.homeTeam} vs {analysis.match.awayTeam}
                      </p>
                      <p className="text-sm text-gray-600">
                        {analysis.match.competition}
                      </p>
                    </div>
                    <Link
                      href={`/match/${analysis.match.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      Ver partida
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Mercado</p>
                      <p className="font-semibold">Over {analysis.line}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Odds</p>
                      <p className="font-semibold">{analysis.odds}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">U5 Hits</p>
                      <p className="font-semibold text-green-700">
                        {analysis.u5Hits}/5
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">U10 Hits</p>
                      <p className="font-semibold text-green-700">
                        {analysis.u10Hits}/10
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Histórico de Partidas (últimos 10 jogos)
          </h2>

          {player.matchStats.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-600">
                Nenhum histórico de partidas disponível.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Data
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        Shots
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        Minutos
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {player.matchStats.map((stat) => (
                      <tr key={stat.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(stat.matchDate, false)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                          {stat.shots}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">
                          {stat.minutesPlayed}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
