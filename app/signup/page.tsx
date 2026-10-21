"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // 確認メールのリンクの飛び先（Supabase の Redirect URLs に登録が必要）
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // メール確認が無効ならそのままログイン状態になる → TODO ページへ
    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    // メール確認が有効な場合は、確認メールのリンクを開くまでログインできない
    setMessage("確認メールを送信しました。メール内のリンクを開いてから、ログインしてください。");
    setLoading(false);
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        <h1 className="text-center text-2xl font-semibold text-zinc-50">
          新規登録
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-400">
          メールアドレスとパスワードでアカウントを作成します
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-zinc-300"
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-50 placeholder-zinc-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-zinc-300"
            >
              パスワード
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-50 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
            <p className="mt-1.5 text-xs text-zinc-500">6文字以上で入力してください</p>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          {message && (
            <p
              role="status"
              className="rounded-lg border border-emerald-900/60 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-300"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "登録中..." : "新規登録"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          すでにアカウントをお持ちの方は{" "}
          <Link
            href="/login"
            className="font-medium text-indigo-400 hover:text-indigo-300"
          >
            ログイン
          </Link>
        </p>
      </div>
    </main>
  );
}
