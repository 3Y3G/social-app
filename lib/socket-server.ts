// @lib/socket-server.ts

import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HTTPServer) {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  /* ------------------------------------------------------------------------ */
  /* auth middleware                                                          */
  /* ------------------------------------------------------------------------ */
  io.use(async (socket, next) => {
    try {
      const req = socket.request as any;
      const res = {} as any;
      const session = await getServerSession(req, res, authOptions);

      if (!session?.user?.id) return next(new Error("Unauthorized"));

      socket.data.userId = session.user.id;
      await prisma.user.update({
        where: { id: session.user.id },
        data: { isOnline: true, lastActive: new Date() },
      });

      next();
    } catch (err) {
      console.error("Socket authentication error:", err);
      next(new Error("Authentication error"));
    }
  });

  /* ------------------------------------------------------------------------ */
  /* connection                                                               */
  /* ------------------------------------------------------------------------ */
  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId}`);

    /* personal room -------------------------------------------------------- */
    socket.join(`user:${userId}`);

    /* join conversation room ---------------------------------------------- */
    socket.on("join-conversation", async (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${userId} joined conversation: ${conversationId}`);

      /* mark undelivered messages as delivered ----------------------------- */
      try {
        const undelivered = await prisma.message.findMany({
          where: {
            conversationId,
            senderId: { not: userId },
            deliveryStatus: "SENT",
            deliveryReceipts: { none: { userId } },
          },
        });

        if (undelivered.length) {
          for (const msg of undelivered) {
            await prisma.deliveryReceipt.create({
              data: { userId, messageId: msg.id },
            });

            const conv = await prisma.conversation.findUnique({
              where: { id: conversationId },
              include: { participants: true },
            });

            const allIds = conv?.participants.map((p) => p.userId) || [];
            const count = await prisma.deliveryReceipt.count({
              where: { messageId: msg.id },
            });

            if (count >= allIds.length - 1) {
              await prisma.message.update({
                where: { id: msg.id },
                data: { deliveryStatus: "DELIVERED" },
              });
            }

            io?.to(`user:${msg.senderId}`).emit("message-delivered", {
              messageId: msg.id,
              userId,
              deliveredAt: new Date(),
            });
          }
        }
      } catch (err) {
        console.error("Error updating delivery status:", err);
      }
    });

    /* send message --------------------------------------------------------- */
    socket.on("send-message", async (data) => {
      try {
        const { conversationId, content, mediaUrl, mediaType } = data;

        /* verify participant ------------------------------------------------ */
        const ok = await prisma.conversationParticipant.findUnique({
          where: {
            userId_conversationId: { userId, conversationId },
          },
        });
        if (!ok) {
          socket.emit("error", { message: "Not authorized" });
          return;
        }

        /* create message in DB --------------------------------------------- */
        const message = await prisma.message.create({
          data: {
            content,
            mediaUrl,
            mediaType,
            conversationId,
            senderId: userId,
            deliveryStatus: "SENT",
          },
          include: {
            sender: { select: { id: true, name: true, image: true } },
            readReceipts: true,
          },
        });

        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        await prisma.readReceipt.create({
          data: { userId, messageId: message.id },
        });

        io?.to(`conversation:${conversationId}`).emit("new-message", message);

        /* participants & online users -------------------------------------- */
        const participants = await prisma.conversationParticipant.findMany({
          where: { conversationId },
          select: { userId: true },
        });

        const onlineUsers: string[] = [];
        const room = io?.sockets.adapter.rooms.get(
          `conversation:${conversationId}`
        );
        if (room) {
          for (const sid of room) {
            const s = io?.sockets.sockets.get(sid);
            if (s && s.data.userId !== userId) onlineUsers.push(s.data.userId);
          }
        }

        /* delivery receipts for online users ------------------------------- */
        for (const uid of onlineUsers) {
          await prisma.deliveryReceipt.create({
            data: { userId: uid, messageId: message.id },
          });
        }

        if (onlineUsers.length >= participants.length - 1) {
          await prisma.message.update({
            where: { id: message.id },
            data: { deliveryStatus: "DELIVERED" },
          });
          socket.emit("message-delivered", {
            messageId: message.id,
            deliveredAt: new Date(),
            deliveredToAll: true,
          });
        }

        /* notifications for offline participants --------------------------- */
        for (const { userId: pId } of participants) {
          if (pId === userId) continue;

          const notification = await prisma.notification.create({
            data: {
              type: "NEW_MESSAGE",
              content: "Ново съобщение",
              senderId: userId,
              recipientId: pId,
              targetId: conversationId, // 🠖 вместо postId
              targetType: "CONVERSATION",
            },
            include: {
              sender: { select: { id: true, name: true, image: true } },
            },
          });

          io?.to(`user:${pId}`).emit("notification", {
            type: "NEW_MESSAGE",
            notification,
            message,
          });
        }
      } catch (err) {
        console.error("Error sending message:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    /* typing indicator ---------------------------------------------------- */
    socket.on("typing", ({ conversationId, isTyping }) => {
      socket
        .to(`conversation:${conversationId}`)
        .emit("user-typing", { userId, isTyping });
    });

    /* mark read ----------------------------------------------------------- */
    socket.on("mark-read", async ({ messageId, conversationId }) => {
      try {
        await prisma.readReceipt.upsert({
          where: { userId_messageId: { userId, messageId } },
          update: { readAt: new Date() },
          create: { userId, messageId, readAt: new Date() },
        });

        await prisma.conversationParticipant.update({
          where: { userId_conversationId: { userId, conversationId } },
          data: { lastRead: new Date() },
        });

        const msg = await prisma.message.findUnique({
          where: { id: messageId },
          include: {
            readReceipts: true,
            conversation: { include: { participants: true } },
          },
        });

        if (msg) {
          const allIds = msg.conversation.participants.map((p) => p.userId);
          const readIds = msg.readReceipts.map((r) => r.userId);
          const everyoneRead = allIds.every(
            (id) => id === msg.senderId || readIds.includes(id)
          );

          if (everyoneRead) {
            await prisma.message.update({
              where: { id: messageId },
              data: { deliveryStatus: "READ" },
            });
          }
        }

        socket.to(`conversation:${conversationId}`).emit("message-read", {
          messageId,
          userId,
          readAt: new Date(),
        });

        const original = await prisma.message.findUnique({
          where: { id: messageId },
          select: { senderId: true },
        });

        if (original) {
          io?.to(`user:${original.senderId}`).emit("message-read-by-user", {
            messageId,
            userId,
            readAt: new Date(),
          });
        }
      } catch (err) {
        console.error("Error marking read:", err);
        socket.emit("error", { message: "Failed to mark as read" });
      }
    });

    /* disconnect ---------------------------------------------------------- */
    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${userId}`);
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: false, lastActive: new Date() },
      });
    });
  });

  return io;
}

export function getIO() {
  return io;
}
