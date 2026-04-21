# 警備管制システム - CLAUDE.md

## プロジェクト概要
警備会社向けのクラウド型管制システム。管制業務（案件配置・上下番管理・シフト）から給与計算・請求書発行・法定帳票作成までオールインワンで管理する。

## 技術スタック
- **フレームワーク**: Next.js 15 (App Router) + TypeScript
- **スタイリング**: Tailwind CSS 3 + shadcn/ui
- **ORM**: Prisma (PostgreSQL)
- **認証**: Supabase Auth
- **ストレージ**: Supabase Storage (報告書写真・署名画像・PDF)
- **状態管理**: Zustand + TanStack Query
- **バリデーション**: Zod
- **デプロイ**: Vercel + Supabase

## ディレクトリ構造
```
src/app/dashboard/    → 管制PC画面（サイドバーレイアウト）
src/app/guard/        → 隊員アプリ（モバイルPWA、ボトムナビ）
src/app/actions/      → Server Actions（DB操作）
src/app/(auth)/       → ログイン・登録画面（未作成）
src/lib/              → prisma, supabase, calculations, validations, utils
src/types/            → 共有型定義
src/components/       → 共通UIコンポーネント
prisma/schema.prisma  → DBスキーマ（18テーブル）
prisma/seed.ts        → 開発用シードデータ
```

## 重要なファイル
- `prisma/schema.prisma` — 全テーブル定義。変更時は `npm run db:push` で反映
- `src/lib/calculations.ts` — 給与計算・深夜時間・残業・有給付与のビジネスロジック
- `src/lib/validations.ts` — Zodバリデーション（全APIの入力スキーマ）
- `src/app/actions/projects.ts` — 案件・配置のServer Actions

## 開発ルール
- Server Componentsをデフォルトにし、インタラクティブな部分のみ "use client"
- Server Actionsで DB操作。API Routesは外部連携のみ
- 日本語でコメントを書く
- コンポーネントは150行以内に抑え、超えたら分割
- Prismaスキーマ変更後は必ず `npm run db:push` と `npm run db:generate`

## 開発フェーズ（現在: Phase 0完了 → Phase 1実装中）
- Phase 0: 基盤（認証・マスタ・DB設計）✅
- Phase 1: MVPコア（案件配置・上下番・シフト・地図・通知）← 今ここ
- Phase 2: 給与・請求（給与計算・請求書PDF・有給管理）
- Phase 3: コミュニケーション（チャット・報告書電子サイン・年末調整）
- Phase 4: 法定帳票（立入検査対応帳票）

## DB設計のポイント
- マルチテナント: 全テーブルに org_id
- 段階打刻: Attendance に wakeUpAt → departureAt → clockIn → clockOut
- 電子サイン: GuardReport に signatureUrl（隊員側）+ clientSignUrl（現場担当者側）
- 勤務形態: Project に workStyle（DAY_SHIFT / NIGHT_SHIFT / RESIDENT 等）
- 隊員顔写真: GuardProfile に photoUrl

## ローカル開発
```bash
npm install
npm run dev          # → http://localhost:3000
```
Supabase未接続でもmiddlewareが認証をスキップするので全画面アクセス可能。
デモデータはコンポーネント内に埋め込み済み。

## ブランドカラー
- メイン（紺）: #1E5CB3 → Tailwind: `brand-500`
- アクセント（オレンジ）: #F97316 → Tailwind: `accent-orange-500`
