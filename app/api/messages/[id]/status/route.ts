// app/api/messages/[id]/status/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getIO } from "@/lib/socket-server"

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    const messageId = (await props.params).id
    const { status } = await request.json()
    if (!["DELIVERED", "READ"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 })
    }
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { participants: true } } },
    })
    if (!message) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 })
    }
    if (!message.conversation.participants.some((p) => p.userId === session.user.id)) {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 })
    }

    const io = getIO()

    if (status === "DELIVERED") {
      await prisma.deliveryReceipt.upsert({
        where: { userId_messageId: { userId: session.user.id, messageId } },
        update: { deliveredAt: new Date() },
        create: { userId: session.user.id, messageId, deliveredAt: new Date() },
      })
      const total = await prisma.deliveryReceipt.count({ where: { messageId } })
      if (total >= message.conversation.participants.length - 1) {
        await prisma.message.update({ where: { id: messageId }, data: { deliveryStatus: "DELIVERED" } })
      }
      io?.to(`user:${message.senderId}`).emit("message-delivered", { messageId, userId: session.user.id })
    }

    if (status === "READ") {
      await prisma.readReceipt.upsert({
        where: { userId_messageId: { userId: session.user.id, messageId } },
        update: { readAt: new Date() },
        create: { userId: session.user.id, messageId, readAt: new Date() },
      })
      await prisma.conversationParticipant.update({
        where: { userId_conversationId: { userId: session.user.id, conversationId: message.conversationId } },
        data: { lastRead: new Date() },
      })
      const total = await prisma.readReceipt.count({ where: { messageId } })
      if (total >= message.conversation.participants.length - 1) {
        await prisma.message.update({ where: { id: messageId }, data: { deliveryStatus: "READ" } })
      }
      io?.to(`conversation:${message.conversationId}`).emit("message-read", {
        messageId,
        userId: session.user.id,
      })
      io?.to(`user:${message.senderId}`).emit("message-read-by-user", {
        messageId,
        userId: session.user.id,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating message status:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    const messageId = (await props.params).id
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        deliveryReceipts: { include: { user: { select: { id: true, name: true } } } },
        readReceipts: { include: { user: { select: { id: true, name: true } } } },
      },
    })
    if (!message) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        deliveryStatus: message.deliveryStatus,
        deliveryReceipts: message.deliveryReceipts,
        readReceipts: message.readReceipts,
      },
    })
  } catch (error) {
    console.error("Error fetching message status:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
