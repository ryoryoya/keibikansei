// ============================================================
// 警備管制システム - 共有型定義
// Prisma の生成型を拡張するアプリケーション固有の型
// ============================================================

// NOTE: Prisma Client 生成後に以下のコメントを解除してください
// import type {
//   User, GuardProfile, Project, Assignment,
//   Attendance, Site, Client,
// } from "@prisma/client";

// Prisma Client 未生成時の仮型（npm run db:generate 後に上記に切り替え）
type User = any;
type GuardProfile = any;
type Project = any;
type Assignment = any;
type Attendance = any;
type Site = any;
type Client = any;

// --- ユーザー関連 ---
export type UserWithProfile = User & {
  guardProfile: GuardProfile | null;
};

// --- 案件関連 ---
export type ProjectWithSite = Project & {
  site: Site & {
    client: Client;
  };
};

export type ProjectWithAssignments = Project & {
  site: Site;
  assignments: (Assignment & {
    user: User;
    attendances: Attendance[];
  })[];
};

// --- 当日管理画面用 ---
export type DailyAssignment = Assignment & {
  user: UserWithProfile;
  project: ProjectWithSite;
  attendances: Attendance[];
};

// --- カレンダー表示用 ---
export type CalendarDay = {
  date: string; // YYYY-MM-DD
  projects: {
    id: string;
    name: string;
    siteName: string;
    requiredGuards: number;
    assignedGuards: number;
    status: "sufficient" | "shortage" | "empty";
  }[];
};

// --- 給与明細用 ---
export type PayrollSummary = {
  userId: string;
  userName: string;
  totalWorkDays: number;
  totalBaseAmount: number;
  totalOvertimeAmount: number;
  totalNightAmount: number;
  totalHolidayAmount: number;
  totalAllowances: number;
  totalDeductions: number;
  totalTaxWithheld: number;
  totalSocialInsurance: number;
  totalNetPay: number;
};

// --- API レスポンス ---
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    perPage: number;
  };
};

// --- 勤怠計算ヘルパー ---
export type AttendanceCalcResult = {
  totalMinutes: number;
  overtimeMinutes: number;
  nightMinutes: number;
  isHoliday: boolean;
  baseAmount: number;
  overtimeAmount: number;
  nightAmount: number;
  holidayAmount: number;
};
