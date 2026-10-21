// 期限（日付のみ）の変換・判定ヘルパー
// API とのやり取りは "YYYY-MM-DD" 形式の文字列で統一する

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// "YYYY-MM-DD" を検証して Date（UTC の 0 時）にする。不正なら undefined
export function parseDueDate(value: string): Date | undefined {
  if (!DATE_PATTERN.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  // 2026-02-31 のような実在しない日付を弾く
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return undefined;
  }
  return date;
}

// DB の Date を "YYYY-MM-DD" にする（未設定は null）
export function formatDueDate(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

// 期限切れ判定：期限が今日より前 かつ 未完了（当日は期限切れにしない）
export function isOverdue(dueDate: string | null, isCompleted: boolean): boolean {
  if (!dueDate || isCompleted) return false;
  return dueDate < todayString();
}

// ブラウザのローカル日付を "YYYY-MM-DD" で返す
function todayString(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
