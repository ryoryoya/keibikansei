import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // ============================================================
  // 開発モード: Supabase未設定時は認証をスキップ
  // ============================================================
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("your-project")) {
    // Supabase未設定 → 全ページアクセス許可（開発用）
    return NextResponse.next();
  }

  // デモセッションCookieがあれば認証スキップ（NEXT_PUBLIC_ENABLE_DEMO=true の場合のみ）
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO === "true") {
    const demoSession = request.cookies.get("demo_session");
    if (demoSession) {
      return NextResponse.next();
    }
  }

  // ============================================================
  // 本番モード: Supabase Auth によるセッション管理
  // ============================================================
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未認証ユーザーをログインページにリダイレクト
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register");
  // 認証不要パス: トップページ + 明示的 public API + デモログイン
  // （/api/* 全体を public にすると、今後追加する API が認証バイパスされる）
  const isPublicPage =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/api/public/") ||
    request.nextUrl.pathname.startsWith("/api/demo-login");

  if (!user && !isAuthPage && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 認証済みユーザーがログインページにアクセスした場合
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|api/public).*)",
  ],
};
