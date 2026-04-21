// シフト管理の型定義とデモデータ

export type ShiftVal = "DAY_OK" | "NIGHT_OK" | "BOTH_OK" | "NG" | "UNDECIDED";

export type GuardShift = {
  id: string;
  name: string;
  submitted: boolean; // 提出済みか
  submittedAt: string | null; // 提出日時
  shifts: Record<string, ShiftVal | null>; // "YYYY-MM-DD" -> value
};

export const SHIFT_CONFIG: Record<ShiftVal, { bg: string; label: string; short: string }> = {
  DAY_OK:    { bg: "bg-blue-100 text-blue-700",    label: "日勤OK", short: "日" },
  NIGHT_OK:  { bg: "bg-indigo-100 text-indigo-700", label: "夜勤OK", short: "夜" },
  BOTH_OK:   { bg: "bg-green-100 text-green-700",   label: "両方OK", short: "◎" },
  NG:        { bg: "bg-red-100 text-red-700",        label: "勤務NG", short: "✕" },
  UNDECIDED: { bg: "bg-gray-100 text-gray-500",      label: "未定",   short: "？" },
};

export const SHIFT_ORDER: (ShiftVal | null)[] = [
  "BOTH_OK", "DAY_OK", "NIGHT_OK", "NG", "UNDECIDED", null
];

// 必要人数（デモ用：曜日別）
export const REQUIRED_DAY = 8;   // 日勤
export const REQUIRED_NIGHT = 4; // 夜勤

// ============================================================
// デモデータ生成（決定論的：guard index + day number でシード）
// ============================================================
const GUARDS_BASE = [
  { id: "g1",  name: "田中 一郎",   submitted: true,  submittedAt: "2026-03-05 10:23" },
  { id: "g2",  name: "高橋 二郎",   submitted: true,  submittedAt: "2026-03-06 09:15" },
  { id: "g3",  name: "渡辺 三郎",   submitted: true,  submittedAt: "2026-03-04 18:42" },
  { id: "g4",  name: "伊藤 四郎",   submitted: true,  submittedAt: "2026-03-07 11:00" },
  { id: "g5",  name: "小林 五郎",   submitted: false, submittedAt: null },
  { id: "g6",  name: "加藤 六郎",   submitted: true,  submittedAt: "2026-03-05 22:10" },
  { id: "g7",  name: "吉田 七子",   submitted: true,  submittedAt: "2026-03-06 14:30" },
  { id: "g8",  name: "山口 八郎",   submitted: false, submittedAt: null },
  { id: "g9",  name: "松本 九郎",   submitted: true,  submittedAt: "2026-03-08 08:05" },
  { id: "g10", name: "井上 十子",   submitted: true,  submittedAt: "2026-03-05 16:50" },
];

function seedVal(guardIdx: number, dayNum: number): ShiftVal | null {
  const seed = (guardIdx * 31 + dayNum * 17) % 11;
  if (seed < 3) return "DAY_OK";
  if (seed < 5) return "BOTH_OK";
  if (seed < 6) return "NIGHT_OK";
  if (seed < 7) return "NG";
  if (seed < 8) return "UNDECIDED";
  return null;
}

export function generateGuardShifts(year: number, month: number): GuardShift[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  return GUARDS_BASE.map((g, gi) => {
    const shifts: Record<string, ShiftVal | null> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      // 未提出の場合はすべて null
      shifts[key] = g.submitted ? seedVal(gi, d) : null;
    }
    return { ...g, shifts };
  });
}

// 日別の集計
export function calcDaySummary(
  guards: GuardShift[],
  dateKey: string
): { dayOk: number; nightOk: number } {
  let dayOk = 0;
  let nightOk = 0;
  for (const g of guards) {
    const v = g.shifts[dateKey];
    if (v === "DAY_OK" || v === "BOTH_OK") dayOk++;
    if (v === "NIGHT_OK" || v === "BOTH_OK") nightOk++;
  }
  return { dayOk, nightOk };
}
