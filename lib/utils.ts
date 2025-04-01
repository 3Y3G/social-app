import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import type { User } from "@prisma/client"

export function formatDate(date: string | Date): string {
  const inputDate = typeof date === "string" ? new Date(date) : date
  return inputDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function sanitizeUser(user: User): Omit<User, "password"> {
  const { password, ...safeUser } = user
  return safeUser
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

