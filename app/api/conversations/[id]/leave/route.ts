import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getIO } from "@/lib/socket-server"; // ← optional websockets

/* -------------------------------------------------------------------------- */
/*  POST /api/conversations/:id/leave                                         */
/*  – Only for group chats. Removes the caller from ConversationParticipant.  */
/* -------------------------------------------------------------------------- */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    /* --------------------------- auth & params -------------------------- */
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const conversationId = id;

    /* ------------------------ verify membership ------------------------- */
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId },
      select: {
        isGroup: true,
        participants: {
          select: { userId: true },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId === session.user.id
    );
    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: "Not a participant in this conversation" },
        { status: 403 }
      );
    }

    if (!conversation.isGroup) {
      return NextResponse.json(
        { success: false, error: "Cannot leave a 1-on-1 conversation" },
        { status: 400 }
      );
    }

    /* ----------------------- remove participant row -------------------- */
    await prisma.conversationParticipant.delete({
      where: {
        userId_conversationId: {
          userId: session.user.id,
          conversationId,
        },
      },
    });

    /* ------------------ clean-up if chat is now empty ------------------ */
    const remaining = await prisma.conversationParticipant.count({
      where: { conversationId },
    });
    if (remaining === 0) {
      await prisma.conversation.delete({ where: { id: conversationId } });
    }

    /* ------------------------ websocket broadcast ---------------------- */
    const io = getIO();
    if (io) {
      io.to(`conversation:${conversationId}`).emit("participant-left", {
        userId: session.user.id,
        conversationId,
      });
    }

    return NextResponse.json({ success: true, data: { left: true } });
  } catch (err) {
    console.error("Error leaving conversation:", err);
    return NextResponse.json(
      { success: false, error: "Failed to leave conversation" },
      { status: 500 }
    );
  }
}
