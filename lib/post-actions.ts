"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import type { UIDraft } from "./types";

// Define type for drafts
type Draft = {
  id: string;
  caption: string;
  tags: string[];
  location: string;
  mentions: string[];
  mediaItems: MediaItem[];
  createdAt: string;
};

type MediaItem = {
  file: File;
  type: "image" | "video";
  preview: string;
  filters?: string[];
  edits?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    crop?: { x: number; y: number; width: number; height: number };
  };
};

/* -------------------------------------------------------------------------- */
/* createPost – now writes PostMedia rows                                     */
/* -------------------------------------------------------------------------- */
export async function createPost(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const content = formData.get("content")?.toString() ?? "";
    const postType = formData.get("postType")?.toString() ?? "post";
    const metadata = JSON.parse(formData.get("metadata")?.toString() ?? "{}");
    const so = metadata.shareOptions ?? {};
    const draftId = formData.get("draftId")?.toString() ?? null;

    /* -------- collect media info from the incoming FormData -------- */
    type MediaInput = {
      url: string;
      type: "image" | "video";
      filters?: any;
      edits?: any;
    };
    const mediaInputs: MediaInput[] = [];

    let i = 0;
    while (formData.get(`media_${i}`)) {
      mediaInputs.push({
        url: formData.get(`media_${i}`)!.toString(),
        type: (formData.get(`mediaType_${i}`)?.toString() ?? "image") as
          | "image"
          | "video",
        filters: formData.get(`filters_${i}`)
          ? JSON.parse(formData.get(`filters_${i}`)!.toString())
          : undefined,
        edits: formData.get(`edits_${i}`)
          ? JSON.parse(formData.get(`edits_${i}`)!.toString())
          : undefined,
      });
      i++;
    }

    /* ------------------------------ create post ----------------------------- */
    const post = await prisma.post.create({
      data: {
        content,
        authorId: session.user.id,
        tags: metadata.tags ? metadata.tags.join(",") : undefined,
        location: metadata.location || undefined,
        mentions: metadata.mentions ? metadata.mentions.join(",") : undefined,
        visibility: (so.visibility ?? "public").toUpperCase(),
        allowComments: so.allowComments ?? true,
        showLikes: so.showLikes ?? true,
        postType,
        // media field removed – stored in PostMedia
      },
      include: {
        author: true,
        _count: { select: { likes: true, comments: true } },
      },
    });

    /* ----------------------- create PostMedia rows -------------------------- */
    if (mediaInputs.length) {
      await prisma.postMedia.createMany({
        data: mediaInputs.map((m, index) => ({
          postId: post.id,
          index,
          url: m.url,
          type: m.type === "image" ? "IMAGE" : "VIDEO",
          filters: m.filters ?? undefined,
          edits: m.edits ?? undefined,
        })),
      });
    }

    /* ---------------------- delete draft if needed -------------------------- */
    if (draftId) {
      await prisma.draft.delete({ where: { id: draftId } }).catch(() => {});
    }

    revalidatePath("/");
    return { success: true, data: post };
  } catch (err) {
    console.error("Error creating post:", err);
    return { success: false, error: "Failed to create post" };
  }
}

export async function toggleLike(postId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if the user has already liked the post
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId,
        },
      },
    });

    let liked = false;

    if (existingLike) {
      // Unlike the post
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId,
          },
        },
      });
    } else {
      // Like the post
      await prisma.like.create({
        data: {
          userId: session.user.id,
          postId,
        },
      });
      liked = true;

      // Create notification if the user is not the post author
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });

      if (post && post.authorId !== session.user.id) {
        await prisma.notification.create({
          data: {
            type: "LIKE",
            content: "хареса вашата публикация",
            senderId: session.user.id,
            recipientId: post.authorId,
            targetId: postId, //  ←  връзка към самия обект
            targetType: "POST",
          },
        });
      }
    }

    revalidatePath(`/posts/${postId}`);
    return { success: true, data: { liked } };
  } catch (error) {
    console.error("Error toggling like:", error);
    return { success: false, error: "Failed to toggle like" };
  }
}

