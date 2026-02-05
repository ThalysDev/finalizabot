import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { EmptyState } from "@/components/dashboard/EmptyState";

export const metadata: Metadata = {
  title: "Dashboard - FinalizaBOT",
  description: "Seu dashboard de análises de finalizações",
};

async function getMatches() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/matches`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Failed to fetch matches");
    return response.json();
  } catch (error) {
    console.error("Error fetching matches:", error);
    return [];
  }
}

interface Match {
  id: string;
  playerName?: string;
  position?: string;
  team?: string;
  u5?: number;
  u10?: number;
  cv?: number;
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const matches = await getMatches();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Dashboard Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bem-vindo ao Dashboard
            </h1>
            <p className="text-gray-600">
              Acompanhe os últimos matches e seus jogadores favoritos
            </p>
          </div>
          Match
          {/* Recent Matches Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Últimos Matches Analisados
            </h2>

            {matches && matches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.slice(0, 6).map((match: any) => (
                  <DashboardCard
                    key={match.id}
                    playerName={match.playerName || "Jogador"}
                    position={match.position || "N/A"}
                    team={match.team || "Time"}
                    u5={{ value: match.u5 || 0, total: 5 }}
                    u10={{ value: match.u10 || 0, total: 10 }}
                    cv={match.cv || 0}
                    matchId={match.id}
                  />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </section>
          {/* Favorites Section (Placeholder) */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Seus Favoritos
            </h2>
            <EmptyState />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
