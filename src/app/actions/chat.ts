"use server";

import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// チャットルーム一覧（組織内のチャンネル）
export async function getChatRooms() {
  const session = await requireSession();
  if (session.isDemo) return [];

  return prisma.chatChannel.findMany({
    where: { orgId: session.orgId },
    include: {
      messages: {
        orderBy: { sentAt: "desc" },
        take: 1,
        include: { sender: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// メッセージ一覧取得
export async function getMessages(channelId: string, limit = 50) {
  const session = await requireSession();
  if (session.isDemo) return [];

  return prisma.chatMessage.findMany({
    where: { channelId, channel: { orgId: session.orgId } },
    include: { sender: { select: { id: true, name: true, role: true } } },
    orderBy: { sentAt: "asc" },
    take: limit,
  });
}

// メッセージ送信
export async function sendMessage(channelId: string, body: string) {
  const session = await requireSession();
  if (session.isDemo) return { id: "demo" };

  const msg = await prisma.chatMessage.create({
    data: {
      channelId,
      senderId: session.userId,
      body,
    },
  });

  // チャンネルの updatedAt を更新
  await prisma.chatChannel.update({
    where: { id: channelId },
    data: { updatedAt: new Date() },
  });

  revalidatePath("/dashboard/chat");
  return msg;
}

// 一斉送信チャンネルを作成（組織ごとに1つ）
export async function ensureBroadcastChannel() {
  const session = await requireSession();
  if (session.isDemo) return null;

  const existing = await prisma.chatChannel.findFirst({
    where: { orgId: session.orgId, channelType: "BROADCAST" },
  });
  if (existing) return existing;

  return prisma.chatChannel.create({
    data: {
      orgId: session.orgId,
      name: "一斉連絡",
      channelType: "BROADCAST",
    },
  });
}
