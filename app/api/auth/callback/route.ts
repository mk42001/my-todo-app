// メール確認後のリダイレクト先：code をセッションに交換してログイン状態にする
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    // 成功 → TODO ページへ
    if (!error) {
      return NextResponse.redirect(`${origin}/`);
    }
  }

  // code がない・無効・期限切れ・別ブラウザで開いた場合など
  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
