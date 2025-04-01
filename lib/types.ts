import type { User, Post, Comment, Notification, SavedItem, Story } from "@prisma/client"

// Safe user type without sensitive information
export type SafeUser = Omit<User, "password">

// Post with author information
export type PostWithAuthor = Post & {
  author: SafeUser
  _count: {
    likes: number
    comments: number
  }
}

// Comment with author information
export type CommentWithAuthor = Comment & {
  author: SafeUser
}

// Notification with sender information
export type NotificationWithSender = Notification & {
  sender: SafeUser | null
}

// Saved item with post information
export type SavedItemWithPost = SavedItem & {
  post: PostWithAuthor | null
}

// Story with author information
export type StoryWithAuthor = Story & {
  author: SafeUser
}

