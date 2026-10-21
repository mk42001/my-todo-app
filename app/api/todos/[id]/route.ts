// TODO の完了切り替え（PATCH）と削除（DELETE）
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ErrorResponse, TodoItem } from "../route";

// ---- リクエスト / レスポンスの型（画面側から import type で使う） ----
export type UpdateTodoRequest = { isCompleted: boolean };
export type UpdateTodoResponse = { todo: TodoItem };
export type DeleteTodoResponse = { success: true };

// UUID 以外が来ると Prisma がエラーになるので、先に形式を確認する
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(request: Request, ctx: RouteContext<"/api/todos/[id]">) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json<ErrorResponse>(
      { error: "ログインが必要です" },
      { status: 401 },
    );
  }

  const { id } = await ctx.params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json<ErrorResponse>({ error: "IDが不正です" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as Partial<UpdateTodoRequest> | null;
  if (typeof body?.isCompleted !== "boolean") {
    return NextResponse.json<ErrorResponse>(
      { error: "isCompleted は真偽値で指定してください" },
      { status: 400 },
    );
  }

  // id と user_id の両方で絞り込む（他人の TODO は更新できない）
  const { count } = await prisma.todo.updateMany({
    where: { id, userId: user.id },
    data: { isCompleted: body.isCompleted },
  });
  if (count === 0) {
    return NextResponse.json<ErrorResponse>(
      { error: "TODO が見つかりません" },
      { status: 404 },
    );
  }

  const todo = await prisma.todo.findFirst({ where: { id, userId: user.id } });
  if (!todo) {
    return NextResponse.json<ErrorResponse>(
      { error: "TODO が見つかりません" },
      { status: 404 },
    );
  }

  return NextResponse.json<UpdateTodoResponse>({
    todo: {
      id: todo.id,
      title: todo.title,
      isCompleted: todo.isCompleted,
      createdAt: todo.createdAt.toISOString(),
    },
  });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/todos/[id]">) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json<ErrorResponse>(
      { error: "ログインが必要です" },
      { status: 401 },
    );
  }

  const { id } = await ctx.params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json<ErrorResponse>({ error: "IDが不正です" }, { status: 400 });
  }

  // id と user_id の両方で絞り込む（他人の TODO は削除できない）
  const { count } = await prisma.todo.deleteMany({
    where: { id, userId: user.id },
  });
  if (count === 0) {
    return NextResponse.json<ErrorResponse>(
      { error: "TODO が見つかりません" },
      { status: 404 },
    );
  }

  return NextResponse.json<DeleteTodoResponse>({ success: true });
}
