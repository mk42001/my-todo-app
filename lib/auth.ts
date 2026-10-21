// Route Handler 用：ログイン中のユーザーを確認する
import { createClient } from "@/lib/supabase/server";

// ログインしていなければ null を返す
export async function getCurrentUser() {
  const supabase = await createClient();
  // getUser() は Supabase 側でトークンを検証する（getSession() は検証しないので使わない）
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
