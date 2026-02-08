import type { Metadata } from "next";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { fetchDashboardData } from "@/data/fetchers";

export const metadata: Metadata = {
  title: "Dashboard - FinalizaBOT",
  description: "Visão geral do mercado de finalizações",
};

/* ============================================================================
   PAGE
   ============================================================================ */
export default async function DashboardPage() {
  const { players, nextMatch } = await fetchDashboardData();

  return <DashboardContent players={players} nextMatch={nextMatch} />;
}
