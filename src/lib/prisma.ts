import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
  var prismaPool: Pool | undefined;
}

export function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!globalThis.prisma) {
    globalThis.prismaPool ??= new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    globalThis.prisma = new PrismaClient({
      adapter: new PrismaPg(globalThis.prismaPool),
    });
  }

  return globalThis.prisma;
}