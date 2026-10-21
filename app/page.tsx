"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { isOverdue } from "@/lib/due-date";
import { createClient } from "@/lib/supabase/client";
import type {
  CreateTodoRequest,
  CreateTodoResponse,
  ErrorResponse,
  GetTodosResponse,
  TodoItem,
} from "@/app/api/todos/route";
import type {
  UpdateTodoRequest,
  UpdateTodoResponse,
} from "@/app/api/todos/[id]/route";

// API がエラーを返したときのメッセージを取り出す
async function readError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => null)) as ErrorResponse | null;
  return data?.error ?? "エラーが発生しました";
}

// 完了日時をブラウザのローカル時間で「2026/10/21 16:30」の形式にする
function formatCompletedAt(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 入力欄の共通スタイル（ライト / ダーク両対応）
const inputClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500";

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  // ログイン中のメールアドレスと TODO 一覧を取得する
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? ""));

    fetch("/api/todos")
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        const data = (await res.json()) as GetTodosResponse;
        setTodos(data.todos);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return;
    setError("");
    setAdding(true);

    try {
      const body: CreateTodoRequest = { title, dueDate: dueDate || null };
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await readError(res));
      const data = (await res.json()) as CreateTodoResponse;
      // 新しい TODO を先頭に追加する
      setTodos((prev) => [data.todo, ...prev]);
      setTitle("");
      setDueDate("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setAdding(false);
    }
  }

  // 完了切り替え・期限変更に共通の更新処理
  async function updateTodo(id: string, body: UpdateTodoRequest) {
    setError("");
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await readError(res));
      const data = (await res.json()) as UpdateTodoResponse;
      setTodos((prev) => prev.map((t) => (t.id === id ? data.todo : t)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    }
  }

  async function handleDelete(id: string) {
    setError("");
    try {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await readError(res));
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex shrink-0 items-center gap-3">
            <h1 className="text-lg font-semibold">My TODO App</h1>
            <ThemeToggle />
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <span className="truncate text-sm text-zinc-500 dark:text-zinc-400">
              {email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <h2 className="text-xl font-semibold">やること</h2>

          <form onSubmit={handleAdd} className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="新しい TODO を入力"
              aria-label="新しい TODO"
              className={`${inputClass} min-w-0 flex-1`}
            />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-label="期限"
              title="期限（任意）"
              className={`${inputClass} sm:w-40`}
            />
            <button
              type="submit"
              disabled={adding || !title.trim()}
              className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              追加
            </button>
          </form>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300"
            >
              {error}
            </p>
          )}

          {loading ? (
            <p className="mt-8 text-center text-sm text-zinc-500">読み込み中...</p>
          ) : todos.length === 0 ? (
            <p className="mt-8 text-center text-sm text-zinc-500">
              TODO はまだありません
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-zinc-200 dark:divide-zinc-800">
              {todos.map((todo) => {
                const overdue = isOverdue(todo.dueDate, todo.isCompleted);
                return (
                  <li key={todo.id} className="flex items-start gap-3 py-3">
                    <input
                      type="checkbox"
                      checked={todo.isCompleted}
                      onChange={() =>
                        updateTodo(todo.id, { isCompleted: !todo.isCompleted })
                      }
                      aria-label={`${todo.title} を完了にする`}
                      className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-indigo-500"
                    />
                    <div className="min-w-0 flex-1">
                      <span
                        className={`block break-words ${
                          todo.isCompleted
                            ? "text-zinc-400 line-through dark:text-zinc-500"
                            : overdue
                              ? "font-medium text-red-600 dark:text-red-400"
                              : "text-zinc-900 dark:text-zinc-100"
                        }`}
                      >
                        {todo.title}
                      </span>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <input
                          type="date"
                          value={todo.dueDate ?? ""}
                          onChange={(e) =>
                            updateTodo(todo.id, { dueDate: e.target.value || null })
                          }
                          aria-label={`${todo.title} の期限`}
                          title="期限（空にすると期限なし）"
                          className={`rounded-md border bg-white px-2 py-0.5 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500/30 dark:bg-zinc-800 ${
                            overdue
                              ? "border-red-400 text-red-600 dark:border-red-500/60 dark:text-red-400"
                              : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                          }`}
                        />
                        {overdue && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/60 dark:text-red-300">
                            期限切れ
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleDelete(todo.id)}
                        className="rounded-lg px-2.5 py-1 text-sm text-zinc-500 transition hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/50 dark:hover:text-red-300"
                      >
                        削除
                      </button>
                      {todo.isCompleted && todo.completedAt && (
                        <span className="text-right text-xs text-zinc-500 dark:text-zinc-400">
                          <span className="block sm:inline">完了 </span>
                          {formatCompletedAt(todo.completedAt)}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
