import { defineConfig } from "prisma/config";

const fallbackDatabaseUrl = "postgresql://postgres:postgres@localhost:5432/trekking";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // `prisma generate` runs during npm install, before local env files are always present.
    url: process.env.DATABASE_URL ?? fallbackDatabaseUrl,
  },
});