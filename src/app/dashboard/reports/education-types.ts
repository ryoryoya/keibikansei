// 警備員教育記録簿（警備業法 第21条）の型定義とデモデータ
// 新任教育: 基本教育15h × 2 + 業務別15h = 45h
// 現任教育: 基本教育4h × 2 + 業務別4h = 12h/年

export type EducationSession = {
  id: string;
  date: string;
  category: "基本教育（法学）" | "基本教育（実務）" | "業務別教育";
  hours: number;
  instructor: string;
  location: string;
  notes: string;
};

export type GuardEducationRecord = {
  guardId: string;
  guardName: string;
  isNewEmployee: boolean;   // 新任教育中
  requiredHours: { legal: number; practical: number; jobSpecific: number };
  sessions: EducationSession[];
};

function completedHours(sessions: EducationSession[], cat: EducationSession["category"]): number {
  return sessions.filter((s) => s.category === cat).reduce((sum, s) => sum + s.hours, 0);
}

export function getCompletedHours(record: GuardEducationRecord) {
  return {
    legal:       completedHours(record.sessions, "基本教育（法学）"),
    practical:   completedHours(record.sessions, "基本教育（実務）"),
    jobSpecific: completedHours(record.sessions, "業務別教育"),
  };
}

export function getStatus(record: GuardEducationRecord): "完了" | "不足" | "受講中" {
  const done = getCompletedHours(record);
  const { legal, practical, jobSpecific } = record.requiredHours;
  if (done.legal >= legal && done.practical >= practical && done.jobSpecific >= jobSpecific) return "完了";
  if (done.legal > 0 || done.practical > 0 || done.jobSpecific > 0) return "受講中";
  return "不足";
}

// 指導教育責任者
const INSTRUCTOR = "鈴木 三郎（警備員指導教育責任者）";

export const DEMO_EDUCATION_RECORDS: GuardEducationRecord[] = [
  {
    guardId: "g1", guardName: "田中 一郎", isNewEmployee: false,
    requiredHours: { legal: 4, practical: 4, jobSpecific: 4 },
    sessions: [
      { id: "e1", date: "2025-09-10", category: "基本教育（法学）",  hours: 4, instructor: INSTRUCTOR, location: "本社研修室", notes: "警備業法改正点確認" },
      { id: "e2", date: "2025-09-11", category: "基本教育（実務）",  hours: 4, instructor: INSTRUCTOR, location: "本社研修室", notes: "護身術・応急手当" },
      { id: "e3", date: "2025-09-12", category: "業務別教育",        hours: 4, instructor: INSTRUCTOR, location: "A現場",     notes: "施設巡回実地訓練" },
    ],
  },
  {
    guardId: "g2", guardName: "高橋 二郎", isNewEmployee: false,
    requiredHours: { legal: 4, practical: 4, jobSpecific: 4 },
    sessions: [
      { id: "e4", date: "2025-09-10", category: "基本教育（法学）",  hours: 4, instructor: INSTRUCTOR, location: "本社研修室", notes: "" },
      { id: "e5", date: "2025-09-11", category: "基本教育（実務）",  hours: 4, instructor: INSTRUCTOR, location: "本社研修室", notes: "" },
      // 業務別教育が未実施 → 不足
    ],
  },
  {
    guardId: "g4", guardName: "伊藤 四郎", isNewEmployee: false,
    requiredHours: { legal: 4, practical: 4, jobSpecific: 4 },
    sessions: [
      { id: "e6", date: "2025-10-15", category: "基本教育（法学）",  hours: 4, instructor: INSTRUCTOR, location: "本社研修室", notes: "" },
      { id: "e7", date: "2025-10-15", category: "基本教育（実務）",  hours: 4, instructor: INSTRUCTOR, location: "本社研修室", notes: "" },
      { id: "e8", date: "2025-10-16", category: "業務別教育",        hours: 4, instructor: INSTRUCTOR, location: "B現場",     notes: "" },
    ],
  },
  {
    guardId: "g5", guardName: "渡辺 五郎", isNewEmployee: true,
    requiredHours: { legal: 15, practical: 15, jobSpecific: 15 },
    sessions: [
      { id: "e9",  date: "2025-04-07", category: "基本教育（法学）", hours: 8, instructor: INSTRUCTOR, location: "本社研修室", notes: "新任教育 第1回" },
      { id: "e10", date: "2025-04-08", category: "基本教育（法学）", hours: 7, instructor: INSTRUCTOR, location: "本社研修室", notes: "新任教育 第2回" },
      { id: "e11", date: "2025-04-09", category: "基本教育（実務）", hours: 8, instructor: INSTRUCTOR, location: "本社研修室", notes: "護身術・救急法" },
      { id: "e12", date: "2025-04-10", category: "基本教育（実務）", hours: 7, instructor: INSTRUCTOR, location: "本社研修室", notes: "各種機器操作" },
      { id: "e13", date: "2025-04-14", category: "業務別教育",       hours: 8, instructor: INSTRUCTOR, location: "A現場",     notes: "施設警備実地研修" },
      // 業務別7h 残 → 受講中
    ],
  },
  {
    guardId: "g7", guardName: "吉田 七子", isNewEmployee: false,
    requiredHours: { legal: 4, practical: 4, jobSpecific: 4 },
    sessions: [
      { id: "e14", date: "2025-09-10", category: "基本教育（法学）", hours: 4, instructor: INSTRUCTOR, location: "本社研修室", notes: "" },
      { id: "e15", date: "2025-09-11", category: "基本教育（実務）", hours: 4, instructor: INSTRUCTOR, location: "本社研修室", notes: "" },
      { id: "e16", date: "2025-09-12", category: "業務別教育",       hours: 4, instructor: INSTRUCTOR, location: "C現場",     notes: "" },
    ],
  },
];
