"use server";

import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
type PayType = "DAILY" | "MONTHLY" | "HOURLY";
type Gender  = "MALE" | "FEMALE" | "OTHER";

const isUUID = (id?: string) =>
  !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// 日報・フォーム用：アクティブ隊員の id + name のみ取得
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

  await prisma.user.update({
    where: { id, orgId: session.orgId },
    data:  { isActive: false },
  });
  revalidatePath("/dashboard/guards");
}
