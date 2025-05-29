import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/* -------------------------------------------------------------------------- */
/* PATCH  /api/friends/requests/[id] – accept / reject покана                 */
/* -------------------------------------------------------------------------- */

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id: requestId } = await props.params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    const { action } = await request.json();
    if (!action || !["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Невалидно действие" },
        { status: 400 }
      );
    }

    /* ---------------------------------- data --------------------------------- */
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: { sender: { select: { id: true, name: true } } },
    });

    if (!friendRequest) {
      return NextResponse.json(
        { success: false, error: "Поканата за приятелство не е намерена" },
        { status: 404 }
      );
    }

    if (friendRequest.recipientId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Нямате права да обработите тази покана" },
        { status: 403 }
      );
    }

    /* ------------------------------ accept logic ------------------------------ */
    if (action === "accept") {
      // ако вече има приятелство, не създаваме дубликат
      const exists = await prisma.friendship.findFirst({
        where: {
          OR: [
            {
              userId: friendRequest.senderId,
              friendId: friendRequest.recipientId,
            },
            {
              userId: friendRequest.recipientId,
              friendId: friendRequest.senderId,
            },
          ],
        },
      });

      if (!exists) {
        await prisma.friendship.create({
          data: {
            userId: friendRequest.senderId,
            friendId: friendRequest.recipientId,
          },
        });
      }

      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "ACCEPTED" },
      });

      // уведомление до подателя
      await prisma.notification.create({
        data: {
          type: "FRIEND_ACCEPT",
          content: "приема вашата покана за приятелство",
          senderId: session.user.id,
          recipientId: friendRequest.senderId,
          targetId: requestId,
          targetType: "FRIEND_REQUEST",
        },
      });
    }

    /* ------------------------------ reject logic ------------------------------ */
    if (action === "reject") {
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" },
      });
      // по избор може да се добави известие за отказ
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Грешка при обработка на покана:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Неуспешна обработка на поканата за приятелство",
      },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/* DELETE /api/friends/requests/[id] – анулиране (само от подателя)            */
/* -------------------------------------------------------------------------- */

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id: requestId } = await props.params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!friendRequest) {
      return NextResponse.json(
        { success: false, error: "Поканата за приятелство не е намерена" },
        { status: 404 }
      );
    }

    if (friendRequest.senderId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Нямате права да изтриете тази покана" },
        { status: 403 }
      );
    }

    await prisma.friendRequest.delete({ where: { id: requestId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Грешка при изтриване на покана:", err);
    return NextResponse.json(
      { success: false, error: "Неуспешно изтриване на покана за приятелство" },
      { status: 500 }
    );
  }
}
