// 当日管理の型定義とデモデータ

export type GuardStatus =
  | "scheduled"     // 予定（開始時刻前）
  | "woke_up"       // 起床報告済み
  | "departed"      // 出発報告済み
  | "working"       // 上番中（定刻）
  | "late_in"       // 遅刻上番
  | "not_yet"       // 未上番（時刻超過）
  | "completed";    // 下番完了

export type DailyGuard = {
  id: string;
  assignmentId?: string; // DB連携時に使用
  name: string;
  plannedStart: string; // "HH:mm"
  plannedEnd: string;
  wakeUpAt: string | null;
  departureAt: string | null;
  clockIn: string | null;
  clockOut: string | null;
};

export type DailyProject = {
  id: string;
  name: string;
  client: string;
  startTime: string;
  endTime: string;
  guards: DailyGuard[];
};

// "HH:mm" → 総分数
export function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// 現在時刻の総分数
export function nowMin(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

// 現在時刻文字列 "HH:mm"
export function nowStr(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

// ステータス判定
export function calcStatus(guard: DailyGuard): GuardStatus {
  if (guard.clockOut) return "completed";
  if (guard.clockIn) {
    const late = timeToMin(guard.clockIn) > timeToMin(guard.plannedStart) + 10;
    return late ? "late_in" : "working";
  }
  if (guard.departureAt) return "departed";
  if (guard.wakeUpAt) return "woke_up";
  const overdue = nowMin() > timeToMin(guard.plannedStart) + 5;
  return overdue ? "not_yet" : "scheduled";
}

export const STATUS_CONFIG: Record<GuardStatus, { bg: string; label: string }> = {
  scheduled: { bg: "bg-gray-100 text-gray-500",   label: "待機" },
  woke_up:   { bg: "bg-sky-100 text-sky-700",      label: "起床済" },
  departed:  { bg: "bg-blue-100 text-blue-700",    label: "移動中" },
  working:   { bg: "bg-green-100 text-green-700",  label: "勤務中" },
  late_in:   { bg: "bg-amber-100 text-amber-700",  label: "遅刻" },
  not_yet:   { bg: "bg-red-100 text-red-700",      label: "未上番" },
  completed: { bg: "bg-slate-100 text-slate-600",  label: "完了" },
};

// ============================================================
// デモデータ（今日の稼働）
// ============================================================
export const DEMO_PROJECTS: DailyProject[] = [
  {
    id: "p1",
    name: "[A現場] 施設警備 常駐",
    client: "SBビルマネジメント",
    startTime: "08:00",
    endTime: "17:00",
    guards: [
      { id: "g1", name: "田中 一郎", plannedStart: "08:00", plannedEnd: "17:00", wakeUpAt: "06:30", departureAt: "07:10", clockIn: "07:52", clockOut: null },
      { id: "g2", name: "高橋 二郎", plannedStart: "08:00", plannedEnd: "17:00", wakeUpAt: "06:45", departureAt: "07:20", clockIn: "07:58", clockOut: null },
      { id: "g3", name: "渡辺 三郎", plannedStart: "08:00", plannedEnd: "17:00", wakeUpAt: "07:00", departureAt: "07:35", clockIn: "08:18", clockOut: null },
    ],
  },
  {
    id: "p2",
    name: "[B現場] 交通誘導 日勤",
    client: "東京建設",
    startTime: "08:00",
    endTime: "17:00",
    guards: [
      { id: "g4", name: "伊藤 四郎",  plannedStart: "08:00", plannedEnd: "17:00", wakeUpAt: "06:15", departureAt: "07:00", clockIn: "07:45", clockOut: null },
      { id: "g7", name: "吉田 七子",  plannedStart: "08:00", plannedEnd: "17:00", wakeUpAt: "06:50", departureAt: "07:25", clockIn: "07:55", clockOut: null },
      { id: "g9", name: "松本 九郎",  plannedStart: "08:00", plannedEnd: "17:00", wakeUpAt: "07:05", departureAt: null,    clockIn: null,    clockOut: null },
      { id: "g10", name: "井上 十子", plannedStart: "08:00", plannedEnd: "17:00", wakeUpAt: null,    departureAt: null,    clockIn: null,    clockOut: null },
    ],
  },
  {
    id: "p3",
    name: "[C現場] イベント警備 夜勤",
    client: "渋谷商事",
    startTime: "18:00",
    endTime: "06:00",
    guards: [
      { id: "g6", name: "加藤 六郎", plannedStart: "18:00", plannedEnd: "06:00", wakeUpAt: null, departureAt: null, clockIn: null, clockOut: null },
      { id: "g8", name: "山口 八郎", plannedStart: "18:00", plannedEnd: "06:00", wakeUpAt: null, departureAt: null, clockIn: null, clockOut: null },
      { id: "g5", name: "小林 五郎", plannedStart: "18:00", plannedEnd: "06:00", wakeUpAt: null, departureAt: null, clockIn: null, clockOut: null },
      { id: "g11", name: "中村 十一郎", plannedStart: "18:00", plannedEnd: "06:00", wakeUpAt: null, departureAt: null, clockIn: null, clockOut: null },
    ],
  },
];
