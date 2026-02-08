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
  const { matches, todayCount, tomorrowCount } = await fetchDashboardData();

  return (
    <DashboardContent
      matches={matches}
      todayCount={todayCount}
      tomorrowCount={tomorrowCount}
    />
  );
}
