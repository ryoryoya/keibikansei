# 警備管制システム

警備業務の管制・配置・給与をオールインワンで管理するクラウドシステム。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| UI コンポーネント | shadcn/ui + Radix UI |
| バックエンド | Next.js API Routes (Route Handlers) |
| データベース | PostgreSQL (Supabase) |
| ORM | Prisma |
| 認証 | Supabase Auth |
| ストレージ | Supabase Storage (S3 互換) |
| リアルタイム | Supabase Realtime / Socket.io |
| 状態管理 | Zustand + TanStack Query |
| 地図 | Google Maps JavaScript API |
| 通知 | Firebase Cloud Messaging (FCM) |
| PDF 生成 | @react-pdf/renderer |
| デプロイ | Vercel |

## セットアップ手順

### 1. 前提条件

- Node.js 20 以上
- npm 10 以上
- VSCode（推奨拡張: Prisma, Tailwind CSS IntelliSense, ESLint）
- Supabase アカウント（無料プランで開始可能）

### 2. プロジェクト初期化

```bash
# リポジトリをクローン
git clone <your-repo-url>
cd keibi-kansei-system

# 依存関係インストール
npm install

# 環境変数の設定
cp .env.example .env.local
# → .env.local を編集して Supabase の接続情報を入力
```

### 3. Supabase プロジェクト作成

1. [supabase.com](https://supabase.com) でプロジェクト作成
2. Region: `Northeast Asia (Tokyo)` を選択
3. Database Password を控える
4. Settings → API から URL と anon key をコピー
5. Settings → Database から Connection string をコピー

### 4. データベースセットアップ

```bash
# Prisma Client 生成
npm run db:generate

# スキーマをDBに反映
npm run db:push

# シードデータ投入（開発用）
npm run db:seed

# DBの中身をブラウザで確認
npm run db:studio
```

### 5. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス可能。

## ディレクトリ構成

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # 認証関連ページ
│   ├── dashboard/          # 管制画面（PC）
│   │   ├── calendar/       # カレンダー・配置管理
│   │   ├── daily/          # 当日管理
│   │   ├── shifts/         # シフト一覧
│   │   ├── guards/         # 隊員管理
│   │   ├── clients/        # 得意先管理
│   │   ├── payroll/        # 給与管理
│   │   ├── invoices/       # 請求書管理
│   │   ├── reports/        # 帳票・レポート
│   │   └── chat/           # チャット
│   ├── guard/              # 隊員アプリ（PWA）
│   │   ├── home/           # トップ（当日の案件）
│   │   ├── schedule/       # シフト提出
│   │   ├── clock/          # 上番・下番打刻
│   │   ├── report/         # 報告書提出
│   │   └── payslip/        # 給与明細
│   ├── api/                # API Routes
│   └── layout.tsx
├── components/             # 共通コンポーネント
│   ├── ui/                 # shadcn/ui ベース
│   └── features/           # 機能別コンポーネント
├── lib/                    # ユーティリティ
│   ├── prisma.ts           # Prisma Client
│   ├── supabase/           # Supabase クライアント
│   └── calculations.ts     # 給与・勤怠計算ロジック
├── types/                  # 型定義
└── hooks/                  # カスタムフック
```

## 開発フェーズ

- **Phase 0**: 基盤構築（認証・マスタ管理・DB設計）← 現在ここ
- **Phase 1**: MVP コア（案件配置・上下番・シフト・地図・通知）
- **Phase 2**: 給与・請求（給与計算・請求書PDF・有給管理）
- **Phase 3**: コミュニケーション（チャット・報告書・年末調整）
- **Phase 4**: 法定帳票・コンプライアンス（立入検査対応帳票）
