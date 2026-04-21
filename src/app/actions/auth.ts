"use server";

import prisma from "@/lib/prisma";
import { createServerSupabase } from "@/lib/supabase/server";

// 新規登録時: Supabase Auth signup 後に Prisma で Organization + User を作成する
export async function createOrgAndUser(params: {
  authUserId: string;  // Supabase auth.users の UUID
  email: string;
  name: string;
  orgName: string;
  licenseNumber?: string;
  orgTel?: string;
}) {
  // ===== セッション検証（アカウント乗っ取り対策） =====
  // 呼び出し元の Supabase セッションと authUserId が一致することを強制。
  // 他人の UUID を供給して組織を作成・ADMIN 権限を奪うことを防ぐ。
  const supabase = await createServerSupabase();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error("Unauthorized");
  if (authUser.id !== params.authUserId) throw new Error("Forbidden");
  // Supabase 側の email と呼び出し元 email も照合
  if (authUser.email && params.email && authUser.email !== params.email) {
    throw new Error("Forbidden");
  }

  // Organization が既に存在しないか確認（重複防止）
  const existing = await prisma.user.findUnique({ where: { id: params.authUserId } });
  if (existing) return { success: true };

  // トランザクションで Organization + User を同時作成
  await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name:          params.orgName,
        tel:           params.orgTel,
        licenseNumber: params.licenseNumber,
      },
    });

    await tx.user.create({
      data: {
        id:    params.authUserId, // Supabase auth UUID を PK に使用
        orgId: org.id,
        email: params.email,
        name:  params.name,
        role:  "ADMIN", // 最初の登録者は管理者
      },
    });
  });

  return { success: true };
}
