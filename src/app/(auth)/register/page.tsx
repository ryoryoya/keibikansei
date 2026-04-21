"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

type Step = 1 | 2;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // Step 1: 会社情報
  const [orgName, setOrgName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [orgTel, setOrgTel] = useState("");

  // Step 2: 担当者情報
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleStep1 = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setStep(2);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }
    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }
    if (!agreed) {
      setError("利用規約への同意が必要です");
      return;
    }

    if (!isSupabaseConfigured) {
      setDone(true);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, orgName, licenseNumber, orgTel },
      },
    });

    if (authError) {
      setError(
        authError.message.includes("already registered")
          ? "このメールアドレスはすでに登録されています"
          : "登録に失敗しました。しばらく後に再度お試しください"
      );
      setLoading(false);
      return;
    }

    // Prisma DB に組織＋ユーザーを作成
    if (data.user) {
      try {
        const { createOrgAndUser } = await import("@/app/actions/auth");
        await createOrgAndUser({
          authUserId:    data.user.id,
          email,
          name,
          orgName,
          licenseNumber: licenseNumber || undefined,
          orgTel:        orgTel || undefined,
        });
      } catch {
        // 失敗しても認証は完了しているので続行
      }
    }

    setDone(true);
    setLoading(false);
  };

  /* 完了画面 */
  if (done) {
    return (
      <div className="px-8 py-10 text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto">✅</div>
        <h2 className="text-xl font-bold text-gray-900">登録が完了しました</h2>
        {isSupabaseConfigured ? (
          <p className="text-sm text-gray-500">
            確認メールを送信しました。<br />メール内のリンクをクリックして登録を完了してください。
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            （デモモード）登録処理をシミュレートしました。
          </p>
        )}
        <button
          onClick={() => router.push("/login")}
          className="w-full py-3 rounded-xl font-bold text-white bg-brand-500 hover:bg-brand-600 transition-all"
        >
          ログイン画面へ
        </button>
      </div>
    );
  }

  return (
    <>
      {/* カードヘッダー */}
      <div className="bg-brand-500 px-8 py-6 text-white">
        <h2 className="text-xl font-bold">新規登録</h2>
        <p className="text-brand-200 text-sm mt-1">
          {step === 1 ? "ステップ 1/2 — 会社情報" : "ステップ 2/2 — 担当者情報"}
        </p>
        {/* ステップバー */}
        <div className="flex gap-2 mt-3">
          <div className="flex-1 h-1.5 rounded-full bg-white/60" />
          <div className={`flex-1 h-1.5 rounded-full transition-all ${step === 2 ? "bg-white/60" : "bg-white/20"}`} />
        </div>
      </div>

      <div className="px-8 py-6">
        {step === 1 ? (
          /* ── Step 1: 会社情報 ── */
          <form onSubmit={handleStep1} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">会社名 *</label>
              <input
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="例）サンプル警備株式会社"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">警備業認定番号</label>
              <input
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="例）東京公認 第12345号"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">会社電話番号</label>
              <input
                type="tel"
                value={orgTel}
                onChange={(e) => setOrgTel(e.target.value)}
                placeholder="03-0000-0000"
                className="input"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-white bg-brand-500 hover:bg-brand-600 active:scale-[0.98] transition-all"
            >
              次へ →
            </button>
          </form>
        ) : (
          /* ── Step 2: 担当者情報 ── */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">担当者名 *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例）鈴木 花子"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">メールアドレス *</label>
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
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">パスワード *（8文字以上）</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-10"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {/* パスワード強度 */}
              {password && (
                <div className="flex gap-1 mt-1.5">
                  {[4, 6, 8, 10].map((len) => (
                    <div key={len} className={`flex-1 h-1 rounded-full ${password.length >= len ? (password.length >= 10 ? "bg-green-400" : password.length >= 6 ? "bg-amber-400" : "bg-red-400") : "bg-gray-200"}`} />
                  ))}
                  <span className="text-[10px] text-gray-400 ml-1">
                    {password.length < 6 ? "弱" : password.length < 10 ? "普通" : "強"}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">パスワード確認 *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`input ${confirmPassword && password !== confirmPassword ? "border-red-400 focus:ring-red-300" : ""}`}
                autoComplete="new-password"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">パスワードが一致しません</p>
              )}
            </div>

            <label className="flex items-start gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="rounded mt-0.5 shrink-0" />
              <span>
                <span className="text-brand-500 hover:underline cursor-pointer">利用規約</span>および
                <span className="text-brand-500 hover:underline cursor-pointer">プライバシーポリシー</span>に同意します
              </span>
            </label>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                ⚠ {error}
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl font-medium border text-gray-600 hover:bg-gray-50 transition-all">
                ← 戻る
              </button>
              <button type="submit" disabled={loading || !agreed}
                className={`flex-1 py-3 rounded-xl font-bold text-white transition-all active:scale-[0.98] ${loading || !agreed ? "bg-brand-200 cursor-not-allowed" : "bg-brand-500 hover:bg-brand-600"}`}>
                {loading ? "登録中..." : "登録する"}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-5 pt-4 border-t">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-brand-500 font-semibold hover:underline">ログイン</Link>
        </p>
      </div>
    </>
  );
}
