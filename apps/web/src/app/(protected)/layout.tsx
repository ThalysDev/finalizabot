import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { DarkHeader } from "@/components/layout/DarkHeader";
import { BottomNavBar } from "@/components/mobile/BottomNavBar";

function PageSkeleton() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto animate-pulse">
      <div className="h-8 w-48 bg-fb-surface rounded-lg mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-48 bg-fb-surface rounded-2xl border border-fb-border/40"
          />
        ))}
      </div>
    </div>
  );
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-fb-bg text-fb-text">
      <DarkHeader />
      <main id="main-content" className="pb-16 md:pb-0">
        <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
      </main>
      <BottomNavBar />
    </div>
  );
}
