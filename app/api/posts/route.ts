import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PostVisibility, Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    /* ------------------------------------------------------------------ */
    /*  1.  Identify the viewer                                           */
    /* ------------------------------------------------------------------ */
    const session = await getServerSession(authOptions);
    const viewerId = session?.user?.id ?? null;

    const url = new URL(request.url);
    const page = Math.max(
      1,
      Number.parseInt(url.searchParams.get("page") ?? "1", 10)
    );
    const limit = Math.min(
      50,
      Number.parseInt(url.searchParams.get("limit") ?? "10", 10)
    );
    const skip = (page - 1) * limit;

    /* ------------------------------------------------------------------ */
    /*  2.  Collect the viewer’s friend IDs (if logged in)                */
    /* ------------------------------------------------------------------ */
    let friendIds: string[] = [];

    if (viewerId) {
      const rows = await prisma.friendship.findMany({
        where: {
          OR: [{ userId: viewerId }, { friendId: viewerId }],
        },
        select: { userId: true, friendId: true },
      });

      const set = new Set<string>();
      for (const f of rows) {
        if (f.userId !== viewerId) set.add(f.userId);
        if (f.friendId !== viewerId) set.add(f.friendId);
      }
      friendIds = Array.from(set);
    }

    /* ------------------------------------------------------------------ */
    /*  3.  Build the visibility filter                                   */
    /* ------------------------------------------------------------------ */
    const visibilityWhere: Prisma.PostWhereInput = viewerId
      ? {
          OR: [
            { visibility: PostVisibility.PUBLIC },

            // viewer’s own posts, regardless of flag
            { authorId: viewerId },

            // friends-only posts **from friends only**
            {
              AND: [
                { visibility: PostVisibility.FRIENDS },
                { authorId: { in: friendIds } },
              ],
            },
          ],
        }
      : { visibility: PostVisibility.PUBLIC }; // visitors see public only

    /* ------------------------------------------------------------------ */
    /*  4.  Fetch the paged list + total count in one transaction         */
    /* ------------------------------------------------------------------ */
    const [totalPosts, posts] = await prisma.$transaction([
      prisma.post.count({ where: visibilityWhere }),
      prisma.post.findMany({
        where: visibilityWhere,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },

        /* -------- all nested data inside a single `select` ------------- */
        select: {
          id: true,
          content: true,
          createdAt: true,
          visibility: true,
          allowComments: true,
          showLikes: true,

          author: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
              createdAt: true,
              updatedAt: true,
              occupation: true,
              location: true,
              bio: true,
              coverImage: true,
              email: true,
            },
          },

          PostMedia: {
            orderBy: { index: "asc" },
            select: {
              url: true,
              type: true,
              filters: true,
              edits: true,
            },
          },

          _count: { select: { likes: true, comments: true } },
        },
      }),
    ]);

    /* ------------------------------------------------------------------ */
    /*  5.  Return JSON                                                   */
    /* ------------------------------------------------------------------ */
    return NextResponse.json({
      success: true,
      data: posts,
      meta: {
        page,
        limit,
        pages: Math.ceil(totalPosts / limit),
        total: totalPosts,
      },
    });
  } catch (err) {
    console.error("Error fetching posts:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
