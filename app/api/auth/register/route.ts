import { hash } from "bcrypt"
import prisma from "@/lib/prisma"
import { userSchema } from "@/lib/validation"
import { badRequestResponse, errorResponse, successResponse } from "@/lib/api-utils"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validate input
    const result = userSchema.safeParse(body)
    if (!result.success) {
      return badRequestResponse(result.error.errors[0].message)
    }

    const { name, email, password } = result.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return errorResponse("User with this email already exists", 409)
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return successResponse(userWithoutPassword, undefined, 201)
  } catch (error) {
    console.error("Registration error:", error)
    return errorResponse("An error occurred during registration", 500)
  }
}
