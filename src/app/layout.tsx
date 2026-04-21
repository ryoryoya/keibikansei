import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "警備管制システム",
  description: "警備業務の管制・配置・給与をオールインワンで管理",
  manifest: "/manifest.json",
  themeColor: "#1E5CB3",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
