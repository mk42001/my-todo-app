// アプリから使う Prisma Client
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// アプリ実行時はプーラー経由の DATABASE_URL を使う
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// 開発中のホットリロードで接続が増え続けないよう、グローバルに使い回す
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
