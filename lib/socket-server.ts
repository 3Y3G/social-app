import { Server as SocketIOServer } from "socket.io"
import type { Server as HTTPServer } from "http"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

let io: SocketIOServer | null = null

export function initSocketServer(httpServer: HTTPServer) {
  if (!io) {
    io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    })

    io.use(async (socket, next) => {
      try {
        // Get session from cookie
        const req = socket.request as any
        const res = {} as any
        const session = await getServerSession(req, res, authOptions)

        if (!session?.user?.id) {
          return next(new Error("Unauthorized"))
        }

        // Attach user ID to socket
        socket.data.userId = session.user.id

        // Update user presence
        await prisma.user.update({
          where: { id: session.user.id },
          data: { isOnline: true, lastActive: new Date() },
        })

        next()
      } catch (error) {
        console.error("Socket authentication error:", error)
        next(new Error("Authentication error"))
      }
    })

    io.on("connection", (socket) => {
      const userId = socket.data.userId
      console.log(`User connected: ${userId}`)

      // Join user's personal room
      socket.join(`user:${userId}`)

      // Handle joining conversation rooms
      socket.on("join-conversation", (conversationId) => {
        socket.join(`conversation:${conversationId}`)
        console.log(`User ${userId} joined conversation: ${conversationId}`)
      })

      // Handle new messages
      socket.on("send-message", async (data) => {
        try {
          const { conversationId, content, mediaUrl, mediaType } = data

          // Verify user is a participant in the conversation
          const participant = await prisma.conversationParticipant.findUnique({
            where: {
              userId_conversationId: {
                userId,
                conversationId,
              },
            },
          })

          if (!participant) {
            socket.emit("error", { message: "Not authorized to send messages in this conversation" })
            return
          }

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

          // Update conversation timestamp
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          })

          // Create read receipt for sender
          await prisma.readReceipt.create({
            data: {
              userId,
              messageId: message.id,
            },
          })

          // Emit to all participants in the conversation
          io?.to(`conversation:${conversationId}`).emit("new-message", message)

          // Find all participants to send notifications
          const participants = await prisma.conversationParticipant.findMany({
            where: { conversationId },
            select: { userId: true },
          })

          // Send notifications to all participants except sender
          for (const participant of participants) {
            if (participant.userId !== userId) {
              // Create notification in database
              const notification = await prisma.notification.create({
                data: {
                  type: "NEW_MESSAGE",
                  content: "ти изпрати съобщение",
                  senderId: userId,
                  recipientId: participant.userId,
                  postId: conversationId, // Using postId to store conversationId
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

              // Emit notification to recipient
              io?.to(`user:${participant.userId}`).emit("notification", {
                type: "NEW_MESSAGE",
                notification,
                message,
              })
            }
          }
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
          await prisma.conversationParticipant.update({
            where: {
              userId_conversationId: {
                userId,
                conversationId,
              },
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
          socket.emit("error", { message: "Failed to mark message as read" })
        }
      })

      // Handle disconnection
      socket.on("disconnect", async () => {
        console.log(`User disconnected: ${userId}`)

        // Update user presence
        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: false, lastActive: new Date() },
        })
      })
    })
  }

  return io
}

export function getIO() {
  return io
}

