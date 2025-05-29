"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Define validation schema
const updatePostSchema = z.object({
  content: z
    .string()
    .min(1, "Content is required")
    .max(2000, "Content is too long")
    .optional(),
  image: z.any().optional(),
  removeImage: z.string().optional(),
});

export async function updatePost(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const postId = formData.get("postId") as string;

    if (!postId) {
      return { success: false, error: "Post ID is required" };
    }

    // Check if the post exists and user is authorized
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      return { success: false, error: "Post not found" };
    }

    if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return { success: false, error: "Not authorized to update this post" };
    }

    // Extract and validate data
    const content = formData.get("content") as string;
    const imageFile = formData.get("image") as File | null;
    const removeImage = formData.get("removeImage") as string | null;

    // Validate at least one of content or image is provided
    if (!content && !imageFile) {
      return { success: false, error: "Post must have content or an image" };
    }

    // Prepare update data
    const updateData: any = {
      content,
    };

    // Handle image update
    if (imageFile && imageFile.size > 0) {
      // In a real app, you would upload the file to a storage service
      // For now, we'll use a placeholder URL
      updateData.image = `/placeholder.svg?height=600&width=800&text=Updated_Image`;
    } else if (removeImage === "true") {
      updateData.image = null;
    }

    // Update the post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: updateData,
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

    // Revalidate the post page and feed
    revalidatePath(`/posts/${postId}`);
    revalidatePath("/");

    return { success: true, data: updatedPost };
  } catch (error) {
    console.error("Error updating post:", error);
    return { success: false, error: "Failed to update post" };
  }
}
