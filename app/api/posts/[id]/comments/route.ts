import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/* -------------------------------------------------------------------------- */
/* GET /api/posts/[id]/comments                                               */
/* -------------------------------------------------------------------------- */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const postId = id;

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            occupation: true,
            location: true,
            bio: true,
            coverImage: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: comments });
  } catch (err) {
    console.error("Error fetching comments:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/* POST /api/posts/[id]/comments                                              */
/* -------------------------------------------------------------------------- */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const postId = id;
    const formData = await request.formData();
    const content = formData.get("content") as string;

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Comment cannot be empty" },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: session.user.id,
        postId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            occupation: true,
            location: true,
            bio: true,
            coverImage: true,
          },
        },
      },
    });

    /* ------------------------ notification to post author ----------------- */
    if (post.authorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: "COMMENT",
          content: "коментира публикацията ви",
          senderId: session.user.id,
          recipientId: post.authorId,
          targetId: postId, // 🔽 новото поле
          targetType: "POST", // 🔽 enum TargetType
        },
      });
    }

    return NextResponse.json({ success: true, data: comment });
  } catch (err) {
    console.error("Error creating comment:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
