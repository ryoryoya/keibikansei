import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 flex flex-col">
      {/* ヒーローセクション */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        {/* ロゴ */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl backdrop-blur-sm shadow-lg">
            🛡️
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold text-white tracking-tight">警備管制システム</h1>
            <p className="text-brand-200 text-sm">Security Control Platform</p>
          </div>
        </div>

        {/* キャッチコピー */}
        <p className="text-xl text-white/90 font-medium max-w-md leading-relaxed mb-2">
          管制・配置・給与をオールインワンで
        </p>
        <p className="text-brand-200 text-sm max-w-sm mb-10">
          警備会社向けクラウド型管制システム。案件配置から給与計算・法定帳票まで一括管理。
        </p>

        {/* CTAボタン */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Link
            href="/login"
            className="flex-1 py-4 bg-white text-brand-700 font-bold rounded-2xl hover:bg-brand-50 transition-all text-center shadow-lg active:scale-[0.98]"
          >
            ログイン
          </Link>
          <Link
            href="/register"
            className="flex-1 py-4 bg-white/20 text-white font-bold rounded-2xl hover:bg-white/30 transition-all text-center backdrop-blur-sm border border-white/30 active:scale-[0.98]"
          >
            無料で始める
          </Link>
        </div>

        {/* デモ直通リンク（開発用） */}
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link href="/dashboard" className="text-brand-200 text-xs hover:text-white underline underline-offset-2 transition-colors">
            管制画面デモ →
          </Link>
          <Link href="/guard" className="text-brand-200 text-xs hover:text-white underline underline-offset-2 transition-colors">
            隊員アプリデモ →
          </Link>
        </div>
      </div>

      {/* 機能紹介 */}
      <div className="bg-white/10 backdrop-blur-sm border-t border-white/20 px-6 py-8">
        <div className="max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: "📅", title: "配置管理",   desc: "ドラッグ&ドロップで直感的に" },
            { icon: "⏱️", title: "上下番管理", desc: "4段階打刻・リアルタイム監視" },
            { icon: "💰", title: "給与計算",   desc: "深夜・残業を自動計算" },
            { icon: "📑", title: "法定帳票",   desc: "立入検査に対応した帳票出力" },
          ].map((f) => (
            <div key={f.title} className="text-center">
              <div className="text-2xl mb-1">{f.icon}</div>
              <p className="text-white font-semibold text-sm">{f.title}</p>
              <p className="text-brand-200 text-[11px] mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
