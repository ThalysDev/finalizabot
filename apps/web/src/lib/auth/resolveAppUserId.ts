import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/db/prisma";

export async function resolveOrCreateAppUserId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  if (existing) return existing.id;

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress?.trim();
  if (!email) return null;

  const fullName = [clerkUser?.firstName, clerkUser?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const created = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {
      email,
      name: fullName || undefined,
    },
    create: {
      clerkId: userId,
      email,
      name: fullName || null,
    },
    select: { id: true },
  });

  return created.id;
}
