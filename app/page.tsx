"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
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

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [title, setTitle] = useState("");
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
      const body: CreateTodoRequest = { title };
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(todo: TodoItem) {
    setError("");
    try {
      const body: UpdateTodoRequest = { isCompleted: !todo.isCompleted };
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await readError(res));
      const data = (await res.json()) as UpdateTodoResponse;
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? data.todo : t)));
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
    <div className="flex flex-1 flex-col bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <h1 className="shrink-0 text-lg font-semibold">My TODO App</h1>
          <div className="flex min-w-0 items-center gap-3">
            <span className="truncate text-sm text-zinc-400">{email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl sm:p-8">
          <h2 className="text-xl font-semibold">やること</h2>

          <form onSubmit={handleAdd} className="mt-5 flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="新しい TODO を入力"
              aria-label="新しい TODO"
              className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-50 placeholder-zinc-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
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
              className="mt-4 rounded-lg border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-300"
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
            <ul className="mt-5 divide-y divide-zinc-800">
              {todos.map((todo) => (
                <li key={todo.id} className="flex items-center gap-3 py-3">
                  <input
                    type="checkbox"
                    checked={todo.isCompleted}
                    onChange={() => handleToggle(todo)}
                    aria-label={`${todo.title} を完了にする`}
                    className="h-5 w-5 shrink-0 cursor-pointer accent-indigo-500"
                  />
                  <span
                    className={`min-w-0 flex-1 break-words ${
                      todo.isCompleted ? "text-zinc-500 line-through" : "text-zinc-100"
                    }`}
                  >
                    {todo.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(todo.id)}
                    className="shrink-0 rounded-lg px-2.5 py-1 text-sm text-zinc-400 transition hover:bg-red-950/50 hover:text-red-300"
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
