// Prisma CLI の設定ファイル
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // db push やマイグレーションはプーラーを経由しない直接接続を使う
    url: env("DIRECT_URL"),
  },
});
