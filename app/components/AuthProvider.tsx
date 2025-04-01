"use client" // This makes sure it runs on the client side

import type React from "react"

import { SessionProvider } from "next-auth/react"

export default function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode
  session: any
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}

