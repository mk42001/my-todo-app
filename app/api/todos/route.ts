// TODO の一覧取得（GET）と追加（POST）
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { formatDueDate, parseDueDate } from "@/lib/due-date";
import { prisma } from "@/lib/prisma";

// ---- リクエスト / レスポンスの型（画面側から import type で使う） ----
export type TodoItem = {
  id: string;
  title: string;
  isCompleted: boolean;
  // 期限（YYYY-MM-DD）。未設定は null
  dueDate: string | null;
  // 完了した日時（ISO 8601）。未完了は null
  completedAt: string | null;
  createdAt: string;
};
export type ErrorResponse = { error: string };
export type GetTodosResponse = { todos: TodoItem[] };
export type CreateTodoRequest = { title: string; dueDate?: string | null };
export type CreateTodoResponse = { todo: TodoItem };

const MAX_TITLE_LENGTH = 200;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json<ErrorResponse>(
      { error: "ログインが必要です" },
      { status: 401 },
    );
  }

  // 必ずログイン中のユーザーの user_id で絞り込む
  const todos = await prisma.todo.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json<GetTodosResponse>({
    todos: todos.map((t) => ({
      id: t.id,
      title: t.title,
      isCompleted: t.isCompleted,
      dueDate: formatDueDate(t.dueDate),
      completedAt: t.completedAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json<ErrorResponse>(
      { error: "ログインが必要です" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as Partial<CreateTodoRequest> | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";

  if (!title) {
    return NextResponse.json<ErrorResponse>(
      { error: "タイトルを入力してください" },
      { status: 400 },
    );
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json<ErrorResponse>(
      { error: `タイトルは${MAX_TITLE_LENGTH}文字以内で入力してください` },
      { status: 400 },
    );
  }

  // 期限は任意。空文字・null・未指定は「期限なし」として扱う
  let dueDate: Date | null = null;
  if (body?.dueDate) {
    const parsed = typeof body.dueDate === "string" ? parseDueDate(body.dueDate) : undefined;
    if (!parsed) {
      return NextResponse.json<ErrorResponse>(
        { error: "期限の日付が正しくありません" },
        { status: 400 },
      );
    }
    dueDate = parsed;
  }

  // user_id はリクエストからではなく、認証したユーザーから設定する
  const todo = await prisma.todo.create({
    data: { title, dueDate, userId: user.id },
  });

  return NextResponse.json<CreateTodoResponse>(
    {
      todo: {
        id: todo.id,
        title: todo.title,
        isCompleted: todo.isCompleted,
        dueDate: formatDueDate(todo.dueDate),
        completedAt: todo.completedAt?.toISOString() ?? null,
        createdAt: todo.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
