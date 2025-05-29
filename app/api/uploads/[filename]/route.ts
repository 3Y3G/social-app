import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const uploadDir = path.resolve("uploads");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const filePath = path.join(uploadDir, (await params).filename);

  try {
    const file = await fs.readFile(filePath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
