import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    /* ------------------------- pagination params ------------------------- */
    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") ?? "1", 10)
    );
    const limit = Math.min(
      50,
      Number.parseInt(searchParams.get("limit") ?? "10", 10)
    ); // hard-cap 50
    const skip = (page - 1) * limit;

    /* ---------------------- count + query in one tx ---------------------- */
    const [totalPosts, posts] = await prisma.$transaction([
      prisma.post.count(),
      prisma.post.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
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
            orderBy: { index: "asc" }, // PostMedia items in original order
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

import { randomUUID } from "crypto";
import * as fs from "fs/promises";
import path from "path";
import { createPost } from "@/lib/post-actions";

const uploadDir = path.join(process.cwd(), "public", "uploads");

async function ensureUploadDir() {
  await fs.mkdir(uploadDir, { recursive: true });
}

async function saveFileToUploads(file: File) {
  const ext = path.extname(file.name) || ".bin";
  const filename = `${Date.now()}-${randomUUID()}${ext}`;
  const filepath = path.join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);

  // public URL (Next.js automatically serves /public)
  return `/uploads/${filename}`;
}

export async function POST(req: Request) {
  try {
    await ensureUploadDir();

    const form = await req.formData();

    let index = 0;
    while (form.get(`media_${index}`)) {
      const fileOrUrl = form.get(`media_${index}`);

      // if the client already sent a url (string), skip
      if (fileOrUrl instanceof File) {
        const url = await saveFileToUploads(fileOrUrl);
        form.set(`media_${index}`, url); // replace File with url string
      }

      index++;
    }

    const result = await createPost(form);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    console.error("Error in /api/posts:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create post" },
      { status: 500 }
    );
  }
}
