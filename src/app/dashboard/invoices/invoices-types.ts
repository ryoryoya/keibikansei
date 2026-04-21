// 請求書管理の型定義とデモデータ

export type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";

export type InvoiceLineItem = {
  description: string;   // "A現場 警備業務（2月分）" 等
  quantity: number;      // 日数・時間数
  unit: string;          // "日" | "時間"
  unitPrice: number;
  amount: number;
};

// 日別配置実績（いつ・どの現場・何名）
export type InvoiceWorkRecord = {
  date: string;        // "2026-02-03"
  dateLabel: string;   // "2/3（月）"
  projectName: string; // "A現場（日勤）"
  guardCount: number;  // 配置人数
  unitPrice: number;   // 1名あたり単価
  amount: number;      // guardCount × unitPrice
};

export type Invoice = {
  id: string;
  invoiceNo: string;       // "INV-2026-001"
  clientId: string;
  clientName: string;
  issueDate: string;       // "YYYY-MM-DD"
  dueDate: string;
  year: number;
  month: number;
  status: InvoiceStatus;
  subtotal: number;        // 税抜合計
  taxAmount: number;
  totalAmount: number;     // 税込合計
  paidAt: string | null;
  notes: string;
  lineItems: InvoiceLineItem[];
  workRecords: InvoiceWorkRecord[];
};

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; bg: string }> = {
  DRAFT:   { label: "下書き",   bg: "bg-gray-100 text-gray-600" },
  ISSUED:  { label: "発行済み", bg: "bg-blue-100 text-blue-700" },
  PAID:    { label: "入金済み", bg: "bg-green-100 text-green-700" },
  OVERDUE: { label: "期限超過", bg: "bg-red-100 text-red-700" },
};

const DOW = ["日", "月", "火", "水", "木", "金", "土"];

