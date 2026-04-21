// サーバーサイドのセッション取得ヘルパー
import { cookies } from "next/headers";
import { createServerSupabase } from "./supabase/server";
import prisma from "./prisma";
export type UserRole = "ADMIN" | "MANAGER" | "ACCOUNTANT" | "GUARD";

export type ServerSession = {
  userId: string;
  orgId: string;
  name: string;
  email: string;
  role: UserRole;
  isDemo: boolean;
};

// デモセッション（Cookie で bypass している場合）
// seed.ts の固定IDと同期 → 実際のDBに読み書きする
const DEMO_SESSION: ServerSession = {
  userId: "00000000-0000-0000-0000-000000000002",
  orgId:  "00000000-0000-0000-0000-000000000001",
  name:   "鈴木 花子",
  email:  "kansei@sample-keibi.co.jp",
  role:   "MANAGER",
  isDemo: false,
};

export async function getServerSession(): Promise<ServerSession | null> {
  // デモCookieチェック（開発用バイパス）
  const cookieStore = await cookies();
  const demoSession = cookieStore.get("demo_session");
  if (demoSession) {
    return { ...DEMO_SESSION, role: demoSession.value === "guard" ? "GUARD" : "MANAGER" };
  }

  // Supabase Auth からユーザー取得
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Prisma DB からユーザー情報取得
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, orgId: true, name: true, role: true },
    });
    if (!dbUser) return null;

    return {
      userId: dbUser.id,
      orgId:  dbUser.orgId,
      name:   dbUser.name,
      email:  user.email ?? "",
      role:   dbUser.role,
      isDemo: false,
    };
  } catch {
    return null;
  }
}

// 認証必須 — 未認証なら例外を投げる
export async function requireSession(): Promise<ServerSession> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}
