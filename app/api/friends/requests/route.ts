import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/* -------------------------------------------------------------------------- */
/* GET – всички чакащи покани към текущия потребител                          */
/* -------------------------------------------------------------------------- */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    const friendRequests = await prisma.friendRequest.findMany({
      where: {
        recipientId: session.user.id,
        status: "PENDING",
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            occupation: true,
            location: true,
            bio: true,
            createdAt: true,
            updatedAt: true,
            role: true,
            coverImage: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: friendRequests });
  } catch (err) {
    console.error("Грешка при извличане на покани:", err);
    return NextResponse.json(
      { success: false, error: "Неуспешно извличане на покани за приятелство" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/* POST – изпращане на нова покана                                            */
/* -------------------------------------------------------------------------- */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    const { recipientId } = await request.json();
    if (!recipientId) {
      return NextResponse.json(
        { success: false, error: "Липсва идентификатор на получателя" },
        { status: 400 }
      );
    }

    // 1. получателят трябва да съществува
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true },
    });
    if (!recipient) {
      return NextResponse.json(
        { success: false, error: "Получателят не е намерен" },
        { status: 404 }
      );
    }

    // 2. не можем да изпратим покана на себе си
    if (recipientId === session.user.id) {
      return NextResponse.json(
        { success: false, error: "Не можете да изпратите покана на себе си" },
        { status: 400 }
      );
    }

    // 3. вече приятели?
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: session.user.id, friendId: recipientId },
          { userId: recipientId, friendId: session.user.id },
        ],
      },
    });
    if (existingFriendship) {
      return NextResponse.json(
        { success: false, error: "Вече сте приятели с този потребител" },
        { status: 400 }
      );
    }

    // 4. чакаща покана?
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, recipientId },
          { senderId: recipientId, recipientId: session.user.id },
        ],
        status: "PENDING",
      },
    });
    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: "Поканата за приятелство вече съществува" },
        { status: 400 }
      );
    }

    // 5. създай поканата
    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: session.user.id,
        recipientId,
        status: "PENDING",
      },
    });

    // 6. създай известие за получателя
    await prisma.notification.create({
      data: {
        type: "FRIEND_REQUEST", // enum NotificationType
        content: "ви изпрати покана за приятелство",
        senderId: session.user.id,
        recipientId,
        targetId: friendRequest.id, // ← важната връзка
        targetType: "FRIEND_REQUEST", // enum TargetType
      },
    });

    return NextResponse.json({ success: true, data: friendRequest });
  } catch (err) {
    console.error("Грешка при изпращане на покана:", err);
    return NextResponse.json(
      { success: false, error: "Неуспешно изпращане на покана за приятелство" },
      { status: 500 }
    );
  }
}