function addDays(base: string, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// 勤務実績レコードの生成ヘルパー
function wr(dateStr: string, projectName: string, guardCount: number, unitPrice: number): InvoiceWorkRecord {
  const d = new Date(dateStr);
  const dateLabel = `${d.getMonth() + 1}/${d.getDate()}（${DOW[d.getDay()]}）`;
  return { date: dateStr, dateLabel, projectName, guardCount, unitPrice, amount: guardCount * unitPrice };
}

function makeInvoice(
  id: string,
  invoiceNo: string,
  clientId: string,
  clientName: string,
  year: number,
  month: number,
  status: InvoiceStatus,
  lineItems: InvoiceLineItem[],
  workRecords: InvoiceWorkRecord[],
  notes: string = "",
  paidAt: string | null = null,
): Invoice {
  const subtotal   = lineItems.reduce((s, l) => s + l.amount, 0);
  const taxAmount  = Math.round(subtotal * 0.1);
  const totalAmount = subtotal + taxAmount;
  const issueDate  = `${year}-${String(month).padStart(2, "0")}-25`;
  const dueDate    = addDays(issueDate, 30);
  return { id, invoiceNo, clientId, clientName, issueDate, dueDate, year, month, status, subtotal, taxAmount, totalAmount, paidAt, notes, lineItems, workRecords };
}

export const DEMO_INVOICES: Invoice[] = [
  makeInvoice("inv1", "INV-2026-012", "c1", "株式会社サンプル商事", 2026, 2, "PAID",
    [
      { description: "A現場 日勤警備（2月分）", quantity: 22, unit: "日", unitPrice: 35000, amount: 770000 },
      { description: "A現場 深夜警備（2月分）", quantity: 8,  unit: "日", unitPrice: 45000, amount: 360000 },
    ],
    [
      wr("2026-02-02", "A現場（日勤）", 2, 35000),
      wr("2026-02-03", "A現場（日勤）", 2, 35000),
      wr("2026-02-04", "A現場（日勤）", 1, 35000),
      wr("2026-02-05", "A現場（日勤）", 2, 35000),
      wr("2026-02-06", "A現場（日勤）", 2, 35000),
      wr("2026-02-07", "A現場（深夜）", 1, 45000),
      wr("2026-02-08", "A現場（深夜）", 1, 45000),
      wr("2026-02-09", "A現場（日勤）", 2, 35000),
      wr("2026-02-10", "A現場（日勤）", 2, 35000),
      wr("2026-02-12", "A現場（日勤）", 2, 35000),
      wr("2026-02-13", "A現場（日勤）", 1, 35000),
      wr("2026-02-14", "A現場（深夜）", 1, 45000),
      wr("2026-02-15", "A現場（深夜）", 2, 45000),
      wr("2026-02-16", "A現場（日勤）", 2, 35000),
      wr("2026-02-17", "A現場（日勤）", 2, 35000),
      wr("2026-02-19", "A現場（日勤）", 1, 35000),
      wr("2026-02-20", "A現場（日勤）", 2, 35000),
      wr("2026-02-21", "A現場（深夜）", 1, 45000),
      wr("2026-02-22", "A現場（深夜）", 1, 45000),
      wr("2026-02-23", "A現場（日勤）", 2, 35000),
      wr("2026-02-24", "A現場（日勤）", 2, 35000),
      wr("2026-02-26", "A現場（日勤）", 2, 35000),
      wr("2026-02-27", "A現場（日勤）", 1, 35000),
      wr("2026-02-28", "A現場（深夜）", 1, 45000),
    ],
    "2月分請求",
    "2026-03-18",
  ),
  makeInvoice("inv2", "INV-2026-013", "c2", "都立第三病院", 2026, 2, "ISSUED",
    [
      { description: "B現場 病院警備（2月分）", quantity: 20, unit: "日", unitPrice: 38000, amount: 760000 },
      { description: "夜間巡回警備（2月分）",   quantity: 8,  unit: "日", unitPrice: 42000, amount: 336000 },
    ],
    [
      wr("2026-02-02", "B現場（病院警備）", 2, 38000),
      wr("2026-02-03", "B現場（病院警備）", 2, 38000),
      wr("2026-02-04", "B現場（病院警備）", 2, 38000),
      wr("2026-02-05", "B現場（病院警備）", 1, 38000),
      wr("2026-02-06", "B現場（病院警備）", 2, 38000),
      wr("2026-02-07", "B現場（夜間巡回）", 1, 42000),
      wr("2026-02-08", "B現場（夜間巡回）", 1, 42000),
      wr("2026-02-09", "B現場（病院警備）", 2, 38000),
      wr("2026-02-10", "B現場（病院警備）", 2, 38000),
      wr("2026-02-12", "B現場（病院警備）", 2, 38000),
      wr("2026-02-13", "B現場（病院警備）", 1, 38000),
      wr("2026-02-14", "B現場（夜間巡回）", 1, 42000),
      wr("2026-02-15", "B現場（夜間巡回）", 1, 42000),
      wr("2026-02-16", "B現場（病院警備）", 2, 38000),
      wr("2026-02-17", "B現場（病院警備）", 2, 38000),
      wr("2026-02-19", "B現場（病院警備）", 2, 38000),
      wr("2026-02-20", "B現場（病院警備）", 1, 38000),
      wr("2026-02-21", "B現場（夜間巡回）", 1, 42000),
      wr("2026-02-22", "B現場（夜間巡回）", 1, 42000),
      wr("2026-02-23", "B現場（病院警備）", 2, 38000),
      wr("2026-02-24", "B現場（病院警備）", 2, 38000),
      wr("2026-02-26", "B現場（病院警備）", 2, 38000),
      wr("2026-02-28", "B現場（夜間巡回）", 1, 42000),
    ],
    "2月分請求",
  ),
  makeInvoice("inv3", "INV-2026-014", "c3", "渋谷商業ビル管理", 2026, 2, "OVERDUE",
    [
      { description: "C現場 施設警備（2月分）",   quantity: 22, unit: "日", unitPrice: 32000, amount: 704000 },
      { description: "駐車場管理業務（2月分）",   quantity: 22, unit: "日", unitPrice: 18000, amount: 396000 },
    ],
    [
      wr("2026-02-02", "C現場（施設警備）", 2, 32000),
      wr("2026-02-02", "C現場（駐車場）",   1, 18000),
      wr("2026-02-03", "C現場（施設警備）", 2, 32000),
      wr("2026-02-03", "C現場（駐車場）",   1, 18000),
      wr("2026-02-04", "C現場（施設警備）", 2, 32000),
      wr("2026-02-04", "C現場（駐車場）",   2, 18000),
      wr("2026-02-05", "C現場（施設警備）", 2, 32000),
      wr("2026-02-05", "C現場（駐車場）",   1, 18000),
      wr("2026-02-09", "C現場（施設警備）", 2, 32000),
      wr("2026-02-09", "C現場（駐車場）",   2, 18000),
      wr("2026-02-10", "C現場（施設警備）", 2, 32000),
      wr("2026-02-10", "C現場（駐車場）",   1, 18000),
      wr("2026-02-16", "C現場（施設警備）", 2, 32000),
      wr("2026-02-16", "C現場（駐車場）",   2, 18000),
      wr("2026-02-17", "C現場（施設警備）", 2, 32000),
      wr("2026-02-23", "C現場（施設警備）", 2, 32000),
      wr("2026-02-23", "C現場（駐車場）",   1, 18000),
      wr("2026-02-24", "C現場（施設警備）", 2, 32000),
      wr("2026-02-24", "C現場（駐車場）",   2, 18000),
    ],
    "お支払いが確認できておりません。ご確認ください。",
  ),
  makeInvoice("inv4", "INV-2026-015", "c4", "東京国際展示場", 2026, 2, "DRAFT",
    [
      { description: "イベント警備（2/15〜2/20）", quantity: 6, unit: "日", unitPrice: 55000, amount: 330000 },
    ],
    [
      wr("2026-02-15", "東京国際展示場", 5, 55000),
      wr("2026-02-16", "東京国際展示場", 5, 55000),
      wr("2026-02-17", "東京国際展示場", 4, 55000),
      wr("2026-02-18", "東京国際展示場", 4, 55000),
      wr("2026-02-19", "東京国際展示場", 3, 55000),
      wr("2026-02-20", "東京国際展示場", 3, 55000),
    ],
    "",
  ),
  makeInvoice("inv5", "INV-2026-016", "c1", "株式会社サンプル商事", 2026, 3, "DRAFT",
    [
      { description: "A現場 日勤警備（3月分）", quantity: 21, unit: "日", unitPrice: 35000, amount: 735000 },
      { description: "A現場 深夜警備（3月分）", quantity: 9,  unit: "日", unitPrice: 45000, amount: 405000 },
    ],
    [
      wr("2026-03-02", "A現場（日勤）", 2, 35000),
      wr("2026-03-03", "A現場（日勤）", 2, 35000),
      wr("2026-03-04", "A現場（日勤）", 2, 35000),
      wr("2026-03-05", "A現場（日勤）", 1, 35000),
      wr("2026-03-06", "A現場（日勤）", 2, 35000),
      wr("2026-03-07", "A現場（深夜）", 1, 45000),
      wr("2026-03-08", "A現場（深夜）", 1, 45000),
      wr("2026-03-09", "A現場（日勤）", 2, 35000),
      wr("2026-03-10", "A現場（日勤）", 2, 35000),
      wr("2026-03-12", "A現場（日勤）", 2, 35000),
      wr("2026-03-13", "A現場（日勤）", 1, 35000),
      wr("2026-03-14", "A現場（深夜）", 1, 45000),
      wr("2026-03-15", "A現場（深夜）", 2, 45000),
      wr("2026-03-16", "A現場（日勤）", 2, 35000),
      wr("2026-03-17", "A現場（日勤）", 2, 35000),
      wr("2026-03-19", "A現場（日勤）", 1, 35000),
      wr("2026-03-20", "A現場（日勤）", 2, 35000),
      wr("2026-03-21", "A現場（深夜）", 1, 45000),
      wr("2026-03-22", "A現場（深夜）", 1, 45000),
      wr("2026-03-23", "A現場（日勤）", 2, 35000),
      wr("2026-03-24", "A現場（日勤）", 2, 35000),
      wr("2026-03-26", "A現場（日勤）", 2, 35000),
      wr("2026-03-27", "A現場（日勤）", 1, 35000),
      wr("2026-03-28", "A現場（深夜）", 1, 45000),
      wr("2026-03-29", "A現場（深夜）", 1, 45000),
    ],
    "3月分請求",
  ),
  makeInvoice("inv6", "INV-2026-017", "c2", "都立第三病院", 2026, 3, "ISSUED",
    [
      { description: "B現場 病院警備（3月分）", quantity: 21, unit: "日", unitPrice: 38000, amount: 798000 },
    ],
    [
      wr("2026-03-02", "B現場（病院警備）", 2, 38000),
      wr("2026-03-03", "B現場（病院警備）", 2, 38000),
      wr("2026-03-04", "B現場（病院警備）", 2, 38000),
      wr("2026-03-05", "B現場（病院警備）", 1, 38000),
      wr("2026-03-06", "B現場（病院警備）", 2, 38000),
      wr("2026-03-09", "B現場（病院警備）", 2, 38000),
      wr("2026-03-10", "B現場（病院警備）", 2, 38000),
      wr("2026-03-12", "B現場（病院警備）", 2, 38000),
      wr("2026-03-13", "B現場（病院警備）", 1, 38000),
      wr("2026-03-16", "B現場（病院警備）", 2, 38000),
      wr("2026-03-17", "B現場（病院警備）", 2, 38000),
      wr("2026-03-19", "B現場（病院警備）", 2, 38000),
      wr("2026-03-20", "B現場（病院警備）", 1, 38000),
      wr("2026-03-23", "B現場（病院警備）", 2, 38000),
      wr("2026-03-24", "B現場（病院警備）", 2, 38000),
      wr("2026-03-26", "B現場（病院警備）", 2, 38000),
      wr("2026-03-27", "B現場（病院警備）", 1, 38000),
    ],
    "3月分請求",
  ),
];
