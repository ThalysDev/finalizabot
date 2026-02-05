import Link from "next/link";
import { getBaseUrl } from "@/lib/http/base-url";

type MatchListItem = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  kickoffAt: string;
};

async function getMatches() {
  const baseUrl = await getBaseUrl();
  const res = await fetch(`${baseUrl}/api/matches`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch matches");
  }

  return res.json();
}

export default async function Home() {
  const { matches } = await getMatches();

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            FinalizaBOT
          </h1>
          <p className="text-gray-600">
            Cards de Abertura de Mercado - Finalizações
          </p>
        </header>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Partidas Disponíveis
          </h2>

          {matches.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-600">
                Nenhuma partida disponível no momento.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Execute o seed para popular o banco de dados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match: MatchListItem) => (
                <Link
                  key={match.id}
                  href={`/match/${match.id}`}
                  className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {match.homeTeam} vs {match.awayTeam}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {match.competition}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {new Date(match.kickoffAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      <br />
                      {new Date(match.kickoffAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
