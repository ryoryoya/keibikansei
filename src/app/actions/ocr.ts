"use server";

// ============================================================
// 日報OCR（Claude Vision API）
// 画像から日報フィールドを抽出し、マスタ（得意先・隊員）に正規化して返す
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { ocrDailyReportSchema, type OcrDailyReportResult } from "@/lib/validations";

// 画像サイズ上限（Anthropic APIは5MB、base64は約33%増）
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// 対応画像MIMEタイプ
const SUPPORTED_MIMES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type SupportedMime = (typeof SUPPORTED_MIMES)[number];

export type OcrInput = {
  // base64エンコード済み画像データ（data URLのプレフィックスなし）
  imageBase64: string;
  mediaType: SupportedMime;
};

export type OcrResponse = {
  ok: true;
  data: OcrDailyReportResult;
  // マスタ照合結果（UI側で ID 解決に使う）
  matchedClientId: string | null;
  matchedGuardIds: string[];
  // 使用量（コスト把握）
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
  };
} | {
  ok: false;
  error: string;
};

/**
 * 日報画像をOCRで読み取ってフィールド抽出
 * - マスタ（Client / User）を取得してプロンプトに渡す
 * - Claude Vision で構造化JSON を取得
 * - 返却された clientName / guardNames をマスタIDに解決
 */
export async function ocrDailyReport(input: OcrInput): Promise<OcrResponse> {
  const session = await requireSession();
  if (session.isDemo) {
    return { ok: false, error: "デモモードではOCRを実行できません" };
  }
  // ADMIN/MANAGER のみOCR可能（日報編集権限と同等）
  if (session.role !== "ADMIN" && session.role !== "MANAGER") {
    return { ok: false, error: "権限がありません" };
  }

  // 入力検証
  if (!SUPPORTED_MIMES.includes(input.mediaType)) {
    return { ok: false, error: `非対応の画像形式です: ${input.mediaType}` };
  }
  const approxBytes = Math.floor((input.imageBase64.length * 3) / 4);
  if (approxBytes > MAX_IMAGE_BYTES) {
    return { ok: false, error: "画像サイズが大きすぎます（5MB以下にしてください）" };
  }

  // APIキー確認
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "ANTHROPIC_API_KEY が設定されていません" };
  }

  // --- マスタ取得（同組織のアクティブなデータのみ） ---
  const [clients, guards] = await Promise.all([
    prisma.client.findMany({
      where: { orgId: session.orgId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { orgId: session.orgId, role: { in: ["GUARD", "MANAGER"] }, isActive: true },
      select: { id: true, name: true, nameKana: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // マスタ一覧を決定論的な文字列にシリアライズ（プロンプトキャッシュのため）
  // 並びが変わるとキャッシュが無効化されるので注意（取得時に name ASC でソート済み）
  const clientListText = clients.map((c) => `- ${c.name}`).join("\n") || "（登録なし）";
  const guardListText = guards
    .map((g) => (g.nameKana ? `- ${g.name}（${g.nameKana}）` : `- ${g.name}`))
    .join("\n") || "（登録なし）";

  // --- Claude Vision 呼び出し ---
  const anthropic = new Anthropic();

  // システムプロンプト（静的 + マスタ一覧 = キャッシュ対象）
  // 得意先・隊員マスタは組織単位で安定しており、日報画像だけが毎回変わるので
  // ここまでをキャッシュすることで2回目以降のコストを大幅削減できる
  const systemText = `あなたは警備会社の日報画像を読み取るOCRアシスタントです。
画像から以下のフィールドを抽出し、JSONで返してください。

【得意先マスタ】（clientName は必ず以下のいずれかに正規化してください。該当なしは null）
${clientListText}

【隊員マスタ】（guardNames は以下の氏名表記のいずれかに正規化してください。該当なしは除外）
${guardListText}

【抽出ルール】
- 時刻は "HH:MM" 形式（例: "08:30"）
- 日付は "YYYY-MM-DD" 形式
- 数値フィールドは半角数字のみ（単位は含めない）
- 読み取り不明な項目は null（文字列フィールド）または空配列（配列フィールド）
- 施工場所は上から順に最大4箇所（locations配列）
- confidence は全体の読み取り信頼度（high/medium/low）
- unreadableFields に読み取れなかった項目の日本語ラベルを列挙
- マスタにない得意先名/隊員名は推測で埋めず、unreadableFields に追加

返却は output_config で指定されたJSONスキーマに厳密に従ってください。`;

  try {
    const response = await anthropic.messages.parse({
      model: "claude-opus-4-7",
      max_tokens: 16000,
      // システムプロンプトにキャッシュを設定（マスタまで含めてキャッシュ）
      system: [
        {
          type: "text",
          text: systemText,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: input.mediaType,
                data: input.imageBase64,
              },
            },
            {
              type: "text",
              text: "この日報画像からフィールドを抽出してください。",
            },
          ],
        },
      ],
      output_config: {
        format: zodOutputFormat(ocrDailyReportSchema),
      },
    });

    const parsed = response.parsed_output;
    if (!parsed) {
      return { ok: false, error: "OCR結果のパースに失敗しました" };
    }

    // --- マスタ照合（ID解決） ---
    const matchedClientId = parsed.clientName
      ? clients.find((c) => c.name === parsed.clientName)?.id ?? null
      : null;

    const matchedGuardIds: string[] = [];
    for (const name of parsed.guardNames) {
      const found = guards.find((g) => g.name === name);
      if (found) matchedGuardIds.push(found.id);
    }

    return {
      ok: true,
      data: parsed,
      matchedClientId,
      matchedGuardIds,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
        cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
      },
    };
  } catch (err) {
    // 典型的なエラーをハンドリング
    if (err instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "API レート制限に達しました。しばらく待ってから再試行してください" };
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: "ANTHROPIC_API_KEY が無効です" };
    }
    if (err instanceof Anthropic.BadRequestError) {
      return { ok: false, error: `リクエストエラー: ${err.message}` };
    }
    if (err instanceof Anthropic.APIError) {
      return { ok: false, error: `API エラー（${err.status}）: ${err.message}` };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `OCR処理に失敗しました: ${msg}` };
  }
}
