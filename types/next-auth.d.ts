// types/next-auth.d.ts
import NextAuth from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            role: string
            id: string
            name?: string | null
            email?: string | null
            image?: string | null
        }
    }

    interface User {
        id: string
    }
}

declare module "next-auth" {
    interface Session extends DefaultSession {
        user: {
            /** The user's unique ID */
            id: string
            /** Their role from the database */
            role: string
        } & DefaultSession["user"]
    }

    interface User {
        /** We store this in your Prisma User model */
        role: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: string
    }
}