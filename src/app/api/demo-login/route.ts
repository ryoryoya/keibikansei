import { NextRequest, NextResponse } from "next/server";

// デモログイン用APIルート
// Supabase接続時でもデモセッションCookieを発行してアクセス可能にする
export async function GET(request: NextRequest) {
  // ===== 本番誤設定対策 =====
  // NEXT_PUBLIC_ENABLE_DEMO が "true" でなければエンドポイント自体を 404。
  // middleware / auth.ts の判定とは独立に Cookie 発行自体を禁じることで、
  // フラグの付け外し漏れによる権限昇格を二重防止する。
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO !== "true") {
    return new NextResponse("Not Found", { status: 404 });
  }

  // role は "guard" または "manager" のみ許可（想定外文字列での Cookie 汚染防止）
  const rawRole = request.nextUrl.searchParams.get("role") ?? "manager";
  const role = rawRole === "guard" ? "guard" : "manager";
  const redirectTo = role === "guard" ? "/guard" : "/dashboard";

  const response = NextResponse.redirect(new URL(redirectTo, request.url));
  response.cookies.set("demo_session", role, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 24時間
  });
  return response;
}
