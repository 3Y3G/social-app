// lib/user-actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { sanitizeUser } from "@/lib/utils"
import { z } from "zod"
import { hash, compare } from "bcryptjs"

// Validation schemas
const profileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  occupation: z.string().optional(),
  image: z.string().optional(),
  coverImage: z.string().optional(),
})

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
})

// Update user profile
export async function updateProfile(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const payload = {
      name: formData.get("name") as string | undefined,
      bio: formData.get("bio") as string | undefined,
      location: formData.get("location") as string | undefined,
      occupation: formData.get("occupation") as string | undefined,
      image: formData.get("image") as string | undefined,
      coverImage: formData.get("coverImage") as string | undefined,
    }

    const result = profileUpdateSchema.safeParse(payload)
    if (!result.success) {
      return { success: false, error: result.error.errors[0].message }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: result.data,
    })

    const sanitizedUser = sanitizeUser(updatedUser)
    revalidatePath("/profile")

    return { success: true, data: sanitizedUser }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { success: false, error: "Failed to update profile" }
  }
}

// Update user password
export async function updatePassword(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string

    const result = passwordUpdateSchema.safeParse({ currentPassword, newPassword })
    if (!result.success) {
      return { success: false, error: result.error.errors[0].message }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || !user.password) {
      return { success: false, error: "No password set for this account" }
    }

    const isValid = await compare(currentPassword, user.password)
    if (!isValid) {
      return { success: false, error: "Current password is incorrect" }
    }

    const hashed = await hash(newPassword, 10)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed },
    })

    return { success: true, data: { message: "Password updated successfully" } }
  } catch (error) {
    console.error("Error updating password:", error)
    return { success: false, error: "Failed to update password" }
  }
}
