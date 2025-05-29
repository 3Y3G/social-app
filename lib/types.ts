import type {
  User,
  Post,
  Comment,
  Notification,
  SavedItem,
  Story,
  PostMedia,
} from "@prisma/client";

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
// Safe user type without sensitive information
export type SafeUser = Omit<User, "password">;

// Post with author information
export type PostWithAuthor = Post & {
  author: SafeUser;
  PostMedia: PostMedia[];
  _count: {
    likes: number;
    comments: number;
  };
};

// Comment with author information
export type CommentWithAuthor = Comment & {
  author: SafeUser;
};

// Notification with sender information
export type NotificationWithSender = Notification & {
  sender: SafeUser | null;
};

// Saved item with post information
export type SavedItemWithPost = SavedItem & {
  post: PostWithAuthor | null;
};

// Story with author information
export type StoryWithAuthor = Story & {
  author: SafeUser;
};

export type UIDraft = {
  id: string;
  caption: string | null;
  tags: string[];
  location: string;
  mentions: string[];
  mediaItems: MediaItem[];
  createdAt: string;
};
