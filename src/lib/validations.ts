// ============================================================
// API入力バリデーション (Zod)
// ============================================================

import { z } from "zod";

// --- 隊員 ---
export const createGuardSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  name: z.string().min(1, "氏名は必須です").max(100),
  nameKana: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  birthDate: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  payType: z.enum(["DAILY", "MONTHLY", "HOURLY"]).default("DAILY"),
  basePay: z.number().int().min(0).default(0),
  qualifications: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
});

// --- 得意先 ---
export const createClientSchema = z.object({
  name: z.string().min(1, "得意先名は必須です").max(200),
  contactPerson: z.string().max(100).optional(),
  tel: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  billingCycleDay: z.number().int().min(1).max(31).default(31),
  paymentTermDays: z.number().int().min(0).default(30),
  taxType: z.enum(["INCLUSIVE", "EXCLUSIVE"]).default("EXCLUSIVE"),
});

// --- 現場 ---
export const createSiteSchema = z.object({
  clientId: z.string().uuid("得意先を選択してください"),
  name: z.string().min(1, "現場名は必須です").max(200),
  address: z.string().max(500).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  guardType: z.enum(["TYPE_1", "TYPE_2", "TYPE_3", "TYPE_4"]).default("TYPE_2"),
  notes: z.string().optional(),
});

// --- 案件 ---
export const createProjectSchema = z.object({
  siteId: z.string().uuid("現場を選択してください"),
  name: z.string().min(1, "案件名は必須です").max(300),
  startDate: z.string().min(1, "開始日は必須です"),
  endDate: z.string().optional(),
  requiredGuards: z.number().int().min(1).default(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM形式で入力してください"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM形式で入力してください"),
  unitPrice: z.number().int().min(0).default(0),
  guardPay: z.number().int().min(0).default(0),
  notes: z.string().optional(),
});

// --- シフト提出 ---
export const submitShiftSchema = z.object({
  targetDate: z.string().min(1, "日付は必須です"),
  availability: z.enum(["DAY_OK", "NIGHT_OK", "BOTH_OK", "NG", "UNDECIDED"]),
  memo: z.string().max(500).optional(),
});

// --- 配置 ---
export const createAssignmentSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  workDate: z.string().min(1),
  plannedStart: z.string().regex(/^\d{2}:\d{2}$/),
  plannedEnd: z.string().regex(/^\d{2}:\d{2}$/),
});

// --- 上番・下番打刻（段階打刻対応） ---
export const wakeUpCheckSchema = z.object({
  assignmentId: z.string().uuid(),
});

export const departureCheckSchema = z.object({
  assignmentId: z.string().uuid(),
});

export const clockInSchema = z.object({
  assignmentId: z.string().uuid(),
  latitude: z.number(),
  longitude: z.number(),
});

export const clockOutSchema = z.object({
  attendanceId: z.string().uuid(),
  latitude: z.number(),
  longitude: z.number(),
  breakMinutes: z.number().int().min(0).default(0),
  notes: z.string().optional(),
});

// --- 警備報告書（電子サイン対応） ---
export const submitReportSchema = z.object({
  assignmentId: z.string().uuid(),
  photoUrls: z.array(z.string().url()).min(1, "写真を1枚以上添付してください"),
  remarks: z.string().optional(),
  signatureDataUrl: z.string().min(1, "署名が必要です"), // Canvas toDataURL()
  signedByName: z.string().min(1, "署名者名は必須です"),
});

// --- 現場担当者承認（電子サイン） ---
export const clientApprovalSchema = z.object({
  reportId: z.string().uuid(),
  signatureDataUrl: z.string().min(1, "署名が必要です"),
});

// --- 請求書 ---
export const createInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

// 型エクスポート
export type CreateGuardInput = z.infer<typeof createGuardSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type SubmitShiftInput = z.infer<typeof submitShiftSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type ClockInInput = z.infer<typeof clockInSchema>;
export type ClockOutInput = z.infer<typeof clockOutSchema>;
export type WakeUpCheckInput = z.infer<typeof wakeUpCheckSchema>;
export type DepartureCheckInput = z.infer<typeof departureCheckSchema>;
export type SubmitReportInput = z.infer<typeof submitReportSchema>;
export type ClientApprovalInput = z.infer<typeof clientApprovalSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
