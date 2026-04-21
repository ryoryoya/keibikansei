import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
} from "date-fns";
import type {
  ProjectBase,
  CalendarDay,
  AssignmentMap,
  DemoGuard,
} from "./assignment-types";
import { assignmentKey } from "./assignment-types";

// ============================================================
// デモ案件
// ============================================================
export const DEMO_PROJECTS: ProjectBase[] = [
  { id: "p1", name: "[A現場] 施設警備 常駐", siteName: "SBビル", clientName: "SBビルマネジメント", requiredGuards: 3, startTime: "08:00", endTime: "17:00" },
  { id: "p2", name: "[B現場] 交通誘導 日勤", siteName: "新宿区 道路工事", clientName: "東京建設", requiredGuards: 5, startTime: "08:00", endTime: "17:00" },
  { id: "p3", name: "[C現場] イベント警備", siteName: "渋谷 イベント会場", clientName: "渋谷商事", requiredGuards: 4, startTime: "18:00", endTime: "06:00" },
];

// ============================================================
// デモ隊員
// ============================================================
export const DEMO_GUARDS: DemoGuard[] = [
  { id: "g1", name: "田中 一郎", nameKana: "タナカ イチロウ", skills: ["リーダー"], qualifications: ["交通誘導警備業務検定2級"], shift: "DAY_OK" },
  { id: "g2", name: "高橋 二郎", nameKana: "タカハシ ジロウ", skills: [], qualifications: ["施設警備業務検定2級"], shift: "DAY_OK" },
  { id: "g3", name: "渡辺 三郎", nameKana: "ワタナベ サブロウ", skills: ["大型免許"], qualifications: ["交通誘導警備業務検定2級"], shift: "BOTH_OK" },
  { id: "g4", name: "伊藤 四郎", nameKana: "イトウ シロウ", skills: ["リーダー", "夜勤可"], qualifications: [], shift: "BOTH_OK" },
  { id: "g5", name: "小林 五郎", nameKana: "コバヤシ ゴロウ", skills: [], qualifications: ["施設警備業務検定2級"], shift: "NG" },
  { id: "g6", name: "加藤 六郎", nameKana: "カトウ ロクロウ", skills: ["夜勤可"], qualifications: [], shift: "NIGHT_OK" },
  { id: "g7", name: "吉田 七子", nameKana: "ヨシダ ナナコ", skills: ["英語対応可"], qualifications: [], shift: "DAY_OK" },
  { id: "g8", name: "山口 八郎", nameKana: "ヤマグチ ハチロウ", skills: ["普通免許"], qualifications: ["交通誘導警備業務検定1級", "交通誘導警備業務検定2級"], shift: "UNDECIDED" },
  { id: "g9", name: "松本 九郎", nameKana: "マツモト クロウ", skills: ["リーダー"], qualifications: [], shift: "DAY_OK" },
  { id: "g10", name: "井上 十子", nameKana: "イノウエ トウコ", skills: [], qualifications: [], shift: "DAY_OK" },
];

// ============================================================
// 特定日にどの案件が稼働するかを返す
// ============================================================
function getActiveProjectIds(day: Date, dayNum: number): string[] {
  const dow = getDay(day);
  const isWeekend = dow === 0 || dow === 6;
  const ids: string[] = [];

  // p1: 毎日（常駐）
  ids.push("p1");
  // p2: 平日のみ
  if (!isWeekend) ids.push("p2");
  // p3: 10〜15日のみ
  if (dayNum >= 10 && dayNum <= 15) ids.push("p3");

  return ids;
}

// ============================================================
// 月のベースカレンダーデータ生成（配置数なし）
// ============================================================
export function generateBaseCalendarDays(
  year: number,
  month: number
): { date: string; projectIds: string[] }[] {
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(new Date(year, month - 1));
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return days.map((day) => ({
    date: format(day, "yyyy-MM-dd"),
    projectIds: getActiveProjectIds(day, day.getDate()),
  }));
}

// ============================================================
// AssignmentMap を適用して CalendarDay[] を構築
// ============================================================
export function buildCalendarData(
  baseDays: { date: string; projectIds: string[] }[],
  assignmentMap: AssignmentMap
): CalendarDay[] {
  const projectMap = new Map(DEMO_PROJECTS.map((p) => [p.id, p]));

  return baseDays.map(({ date, projectIds }) => ({
    date,
    projects: projectIds.map((pid) => {
      const base = projectMap.get(pid)!;
      const assigned = assignmentMap[assignmentKey(date, pid)] ?? [];
      const assignedCount = assigned.length;
      const confirmedCount = assigned.filter((a) => a.status === "CONFIRMED").length;
      const status =
        assignedCount >= base.requiredGuards
          ? ("sufficient" as const)
          : assignedCount > 0
          ? ("shortage" as const)
          : ("empty" as const);
      return { ...base, assignedCount, confirmedCount, status };
    }),
  }));
}

// ============================================================
// 初期デモ配置データ（2026年3月を想定）
// ============================================================
export function generateInitialAssignments(
  year: number,
  month: number
): AssignmentMap {
  const base = generateBaseCalendarDays(year, month);
  const map: AssignmentMap = {};

  for (const { date, projectIds } of base) {
    const dayNum = parseInt(date.slice(8), 10);

    for (const pid of projectIds) {
      const project = DEMO_PROJECTS.find((p) => p.id === pid)!;
      // 日によって配置数を変える（デモ用）
      const filled = (dayNum % 3 === 0)
        ? project.requiredGuards       // 充足
        : (dayNum % 3 === 1)
        ? Math.max(0, project.requiredGuards - 1) // 1名不足
        : 0;                            // 未配置

      if (filled === 0) continue;

      const guards = DEMO_GUARDS.filter((g) => g.shift !== "NG").slice(0, filled);
      map[assignmentKey(date, pid)] = guards.map((g, i) => ({
        guardId: g.id,
        status: i < Math.floor(filled / 2) ? "CONFIRMED" : "PENDING",
      }));
    }
  }

  return map;
}
