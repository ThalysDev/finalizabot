import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Test - FinalizaBOT",
};

export default function DashboardTestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold text-fb-text mb-4">
        Dashboard Test Page
      </h1>
      <div className="bg-fb-surface border border-fb-border rounded-lg p-6">
        <p className="text-fb-text">
          ✅ Se você está vendo esta página, o problema NÃO é com autenticação.
        </p>
        <p className="text-fb-text-muted mt-2">
          O erro está provavelmente em:
        </p>
        <ul className="list-disc list-inside text-fb-text-muted mt-2 space-y-1">
          <li>Busca de dados do banco (fetchDashboardData)</li>
          <li>Componentes DashboardContent, ViewSwitcher ou MatchListItem</li>
          <li>Processamento de dados das partidas</li>
        </ul>
      </div>
    </div>
  );
}
