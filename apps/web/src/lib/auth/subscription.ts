/**
 * Utilitários de subscrição — Server-side gating
 *
 * Consulta Prisma para determinar o tier do usuário logado.
 * Retorna FREE caso não haja registro de usuário.
 */

import { auth } from "@clerk/nextjs/server";
import type { UserTier } from "@/data/types";
import prisma from "@/lib/db/prisma";

/**
 * Retorna o tier do usuário atual (FREE ou PRO).
 * Chamada segura em Server Components e Route Handlers.
 */
export async function getUserTier(): Promise<UserTier> {
  const { userId } = await auth();

  if (!userId) return "FREE";

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { tier: true },
    });
    return user?.tier ?? "FREE";
  } catch {
    // Se a tabela User não existir ou houver erro, fallback seguro
    return "FREE";
  }
}

/**
 * Verifica se o usuário tem acesso PRO.
 */
export async function isPro(): Promise<boolean> {
  return (await getUserTier()) === "PRO";
}

/**
 * Filtra dados sensíveis baseado no tier do usuário.
 * Dados PRO são retornados como `null` para usuários FREE.
 */
export function gateProData<T extends Record<string, unknown>>(
  data: T[],
  proFields: (keyof T)[],
  userTier: UserTier,
): T[] {
  if (userTier === "PRO") return data;

  return data.map((row) => {
    const gated = { ...row };
    for (const field of proFields) {
      gated[field] = null as T[keyof T];
    }
    return gated;
  });
}
