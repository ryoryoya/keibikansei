export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 flex flex-col items-center justify-center p-4">
      {/* ロゴ */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-sm">
            🛡️
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-white tracking-tight">警備管制システム</h1>
            <p className="text-brand-200 text-xs">Security Control Platform</p>
          </div>
        </div>
      </div>

      {/* カード */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {children}
      </div>

      {/* フッター */}
      <p className="mt-6 text-brand-300 text-xs">
        © 2026 警備管制システム. All rights reserved.
      </p>
    </div>
  );
}
