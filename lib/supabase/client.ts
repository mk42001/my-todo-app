// ブラウザ（クライアントコンポーネント）用の Supabase クライアント
// セッションは Cookie に保存されるので、proxy.ts からも読み取れる
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
