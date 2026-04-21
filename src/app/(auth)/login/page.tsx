"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

type Role = "manager" | "guard";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("manager");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(
        authError.message.includes("Invalid login")
          ? "メールアドレスまたはパスワードが正しくありません"
          : "ログインに失敗しました。しばらく後に再度お試しください"
      );
      setLoading(false);
      return;
    }

    router.push(role === "guard" ? "/guard" : "/dashboard");
  };

  const handleDemoLogin = (demoRole: Role) => {
    // Supabase接続中でもデモCookieを発行してバイパス
    window.location.href = `/api/demo-login?role=${demoRole}`;
  };

  return (
    <>
      {/* カードヘッダー */}
      <div className="bg-brand-500 px-8 py-6 text-white">
        <h2 className="text-xl font-bold">ログイン</h2>
        <p className="text-brand-200 text-sm mt-1">アカウント情報を入力してください</p>
      </div>

      <div className="px-8 py-6 space-y-5">
        {/* ロール選択 */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">ログイン種別</label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { val: "manager" as Role, label: "管制・管理者", icon: "🖥️" },
              { val: "guard"   as Role, label: "警備員アプリ",  icon: "📱" },
            ] as const).map(({ val, label, icon }) => (
              <button
                key={val}
                type="button"
                onClick={() => setRole(val)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  role === val
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {isSupabaseConfigured ? (
          /* Supabase 接続時: 本番フォーム */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                メールアドレス
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@company.co.jp"
                className="input"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                パスワード
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="rounded border-gray-300" />
                ログイン状態を保持する
              </label>
              <Link href="/forgot-password" className="text-xs text-brand-500 hover:underline">
                パスワードを忘れた方
              </Link>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
                loading
                  ? "bg-brand-300 cursor-not-allowed"
                  : "bg-brand-500 hover:bg-brand-600 active:scale-[0.98]"
              }`}
            >
              {loading ? "認証中..." : "ログイン"}
            </button>
          </form>
        ) : (
          /* Supabase 未設定時: デモモード */
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              <p className="font-semibold">🔧 開発モード</p>
              <p className="text-xs mt-1">Supabase未接続のため、デモアカウントで続行できます</p>
            </div>

            <button
              onClick={() => handleDemoLogin("manager")}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-brand-500 hover:bg-brand-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>🖥️</span>
              管制画面デモとして続ける
            </button>

            <button
              onClick={() => handleDemoLogin("guard")}
              className="w-full py-3.5 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>📱</span>
              隊員アプリデモとして続ける
            </button>
          </div>
        )}

        {/* デモアクセス */}
        <div className="pt-2 border-t space-y-2">
          <p className="text-center text-xs text-gray-400">— または —</p>
          <div className="flex gap-2">
            <a href="/api/demo-login?role=manager"
              className="flex-1 py-2 text-xs font-medium text-center text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
              🖥️ 管制デモ
            </a>
            <a href="/api/demo-login?role=guard"
              className="flex-1 py-2 text-xs font-medium text-center text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
              📱 隊員デモ
            </a>
          </div>
        </div>

        {/* 登録リンク */}
        <p className="text-center text-sm text-gray-500 pt-2 border-t">
          アカウントをお持ちでない方は{" "}
          <Link href="/register" className="text-brand-500 font-semibold hover:underline">
            新規登録
          </Link>
        </p>
      </div>
    </>
  );
}
