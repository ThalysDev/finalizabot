import type { Metadata } from "next";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { fetchDashboardData } from "@/data/fetchers";

export const metadata: Metadata = {
  title: "Dashboard - FinalizaBOT",
  description: "Visão geral do mercado de finalizações",
};

// ISR: revalidate every 2 minutes
export const revalidate = 120;

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
