/**
 * Prisma client singleton — same pattern as pre-monorepo.
 * Imports @prisma/client directly for maximum compatibility with
 * Vercel serverless functions and Next.js bundler.
 *
 * Includes retry extension for transient Neon/PG connection errors.
 */
import { Prisma, PrismaClient } from "@prisma/client";

const TRANSIENT_CODES = new Set([
  "P1001", // Can't reach database server
  "P1002", // Database server timed out
  "P1008", // Operations timed out
  "P1017", // Server closed the connection
  "P2024", // Pool timeout
]);

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 200;

function isTransientError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return TRANSIENT_CODES.has(err.code);
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return true; // connection failures on cold start
  }
  return false;
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isTransientError(err) || attempt === MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, BASE_DELAY_MS * 2 ** attempt));
    }
  }
  throw lastError;
}

const prismaClientSingleton = () => {
  const base = new PrismaClient();

  return base.$extends({
    query: {
      $allOperations({ query, args }) {
        return withRetry(() => query(args));
      },
    },
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;
export { prisma };

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
