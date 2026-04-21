"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/guard",          label: "ホーム",  icon: "🏠" },
  { href: "/guard/schedule", label: "シフト",  icon: "📅" },
  { href: "/guard/clock",    label: "打刻",    icon: "⏱️", isMain: true },
  { href: "/guard/report",   label: "報告",    icon: "📸" },
  { href: "/guard/chat",     label: "連絡",    icon: "💬" },
  { href: "/guard/payslip",  label: "給与",    icon: "💴" },
];

export default function GuardNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-t flex shrink-0 safe-area-pb">
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/guard"
          ? pathname === "/guard"
          : pathname.startsWith(item.href);

        if (item.isMain) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center py-1 -mt-5"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl shadow-lg transition-colors ${active ? "bg-orange-600" : "bg-accent-orange-500"}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-medium mt-1 ${active ? "text-orange-600" : "text-accent-orange-600"}`}>
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center py-2 transition-colors ${active ? "text-brand-500" : "text-gray-400 hover:text-gray-600"}`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className={`text-[10px] mt-0.5 font-medium ${active ? "text-brand-500" : ""}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
