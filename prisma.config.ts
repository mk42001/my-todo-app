// Prisma CLI の設定ファイル
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // db push やマイグレーションはプーラーを経由しない直接接続を使う
    // prisma generate（postinstall）は DB に接続しないので、未設定でも失敗しないようにする
    url: process.env.DIRECT_URL ?? "",
  },
});
