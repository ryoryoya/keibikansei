# 警備管制システム 開発ログ

## プロジェクト概要

警備会社向けクラウド型管制システム。  
Next.js 15 (App Router) + Prisma + Supabase Auth + PostgreSQL 構成。

---

## Supabase 接続設定

### プロジェクト情報
- **Project ID**: `wwujnjoyvpnakopfadcj`
- **URL**: `https://wwujnjoyvpnakopfadcj.supabase.co`
- **リージョン**: ap-northeast-1（東京）

### `.env` の接続文字列
```env
# Prisma（接続プール：Transaction mode, port 6543）
DATABASE_URL="postgresql://postgres.wwujnjoyvpnakopfadcj:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Prisma マイグレーション用（Session mode, port 5432）
DIRECT_URL="postgresql://postgres.wwujnjoyvpnakopfadcj:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://wwujnjoyvpnakopfadcj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
```

> ⚠️ `DATABASE_URL` は port **6543**（pgbouncer=true）、マイグレーション用 `DIRECT_URL` は port **5432**

### DBセットアップコマンド
```bash
npm run db:push      # スキーマをDBに反映
npm run db:generate  # Prismaクライアント再生成
npx prisma db seed   # シードデータ投入
```

---

## 認証フロー

### デモセッション（開発用）
- `/api/demo-login` にアクセスすると `demo_session` Cookieが設定される
- middleware がこのCookieを検出 → Supabase Auth をスキップ
- `src/lib/auth.ts` の `DEMO_SESSION` が使われる（`isDemo: false` なので実DBに読み書きする）

### 実ログイン（Supabase Auth）
1. `/login` でメール・パスワードを入力
2. `supabase.auth.signInWithPassword()` → Supabase がセッションCookieを設定
3. Server Actions では `supabase.auth.getUser()` でユーザーID取得
4. そのIDで `prisma.user.findUnique()` → orgId・role を取得
5. `requireSession()` が `ServerSession` を返す

### 新規登録フロー
1. `/register` でフォーム送信 → `supabase.auth.signUp()`
2. 成功後 `createOrgAndUser()` Server Action を呼び出し
3. `organizations` テーブルに新規組織作成
4. `users` テーブルに `id = auth.users.id` でユーザー作成（ADMIN）

> ⚠️ `createOrgAndUser` 失敗時はエラーをキャッチして続行するので、失敗しても認証は完了する。  
> この場合 `users` テーブルにレコードがなく、ログイン後に「Unauthorized」エラーになる。  
> **対処**: Supabase MCP か SQL で `users` テーブルに手動挿入する。

---

## 固定デモデータ（シードID）

| 種別 | ID |
|------|-----|
| 組織（サンプル警備株式会社） | `00000000-0000-0000-0000-000000000001` |
| マネージャー（鈴木 花子） | `00000000-0000-0000-0000-000000000002` |

`prisma/seed.ts` が `upsert` でこれらを冪等に作成する。

---

## データ永続化パターン

### Server Component → Client Component へのデータ受け渡し
```
page.tsx（Server）
  └── getXxx() → DB から取得
  └── XxxView({ dbXxx })（Client）
        └── useState(initial)  ← 初期値
        └── useEffect([dbXxx]) ← router.refresh() 後に同期
```

### 保存フロー
```
ユーザーが保存ボタン押下
  → setXxx() でUIを楽観的更新（即時反映）
  → upsertXxx() Server Action でDBに保存
  → router.refresh() でサーバーデータを再取得
  → useEffect が新しい props を受け取り state を更新
```

> ⚠️ `useState` の初期値はマウント時に1回だけ評価される。  
> `router.refresh()` 後に props が更新されても state は自動更新されないため、`useEffect` での同期が必要。

---

## DB テーブル構成（主要18テーブル）

| テーブル | 用途 |
|----------|------|
| organizations | 警備会社（マルチテナント） |
| users | 社員・隊員（Supabase auth IDと同一） |
| clients | 得意先 |
| sites | 現場 |
| projects | 案件 |
| assignments | 配置（案件×隊員×日付） |
| attendances | 打刻（上番・下番・段階打刻） |
| shifts | シフト |
| guard_reports | 業務日報 |
| payrolls | 給与計算結果 |
| invoices | 請求書 |

---

## 実装済み機能（Phase 0〜1）

### 管制PC画面 (`/dashboard`)
- [x] 得意先管理（CRUD + DB連携）
- [x] 現場管理（CRUD + DB連携）
- [x] 案件管理（CRUD + DB連携）
- [x] 隊員管理（CRUD + DB連携）
- [x] 業務日報（閲覧・入力）
- [ ] シフト管理（DB連携未）
- [ ] 配置管理（DB連携未）

### 隊員アプリ (`/guard`)
- [x] 業務日報入力（隊員名はDB連携済み）
- [ ] 打刻（上番・下番）

---

## よくあるエラーと対処法

| エラー | 原因 | 対処 |
|--------|------|------|
| `Unauthorized at requireSession` | `users` テーブルにレコードがない | SQL で手動挿入 or 再登録 |
| `Tenant or user not found` | DBパスワードが間違い | `.env` のパスワードを確認 |
| `P1001: Can't reach database server` | ネットワーク or Supabase停止 | Supabaseダッシュボードを確認 |
| ページリロードでデータ消える | `useEffect` での props→state 同期が抜けている | `useEffect([dbXxx])` を追加 |
| ハイドレーションエラー | `typeof window` チェックで SSR/CSR で異なる値 | `NEXT_PUBLIC_` 変数はSSRでも使えるので window チェック不要 |

---

## 開発サーバー起動
```bash
npm run dev   # → http://localhost:3000
```
Supabase未接続でも動作（デモデータ表示）。  
実DB連携する場合は `.env` に正しい接続情報が必要。

---

*最終更新: 2026-04-10*
