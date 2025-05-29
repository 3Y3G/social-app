// app/api/messages/[id]/route.ts

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getIO } from "@/lib/socket-server"

// Edit a message
export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const messageId = (await props.params).id

    // Get the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: true,
      },
    })

    if (!message) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 })
    }

    // Check if user is the sender
    if (message.senderId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Not authorized to edit this message" }, { status: 403 })
    }

    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ success: false, error: "Message content is required" }, { status: 400 })
    }

    // Update message
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
        updatedAt: new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        readReceipts: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    // Emit updated message via WebSocket if available
    const io = getIO()
    if (io) {
      io.to(`conversation:${message.conversationId}`).emit("message-updated", updatedMessage)
    }

    return NextResponse.json({ success: true, data: updatedMessage })
  } catch (error) {
    console.error("Error editing message:", error)
    return NextResponse.json({ success: false, error: "Failed to edit message" }, { status: 500 })
  }
}

// Delete a message (soft delete)
export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const messageId = (await props.params).id

    // Get the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: true,
      },
    })

    if (!message) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 })
    }

    // Check if user is the sender
    if (message.senderId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Not authorized to delete this message" }, { status: 403 })
    }

    // Soft delete message
    const deletedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: "This message has been deleted",
        deletedAt: new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    // Emit deleted message via WebSocket if available
    const io = getIO()
    if (io) {
      io.to(`conversation:${message.conversationId}`).emit("message-deleted", deletedMessage)
    }

    return NextResponse.json({ success: true, data: deletedMessage })
  } catch (error) {
    console.error("Error deleting message:", error)
    return NextResponse.json({ success: false, error: "Failed to delete message" }, { status: 500 })
  }
}

// Mark message as read
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const messageId = (await props.params).id

    // Get the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: true,
          },
        },
      },
    })

    if (!message) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 })
    }

    // Check if user is a participant
    const isParticipant = message.conversation.participants.some((p) => p.userId === session.user.id)

    if (!isParticipant) {
      return NextResponse.json({ success: false, error: "Not authorized to read this message" }, { status: 403 })
    }

    // Create or update read receipt
    const readReceipt = await prisma.readReceipt.upsert({
      where: {
        userId_messageId: {
          userId: session.user.id,
          messageId,
        },
      },
      update: { readAt: new Date() },
      create: {
        userId: session.user.id,
        messageId,
        readAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Update last read in conversation
    await prisma.conversationParticipant.update({
      where: {
        userId_conversationId: {
          userId: session.user.id,
          conversationId: message.conversationId,
        },
      },
      data: {
        lastRead: new Date(),
      },
    })

    // Emit read receipt via WebSocket if available
    const io = getIO()
    if (io) {
      io.to(`conversation:${message.conversationId}`).emit("message-read", {
        messageId,
        userId: session.user.id,
        readAt: new Date(),
        user: {
          id: session.user.id,
          name: session.user.name,
        },
      })
    }

    return NextResponse.json({ success: true, data: readReceipt })
  } catch (error) {
    console.error("Error marking message as read:", error)
    return NextResponse.json({ success: false, error: "Failed to mark message as read" }, { status: 500 })
  }
}
