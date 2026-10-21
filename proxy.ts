// セッション管理と未ログイン時のリダイレクト（Next.js 16 では middleware.ts ではなく proxy.ts）
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ログインしていなくてもアクセスできるページ
const PUBLIC_PATHS = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 更新されたトークンをリクエストとレスポンスの両方に反映する
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() は Supabase 側でトークンを検証する（getSession() は検証しないので使わない）
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.includes(pathname);

  // 未ログインで保護ページにアクセス → /login へ
  if (!user && !isPublic) {
    return redirectWithCookies(request, response, "/login");
  }

  // ログイン済みで /login, /signup にアクセス → / へ
  if (user && isPublic) {
    return redirectWithCookies(request, response, "/");
  }

  return response;
}

// リダイレクト時も、更新されたセッション Cookie を引き継ぐ
function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  path: string,
) {
  const redirect = NextResponse.redirect(new URL(path, request.url));
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  // 静的ファイルと API 以外のすべてのパスで実行する
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