export async function deletePost(postId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if the user is the post author or an admin
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      return { success: false, error: "Post not found" };
    }

    if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return { success: false, error: "Not authorized to delete this post" };
    }

    // Delete the post and all related data (likes, comments, etc.)
    await prisma.post.delete({
      where: { id: postId },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
    return { success: false, error: "Failed to delete post" };
  }
}

export async function sharePost(postId: string, platform: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // In a real app, you would implement sharing to different platforms
    // For now, we'll just record the share action
    await prisma.share.create({
      data: {
        userId: session.user.id,
        postId,
        platform,
      },
    });

    // Create notification for post author
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (post && post.authorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: "SHARE",
          content: `сподели вашата публикация в ${platform}`,
          senderId: session.user.id,
          recipientId: post.authorId,
          targetId: postId,
          targetType: "POST",
        },
      });
    }

    revalidatePath(`/posts/${postId}`);
    return { success: true };
  } catch (error) {
    console.error("Error sharing post:", error);
    return { success: false, error: "Failed to share post" };
  }
}

export async function saveDraft(data: {
  caption: string;
  tags: string[];
  location: string;
  mentions: string[];
  mediaItems: MediaItem[];
  draftId?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const { caption, tags, location, mentions, mediaItems, draftId } = data;

    // Process media items
    const processedMediaItems = mediaItems.map((item) => ({
      type: item.type,
      preview: item.preview,
      filters: item.filters,
      edits: item.edits,
      // In a real app, you would upload the file to a storage service
      // For now, we'll just store the file name
      fileName: item.file.name,
      fileType: item.file.type,
      fileSize: item.file.size,
    }));

    if (draftId) {
      // Update existing draft
      await prisma.draft.update({
        where: { id: draftId },
        data: {
          caption,
          tags: tags.join(","),
          location,
          mentions: mentions.join(","),
          media: JSON.stringify(processedMediaItems),
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new draft
      await prisma.draft.create({
        data: {
          id: uuidv4(),
          userId: session.user.id,
          caption,
          tags: tags.join(","),
          location,
          mentions: mentions.join(","),
          media: JSON.stringify(processedMediaItems),
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving draft:", error);
    return { success: false, error: "Failed to save draft" };
  }
}

export async function deleteDraft(draftId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if the draft exists and belongs to the user
    const draft = await prisma.draft.findUnique({
      where: { id: draftId },
      select: { userId: true },
    });

    if (!draft) {
      return { success: false, error: "Draft not found" };
    }

    if (draft.userId !== session.user.id) {
      return { success: false, error: "Not authorized to delete this draft" };
    }

    // Delete the draft
    await prisma.draft.delete({
      where: { id: draftId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting draft:", error);
    return { success: false, error: "Failed to delete draft" };
  }
}

export async function getDrafts(): Promise<
  { success: true; data: UIDraft[] } | { success: false; error: string }
> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get all drafts for the user
    const drafts = await prisma.draft.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    // Process drafts to match the expected format
    const processedDrafts = drafts.map((draft) => {
      let mediaItems: MediaItem[] = [];

      try {
        const parsedMedia = JSON.parse(draft.media || "[]");
        mediaItems = parsedMedia.map((item: any) => ({
          file: new File([], item.fileName, { type: item.fileType }),
          type: item.type,
          preview: item.preview,
          filters: item.filters,
          edits: item.edits,
        }));
      } catch (e) {
        console.error("Error parsing media:", e);
      }

      return {
        id: draft.id,
        caption: draft.caption,
        tags: draft.tags ? draft.tags.split(",") : [],
        location: draft.location || "",
        mentions: draft.mentions ? draft.mentions.split(",") : [],
        mediaItems,
        createdAt: draft.createdAt.toISOString(),
      };
    });

    return { success: true, data: processedDrafts };
  } catch (error) {
    console.error("Error fetching drafts:", error);
    return { success: false, error: "Failed to fetch drafts" };
  }
}
