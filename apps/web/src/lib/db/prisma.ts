/**
 * Re-exports the Prisma singleton from @finalizabot/shared.
 * This file exists so that all `@/lib/db/prisma` imports in the
 * web app continue to work without changes.
 */
import { prisma } from "@finalizabot/shared";

export default prisma;
export { prisma };
