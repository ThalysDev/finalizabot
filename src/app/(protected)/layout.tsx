import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { DarkHeader } from "@/components/layout/DarkHeader";
import { BottomNavBar } from "@/components/mobile/BottomNavBar";

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
      <main className="pb-16 md:pb-0">{children}</main>
      <BottomNavBar />
    </div>
  );
}
