// TODO の一覧取得（GET）と追加（POST）
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ---- リクエスト / レスポンスの型（画面側から import type で使う） ----
export type TodoItem = {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
};
export type ErrorResponse = { error: string };
export type GetTodosResponse = { todos: TodoItem[] };
export type CreateTodoRequest = { title: string };
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

  // user_id はリクエストからではなく、認証したユーザーから設定する
  const todo = await prisma.todo.create({
    data: { title, userId: user.id },
  });

  return NextResponse.json<CreateTodoResponse>(
    {
      todo: {
        id: todo.id,
        title: todo.title,
        isCompleted: todo.isCompleted,
        createdAt: todo.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
