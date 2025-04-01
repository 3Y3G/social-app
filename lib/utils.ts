import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { User } from "@prisma/client"
import type { SafeUser } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)

  // If less than 24 hours ago, show relative time
  const now = new Date()
  const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 1) {
    const minutes = Math.floor(diffInHours * 60)
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours)
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`
  } else if (diffInHours < 48) {
    return "Yesterday"
  } else {
    // Otherwise show the date
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }
}

export function sanitizeUser(user: User): SafeUser {
  // Remove sensitive information like password
  const { password, ...safeUser } = user
  return safeUser as SafeUser
}

