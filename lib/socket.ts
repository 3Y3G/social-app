import type { Server as NetServer } from "http"
import { Server as SocketIOServer } from "socket.io"
import type { NextApiRequest } from "next"
import { getSession } from "next-auth/react"
import prisma from "@/lib/prisma"

export type NextApiResponseWithSocket = {
  socket: {
    server: NetServer & {
      io?: SocketIOServer
    }
  }
}

export const initializeSocket = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server)
    res.socket.server.io = io

    io.use(async (socket, next) => {
      const session = await getSession({ req })
      if (!session?.user?.id) {
        return next(new Error("Unauthorized"))
      }

      // Attach user ID to socket for later use
      socket.data.userId = session.user.id

      // Update user presence
      await prisma.userPresence.upsert({
        where: { userId: session.user.id },
        update: { isOnline: true, lastActive: new Date() },
        create: { userId: session.user.id, isOnline: true },
      })

      next()
    })

    io.on("connection", (socket) => {
      const userId = socket.data.userId

      // Join a room for the user to receive direct messages
      socket.join(`user:${userId}`)

      // Handle joining conversation rooms
      socket.on("join-conversation", (conversationId) => {
        socket.join(`conversation:${conversationId}`)
      })

      // Handle new messages
      socket.on("send-message", async (data) => {
        const { conversationId, content, mediaUrl, mediaType } = data

        try {
          // Create message in database
          const message = await prisma.message.create({
            data: {
              content,
              mediaUrl,
              mediaType,
              conversationId,
              senderId: userId,
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

          // Emit to all participants in the conversation
          io.to(`conversation:${conversationId}`).emit("new-message", message)

          // Find all participants to send notifications
          const participants = await prisma.conversationParticipant.findMany({
            where: { conversationId },
            select: { userId: true },
          })

          // Send notifications to all participants except sender
          participants.forEach((participant) => {
            if (participant.userId !== userId) {
              io.to(`user:${participant.userId}`).emit("notification", {
                type: "NEW_MESSAGE",
                message,
              })
            }
          })
        } catch (error) {
          console.error("Error sending message:", error)
          socket.emit("error", { message: "Failed to send message" })
        }
      })

      // Handle typing indicators
      socket.on("typing", ({ conversationId, isTyping }) => {
        socket.to(`conversation:${conversationId}`).emit("user-typing", {
          userId,
          isTyping,
        })
      })

      // Handle read receipts
      socket.on("mark-read", async ({ messageId, conversationId }) => {
        try {
          // Update read receipt in database
          await prisma.readReceipt.upsert({
            where: {
              userId_messageId: {
                userId,
                messageId,
              },
            },
            update: { readAt: new Date() },
            create: {
              userId,
              messageId,
              readAt: new Date(),
            },
          })

          // Update last read in conversation
          await prisma.conversationParticipant.updateMany({
            where: {
              userId,
              conversationId,
            },
            data: {
              lastRead: new Date(),
            },
          })

          // Notify other participants
          socket.to(`conversation:${conversationId}`).emit("message-read", {
            messageId,
            userId,
            readAt: new Date(),
          })
        } catch (error) {
          console.error("Error marking message as read:", error)
        }
      })

      // Handle disconnection
      socket.on("disconnect", async () => {
        // Update user presence
        await prisma.userPresence.update({
          where: { userId },
          data: { isOnline: false, lastActive: new Date() },
        })
      })
    })
  }

  return res.socket.server.io
}

