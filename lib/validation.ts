import { z } from "zod";

// User validation schemas
export const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  location: z
    .string()
    .max(100, "Location must be less than 100 characters")
    .optional(),
  occupation: z
    .string()
    .max(100, "Occupation must be less than 100 characters")
    .optional(),
  image: z.string().url("Invalid image URL").optional(),
  coverImage: z.string().url("Invalid cover image URL").optional(),
});

// Post validation schemas
export const postSchema = z.object({
  content: z
    .string()
    .min(1, "Post content is required")
    .max(2000, "Post content is too long"),
  mediaUrl: z.string().url("Invalid media URL").optional(),
  mediaType: z.string().optional(),
  location: z
    .string()
    .max(100, "Location must be less than 100 characters")
    .optional(),
});

// Comment validation schemas
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment content is required")
    .max(500, "Comment content is too long"),
});

// Message validation schemas
export const messageSchema = z.object({
  content: z.string().max(2000, "Message content is too long"),
  mediaUrl: z.string().url("Invalid media URL").optional(),
  mediaType: z.string().optional(),
});

// Conversation validation schemas
export const conversationSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required"),
});

// Friend request validation schemas
export const friendRequestSchema = z.object({
  recipientId: z.string().min(1, "Recipient ID is required"),
});

export const groupConversationSchema = z.object({
  participantIds: z
    .array(z.string().min(1, "Participant ID is required"))
    .min(1, "At least one participant is required")
    .max(50, "Too many participants"),
  groupName: z
    .string()
    .min(1, "Group name is required")
    .max(100, "Group name is too long"),
  groupDescription: z
    .string()
    .max(500, "Group description is too long")
    .optional(),
});
