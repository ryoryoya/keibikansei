"use server";

import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
type PayType = "DAILY" | "MONTHLY" | "HOURLY";
type Gender  = "MALE" | "FEMALE" | "OTHER";

const isUUID = (id?: string) =>
  !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// 日報・フォーム用：アクティブ隊員の id + name のみ取得
// （GUARD も日報の立会人選択で使うため、role 制限はかけない。返却値は id + name のみで機密情報を含まない）
export async function getActiveGuards(): Promise<{ id: string; name: string }[]> {
  const session = await requireSession();
  if (session.isDemo) return [];

  const users = await prisma.user.findMany({
    where: { orgId: session.orgId, role: { in: ["GUARD", "MANAGER"] }, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return users;
}

// 隊員一覧取得（User + GuardProfile）
export async function getGuards() {
  const session = await requireSession();
  if (session.isDemo) return [];
  // 個人情報（口座・基本給含む）は ADMIN/MANAGER のみ閲覧可能
  if (session.role !== "ADMIN" && session.role !== "MANAGER") {
    throw new Error("Forbidden");
  }

  return prisma.user.findMany({
    where: { orgId: session.orgId, role: { in: ["GUARD", "MANAGER"] } },
    include: { guardProfile: true },
    orderBy: { name: "asc" },
  });
}

export type GuardInput = {
  id?: string;
  name: string;
  nameKana?: string;
  phone?: string;
  email?: string;
  role?: "GUARD" | "MANAGER";
  // GuardProfile
  birthDate?: string;
  gender?: Gender;
  hireDate?: string;
  address?: string;
  emergencyContact?: string;
  qualifications?: string[];
  skills?: string[];
  payType?: PayType;
  basePay?: number;
  hasSmartphone?: boolean;
  bankName?: string;
  bankBranch?: string;
  bankAccountType?: string;
  bankAccountNum?: string;
  bankAccountName?: string;
};

// 隊員作成・更新（upsert）
export async function upsertGuard(input: GuardInput) {
  const session = await requireSession();
  if (session.isDemo) return { id: "demo" };
  // ADMIN/MANAGER のみ隊員情報を作成・編集可能
  if (session.role !== "ADMIN" && session.role !== "MANAGER") {
    throw new Error("Forbidden");
  }
  // MANAGER は他ユーザーを MANAGER にできない（ADMIN 昇格と同等のため）
  // ロール昇格は ADMIN のみ許可
  const requestedRole = input.role ?? "GUARD";
  if (requestedRole !== "GUARD" && session.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  const profileData = {
    birthDate:       input.birthDate ? new Date(input.birthDate) : undefined,
    gender:          input.gender,
    hireDate:        input.hireDate  ? new Date(input.hireDate)  : undefined,
    address:         input.address,
    emergencyContact: input.emergencyContact,
    qualifications:  input.qualifications ?? [],
    skills:          input.skills ?? [],
    payType:         input.payType ?? "DAILY",
    basePay:         input.basePay ?? 0,
    hasSmartphone:   input.hasSmartphone ?? true,
    bankName:        input.bankName,
    bankBranch:      input.bankBranch,
    bankAccountType: input.bankAccountType,
    bankAccountNum:  input.bankAccountNum,
    bankAccountName: input.bankAccountName,
  };

  if (isUUID(input.id)) {
    // 更新
    const user = await prisma.user.update({
      where: { id: input.id!, orgId: session.orgId },
      data: {
        name:     input.name,
        nameKana: input.nameKana,
        phone:    input.phone,
        role:     input.role ?? "GUARD",
        guardProfile: {
          upsert: {
            create: profileData,
            update: profileData,
          },
        },
      },
    });
    revalidatePath("/dashboard/guards");
    return user;
  } else {
    // 新規作成（仮メールで登録し、後でパスワード設定）
    const email = input.email ?? `guard-${Date.now()}@${session.orgId}.internal`;
    const user = await prisma.user.create({
      data: {
        orgId:    session.orgId,
        email,
        name:     input.name,
        nameKana: input.nameKana,
        phone:    input.phone,
        role:     input.role ?? "GUARD",
        guardProfile: { create: profileData },
      },
    });
    revalidatePath("/dashboard/guards");
    return user;
  }
}

// 隊員削除（論理削除: isActive = false）
export async function deactivateGuard(id: string) {
  const session = await requireSession();
  if (session.isDemo) return;
  // ADMIN/MANAGER のみ隊員を無効化可能
  if (session.role !== "ADMIN" && session.role !== "MANAGER") {
    throw new Error("Forbidden");
  }
  // 自分自身を無効化できないようにする（ロックアウト防止）
  if (id === session.userId) throw new Error("Forbidden");

  // 対象ユーザーのロールを確認し、MANAGER は ADMIN のみ無効化可能
  const target = await prisma.user.findFirst({
    where: { id, orgId: session.orgId },
    select: { role: true },
  });
  if (!target) throw new Error("Not Found");
  if (target.role === "ADMIN" || target.role === "MANAGER") {
    if (session.role !== "ADMIN") throw new Error("Forbidden");
  }

  await prisma.user.update({
    where: { id, orgId: session.orgId },
    data:  { isActive: false },
  });
  revalidatePath("/dashboard/guards");
}
