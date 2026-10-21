# My TODO App

Supabase Auth でログインして使う、シンプルな TODO アプリです。

## 機能

- メールアドレスとパスワードでの新規登録・ログイン・ログアウト
- TODO の追加・一覧表示・完了切り替え・削除
- 自分の TODO だけが表示・操作できる（ユーザーごとに分離）

## 技術スタック

- [Next.js](https://nextjs.org) 16（App Router）/ React 19 / TypeScript
- [Tailwind CSS](https://tailwindcss.com) 4
- [Supabase](https://supabase.com)（認証 + PostgreSQL）
- [Prisma](https://www.prisma.io) 7（DB アクセス）

## 構成

| パス | 内容 |
|---|---|
| `app/page.tsx` | TODO 画面（要ログイン） |
| `app/login/`, `app/signup/` | ログイン・新規登録ページ |
| `app/api/todos/` | TODO の Route Handler（取得・追加・更新・削除） |
| `app/api/auth/callback/` | メール確認後のリダイレクト先 |
| `proxy.ts` | セッション管理と、未ログイン時の `/login` へのリダイレクト |
| `prisma/schema.prisma` | `todos` テーブルの定義 |

画面は認証に supabase-js を使い、DB の読み書きは Route Handler の中で Prisma を使います。
Route Handler は、ログイン中のユーザーを確認したうえで、必ず `user_id` で絞り込みます。

## セットアップ

### 1. インストール

```bash
npm install
```

`postinstall` で `prisma generate` が実行され、Prisma Client が生成されます。

### 2. 環境変数

プロジェクト直下に `.env` を作成し、次の値を設定します。

```env
# Supabase の「Connect」→「ORMs」→「Prisma」に表示される値
# [YOUR-PASSWORD] はデータベースのパスワードに置き換える
DATABASE_URL="postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-xxxx.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-xxxx.pooler.supabase.com:5432/postgres"

# Project Settings →「API Keys」にある値
NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
```

| 変数 | 用途 |
|---|---|
| `DATABASE_URL` | アプリ実行時の DB 接続（プーラー経由、ポート 6543） |
| `DIRECT_URL` | `prisma db push` などの DB 接続（ポート 5432）。デプロイ先では不要 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase の Project URL（`https://〇〇.supabase.co`）。ダッシュボードの URL ではない |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ブラウザに公開してよいキー |

`.env` は `.gitignore` に入っているので、コミットされません。
`sb_secret_...` や `service_role` のキーは、`NEXT_PUBLIC_` を付けて公開しないでください。

### 3. テーブルの作成

```bash
npx prisma db push
```

### 4. RLS（Row Level Security）の設定

Supabase の SQL Editor で、次を実行します。
Prisma 経由のアクセスには RLS が効きませんが、`supabase-js` で直接アクセスされた場合に備えて設定します。

```sql
alter table public.todos enable row level security;

create policy "Users can view their own todos"
on public.todos for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own todos"
on public.todos for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own todos"
on public.todos for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own todos"
on public.todos for delete to authenticated
using ((select auth.uid()) = user_id);
```

### 5. Supabase の認証設定

Authentication → URL Configuration で、次を設定します。

- **Site URL**：アプリの URL（開発中は `http://localhost:3000`）
- **Redirect URLs**：`<アプリの URL>/api/auth/callback`

メール確認（Confirm email）を使う場合、確認メールのリンクは、登録したのと同じブラウザで開いてください。
無料枠の標準のメール送信は上限が厳しいので、開発中は Confirm email をオフにするか、独自の SMTP を設定すると便利です。

### 6. 起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開きます。

## デプロイ（Vercel）

環境変数に `DATABASE_URL`、`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` を設定して、デプロイします。
`NEXT_PUBLIC_` の値はビルド時に埋め込まれるので、変更したときは再デプロイが必要です。

## スクリプト

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | 本番用にビルド |
| `npm run start` | ビルドしたアプリを起動 |
| `npm run lint` | ESLint を実行 |
