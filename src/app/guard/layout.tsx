import GuardNav from "./guard-nav";
import { GUARD_ME } from "./guard-demo-data";

export default function GuardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto">
      {/* ヘッダー */}
      <header className="bg-brand-500 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-bold">{GUARD_ME.orgName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-brand-200">{GUARD_ME.name}</span>
          <div className="w-8 h-8 rounded-full bg-brand-400 flex items-center justify-center text-xs font-bold">
            {GUARD_ME.name[0]}
          </div>
        </div>
      </header>

      {/* コンテンツ */}
      <main className="flex-1 overflow-y-auto">{children}</main>

      {/* ボトムナビ（クライアントコンポーネント） */}
      <GuardNav />
    </div>
  );
}
