// route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";
import * as fs from "fs/promises";
import path from "path";
import sharp from "sharp";

async function ensureUploadDir() {
  await fs.mkdir(uploadDir, { recursive: true });
}

const uploadDir = path.resolve("uploads"); // or use absolute path like '/var/uploads'

async function saveFileToUploads(file: File) {
  await fs.mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name) || ".jpg";
  const filename = `${Date.now()}-${randomUUID()}.jpg`;
  const filepath = path.join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());

  const resized = await sharp(buffer)
    .resize({ width: 720, height: 1280, fit: "cover", position: "center" })
    .jpeg({ quality: 80 })
    .toBuffer();

  await fs.writeFile(filepath, resized);

  return `/api/uploads/${filename}`; // not the public URL, just the file ID
}

export async function GET(request: NextRequest) {
  try {
    const now = new Date();

    const stories = await prisma.story.findMany({
      where: {
        expiresAt: {
          gt: now,
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: stories,
    });
  } catch (error) {
    console.error("Error fetching stories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    await ensureUploadDir();
    const formData = await request.formData();
    const image = formData.get("image") as File | null;
    const content = formData.get("caption") as string | null;

    if (!image) {
      return NextResponse.json(
        { success: false, error: "Image is required" },
        { status: 400 }
      );
    }

    const imageUrl = await saveFileToUploads(image);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await prisma.story.create({
      data: {
        image: imageUrl,
        content: content || null,
        authorId: session.user.id,
        expiresAt,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: story,
    });
  } catch (error) {
    console.error("Error creating story:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create story" },
      { status: 500 }
    );
  }
}
