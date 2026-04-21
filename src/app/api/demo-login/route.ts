import { NextRequest, NextResponse } from "next/server";

// デモログイン用APIルート
// Supabase接続時でもデモセッションCookieを発行してアクセス可能にする
export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get("role") ?? "manager";
  const redirectTo = role === "guard" ? "/guard" : "/dashboard";

  const response = NextResponse.redirect(new URL(redirectTo, request.url));
  response.cookies.set("demo_session", role, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24時間
  });
  return response;
}
