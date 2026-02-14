import { defineConfig } from "prisma/config";

const defaultDatabaseUrl =
  "postgresql://user:password@localhost:5432/finalizabot?schema=public";

export default defineConfig({
  earlyAccess: true,
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? defaultDatabaseUrl,
    directUrl: process.env.DATABASE_URL_UNPOOLED ?? defaultDatabaseUrl,
  },
});
