// カレンダー・配置管理の共有型定義

export type ProjectBase = {
  id: string;
  name: string;
  siteName: string;
  clientName: string;
  requiredGuards: number;
  startTime: string;
  endTime: string;
};

// 配置レコード（PENDING=配置予定 / CONFIRMED=確定済み）
export type AssignedGuard = {
  guardId: string;
  status: "PENDING" | "CONFIRMED";
};

// キー = "YYYY-MM-DD__projectId"
export type AssignmentMap = Record<string, AssignedGuard[]>;

export type CalendarProject = ProjectBase & {
  assignedCount: number;
  confirmedCount: number;
  status: "sufficient" | "shortage" | "empty";
};

export type CalendarDay = {
  date: string;
  projects: CalendarProject[];
};

export type DemoGuard = {
  id: string;
  name: string;
  nameKana: string;
  skills: string[];
  qualifications: string[];
  shift: "DAY_OK" | "NIGHT_OK" | "BOTH_OK" | "NG" | "UNDECIDED";
};

// AssignmentMap のキーを生成
export const assignmentKey = (date: string, projectId: string) =>
  `${date}__${projectId}`;

// 特定日付×案件の配置リストを取得
export const getAssignments = (
  map: AssignmentMap,
  date: string,
  projectId: string
): AssignedGuard[] => map[assignmentKey(date, projectId)] ?? [];

// 特定日付に配置済みの guardId 一覧（全案件）
export const getAssignedGuardIdsOnDate = (
  map: AssignmentMap,
  date: string
): Set<string> => {
  const result = new Set<string>();
  for (const [key, guards] of Object.entries(map)) {
    if (key.startsWith(date)) {
      guards.forEach((g) => result.add(g.guardId));
    }
  }
  return result;
};
