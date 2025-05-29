// route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";
import * as fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const uploadDir = path.join(process.cwd(), "public", "uploads");

async function ensureUploadDir() {
  await fs.mkdir(uploadDir, { recursive: true });
}

async function saveFileToUploads(file: File) {
  const ext = path.extname(file.name) || ".jpg"; // enforce jpg/png
  const filename = `${Date.now()}-${randomUUID()}.jpg`; // always save as jpg
  const filepath = path.join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());

  const targetWidth = 720; // example: 720x1280 = 9:16
  const targetHeight = 1280;

  const resized = await sharp(buffer)
    .resize({
      width: targetWidth,
      height: targetHeight,
      fit: "cover", // ensures crop/zoom to fill 9:16
      position: "center",
    })
    .jpeg({ quality: 80 }) // compress and convert to jpeg
    .toBuffer();

  await fs.writeFile(filepath, resized);

  return `/uploads/${filename}`;
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
