/* app/api/users/suggested/route.ts */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/users/suggested?limit=12
 * --------------------------------------------------------------------------
 * Връща списък с предложения за приятели на текущия потребител.
 */
export async function GET(req: Request) {
  try {
    /* ------------ 1. проверка за сесия ------------------------------------ */
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    const currentUserId = session.user.id;
    const url = new URL(req.url);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") ?? "10", 10) || 10,
      50
    ); // безопасен upper-bound

    /* ------------ 2. всички ID, които трябва да изключим ------------------ */
    // a) вече приятели
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userId: currentUserId }, { friendId: currentUserId }],
      },
      select: { userId: true, friendId: true },
    });

    const friendIds = friendships.flatMap((f) =>
      f.userId === currentUserId ? [f.friendId] : [f.userId]
    );

    // b) чакащи покани (изпратени или получени)
    const pendingReqs = await prisma.friendRequest.findMany({
      where: {
        status: "PENDING",
        OR: [{ senderId: currentUserId }, { recipientId: currentUserId }],
      },
      select: { senderId: true, recipientId: true },
    });

    const pendingIds = pendingReqs.flatMap((r) => [r.senderId, r.recipientId]);

    // c) самият потребител
    const excludedIds = new Set<string>([
      currentUserId,
      ...friendIds,
      ...pendingIds,
    ]);

    /* ------------ 3. извличане на предложени потребители ------------------ */
    const suggested = await prisma.user.findMany({
      where: { id: { notIn: Array.from(excludedIds) } },
      take: limit,
      orderBy: { createdAt: "desc" }, // проста Heuristic-a; заменете с mutual-friends ако искате
      select: {
        id: true,
        name: true,
        image: true,
        occupation: true,
        location: true,
        bio: true,
        createdAt: true,
        coverImage: true,
      },
    });

    return NextResponse.json({ success: true, data: suggested });
  } catch (err) {
    console.error("Грешка при извличане на предложения:", err);
    return NextResponse.json(
      { success: false, error: "Неуспешно извличане на предложения" },
      { status: 500 }
    );
  }
}
