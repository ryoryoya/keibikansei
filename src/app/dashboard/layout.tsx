import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: "📊" },
  { href: "/dashboard/calendar", label: "カレンダー", icon: "📅" },
  { href: "/dashboard/daily", label: "当日管理", icon: "⏰" },
  { href: "/dashboard/assignments", label: "配置管理", icon: "🗓️" },
  { href: "/dashboard/shifts", label: "シフト管理", icon: "📋" },
  { href: "/dashboard/guards", label: "隊員管理", icon: "👤" },
  { href: "/dashboard/clients", label: "得意先管理", icon: "🏢" },
  { href: "/dashboard/sites", label: "現場管理", icon: "📍" },
  { href: "/dashboard/projects", label: "案件管理", icon: "📁" },
  { href: "/dashboard/payroll", label: "給与管理", icon: "💰" },
  { href: "/dashboard/nencho", label: "年末調整", icon: "📝" },
  { href: "/dashboard/invoices", label: "請求書", icon: "📄" },
  { href: "/dashboard/daily-report", label: "日報", icon: "🗒️" },
  { href: "/dashboard/reports", label: "法定帳票", icon: "📑" },
  { href: "/dashboard/chat", label: "チャット", icon: "💬" },
  { href: "/dashboard/settings", label: "設定", icon: "⚙️" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* サイドバー */}
      <aside className="w-60 bg-brand-900 text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-brand-700">
          <h1 className="text-lg font-bold">警備管制システム</h1>
          <p className="text-xs text-brand-300 mt-1">サンプル警備株式会社</p>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-200 hover:bg-brand-800 hover:text-white transition-colors"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-brand-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-medium">
              鈴木
            </div>
            <div>
              <p className="text-sm font-medium">鈴木 花子</p>
              <p className="text-xs text-brand-400">管制担当</p>
            </div>
          </div>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
