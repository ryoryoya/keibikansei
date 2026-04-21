"use server";

import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type {
  Invoice,
  InvoiceLineItem,
  InvoiceWorkRecord,
} from "@/app/dashboard/invoices/invoices-types";

// OVERDUE はフロント表示用のみ。DB に書き込める値はこの3つ
type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID";

const DOW = ["日", "月", "火", "水", "木", "金", "土"];

function toDateLabel(d: Date): string {
  // JST に変換
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const m = jst.getUTCMonth() + 1;
  const day = jst.getUTCDate();
  const dow = jst.getUTCDay();
  return `${m}/${day}（${DOW[dow]}）`;
}

type DbInvoice = {
  id: string;
  year: number;
  month: number;
  status: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  dueDate: Date | null;
  issuedAt: Date | null;
  paidAt: Date | null;
  notes: string | null;
  client: { id: string; name: string };
};

type AttForInvoice = {
  assignment: {
    workDate: Date;
    project: { name: string; unitPrice: number };
  };
};

// 配置実績リストから Invoice ビュー型を構築するヘルパー
function buildInvoiceView(
  dbInvoice: DbInvoice,
  atts: AttForInvoice[],
  invoiceIndex: number,
): Invoice {
  // 日別 × 現場 で人数を集計
  const dayMap = new Map<
    string,
    {
      date: string;
      dateLabel: string;
      projectName: string;
      guardCount: number;
      unitPrice: number;
    }
  >();
  for (const att of atts) {
    const { workDate, project } = att.assignment;
    const dateStr = workDate.toISOString().slice(0, 10);
    const key = `${dateStr}__${project.name}`;
    const ex = dayMap.get(key);
    if (ex) {
      ex.guardCount++;
    } else {
      dayMap.set(key, {
        date: dateStr,
        dateLabel: toDateLabel(workDate),
        projectName: project.name,
        guardCount: 1,
        unitPrice: project.unitPrice,
      });
    }
  }

  const workRecords: InvoiceWorkRecord[] = [...dayMap.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((v) => ({
      date: v.date,
      dateLabel: v.dateLabel,
      projectName: v.projectName,
      guardCount: v.guardCount,
      unitPrice: v.unitPrice,
      amount: v.guardCount * v.unitPrice,
    }));

  // 案件別明細（人日 × 単価）
  const projectMap = new Map<
    string,
    { guardDays: number; unitPrice: number }
  >();
  for (const rec of workRecords) {
    const ex = projectMap.get(rec.projectName);
    if (ex) {
      ex.guardDays += rec.guardCount;
    } else {
      projectMap.set(rec.projectName, {
        guardDays: rec.guardCount,
        unitPrice: rec.unitPrice,
      });
    }
  }
  const lineItems: InvoiceLineItem[] = [...projectMap.entries()].map(
    ([name, v]) => ({
      description: `${name} 警備業務（${dbInvoice.month}月分）`,
      quantity: v.guardDays,
      unit: "人日",
      unitPrice: v.unitPrice,
      amount: v.guardDays * v.unitPrice,
    }),
  );

  const issueDate = dbInvoice.issuedAt
    ? dbInvoice.issuedAt.toISOString().slice(0, 10)
    : `${dbInvoice.year}-${String(dbInvoice.month).padStart(2, "0")}-25`;

  return {
    id: dbInvoice.id,
    invoiceNo: `INV-${dbInvoice.year}${String(dbInvoice.month).padStart(2, "0")}-${String(invoiceIndex + 1).padStart(3, "0")}`,
    clientId: dbInvoice.client.id,
    clientName: dbInvoice.client.name,
    issueDate,
    dueDate: dbInvoice.dueDate
      ? dbInvoice.dueDate.toISOString().slice(0, 10)
      : "",
    year: dbInvoice.year,
    month: dbInvoice.month,
    status: dbInvoice.status as Invoice["status"],
    subtotal: dbInvoice.subtotal,
    taxAmount: dbInvoice.taxAmount,
    totalAmount: dbInvoice.total,
    paidAt: dbInvoice.paidAt
      ? dbInvoice.paidAt.toISOString().slice(0, 10)
      : null,
    notes: dbInvoice.notes ?? "",
    lineItems,
    workRecords,
  };
}

// 当月の DB 請求書をビュー型で返す（未生成なら空配列）
export async function getInvoicesForView(
  year: number,
  month: number,
): Promise<Invoice[]> {
  const session = await requireSession();
  if (session.isDemo) return [];
  // 請求書は経理・管理者のみ閲覧可能
  if (session.role !== "ADMIN" && session.role !== "ACCOUNTANT") {
    throw new Error("Forbidden");
  }

  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);

  const dbInvoices = await prisma.invoice.findMany({
    where: { orgId: session.orgId, year, month },
    include: { client: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (dbInvoices.length === 0) return [];

  // 当月の完了配置を一括取得
  const attendances = await prisma.attendance.findMany({
    where: {
      user: { orgId: session.orgId },
      clockOut: { not: null },
      assignment: { workDate: { gte: from, lt: to } },
    },
    include: {
      assignment: {
        include: {
          project: {
            include: { site: { select: { clientId: true } } },
          },
        },
      },
    },
  });

  // clientId でグループ化
  const attsByClient = new Map<string, AttForInvoice[]>();
  for (const att of attendances) {
    const clientId = att.assignment.project.site.clientId;
    const arr = attsByClient.get(clientId) ?? [];
    arr.push(att);
    attsByClient.set(clientId, arr);
  }

  return dbInvoices.map((inv, i) =>
    buildInvoiceView(inv, attsByClient.get(inv.clientId) ?? [], i),
  );
}

// 配置実績から請求書を自動生成（クライアントごとに 1 件）
export async function generateInvoices(
  year: number,
  month: number,
): Promise<Invoice[]> {
  const session = await requireSession();
  if (session.isDemo) return [];
  // 経理・管理者のみ請求書生成可能
  if (session.role !== "ADMIN" && session.role !== "ACCOUNTANT") {
    throw new Error("Forbidden");
  }

  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);

  // 当月の完了配置を取得
  const attendances = await prisma.attendance.findMany({
    where: {
      user: { orgId: session.orgId },
      clockOut: { not: null },
      assignment: { workDate: { gte: from, lt: to } },
    },
    include: {
      assignment: {
        include: {
          project: {
            include: {
              site: {
                include: {
                  client: {
                    select: { id: true, name: true, paymentTermDays: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // clientId でグループ化
  const byClient = new Map<
    string,
    {
      client: { id: string; name: string; paymentTermDays: number };
      atts: typeof attendances;
    }
  >();
  for (const att of attendances) {
    const client = att.assignment.project.site.client;
    const ex = byClient.get(client.id);
    if (ex) {
      ex.atts.push(att);
    } else {
      byClient.set(client.id, { client, atts: [att] });
    }
  }

  const results: Invoice[] = [];
  let idx = 0;

  for (const [clientId, { client, atts }] of byClient) {
    // 日別 × 現場 で集計
    const dayMap = new Map<string, { unitPrice: number; guardCount: number }>();
    for (const att of atts) {
      const { workDate, project } = att.assignment;
      const key = `${workDate.toISOString().slice(0, 10)}__${project.name}`;
      const ex = dayMap.get(key);
      if (ex) {
        ex.guardCount++;
      } else {
        dayMap.set(key, { unitPrice: project.unitPrice, guardCount: 1 });
      }
    }

    const subtotal = [...dayMap.values()].reduce(
      (s, v) => s + v.unitPrice * v.guardCount,
      0,
    );
    const taxAmount = Math.round(subtotal * 0.1);
    const total = subtotal + taxAmount;

    // 発行日・支払期限
    const issuedDate = new Date(year, month - 1, 25);
    const dueDate = new Date(issuedDate);
    dueDate.setDate(dueDate.getDate() + (client.paymentTermDays ?? 30));

    // 既存の Invoice を探してから upsert
    const existing = await prisma.invoice.findFirst({
      where: { orgId: session.orgId, clientId, year, month },
    });

    let dbInv: DbInvoice;
    if (existing) {
      dbInv = (await prisma.invoice.update({
        where: { id: existing.id },
        data: { subtotal, taxAmount, total, dueDate, status: "DRAFT" },
        include: { client: { select: { id: true, name: true } } },
      })) as DbInvoice;
    } else {
      dbInv = (await prisma.invoice.create({
        data: {
          orgId: session.orgId,
          clientId,
          year,
          month,
          subtotal,
          taxAmount,
          total,
          dueDate,
          status: "DRAFT",
        },
        include: { client: { select: { id: true, name: true } } },
      })) as DbInvoice;
    }

    results.push(buildInvoiceView(dbInv, atts, idx++));
  }

  revalidatePath("/dashboard/invoices");
  return results;
}

// ステータス変更（DRAFT → ISSUED → PAID）
export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  const session = await requireSession();
  if (session.isDemo) return;
  // 経理・管理者のみステータス変更可能
  if (session.role !== "ADMIN" && session.role !== "ACCOUNTANT") {
    throw new Error("Forbidden");
  }

  await prisma.invoice.update({
    where: { id, orgId: session.orgId },
    data: {
      status,
      paidAt: status === "PAID" ? new Date() : undefined,
      issuedAt: status === "ISSUED" ? new Date() : undefined,
    },
  });

  revalidatePath("/dashboard/invoices");
}

// 後方互換
export async function getInvoices(year?: number, month?: number) {
  const session = await requireSession();
  if (session.isDemo) return [];
  // 請求書は経理・管理者のみ閲覧可能
  if (session.role !== "ADMIN" && session.role !== "ACCOUNTANT") {
    throw new Error("Forbidden");
  }

  return prisma.invoice.findMany({
    where: {
      orgId: session.orgId,
      ...(year ? { year, ...(month ? { month } : {}) } : {}),
    },
    include: {
      client: { select: { name: true } },
      project: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
