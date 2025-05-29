import type React from "react"
import type { Viewport } from "next"
import { Inter } from "next/font/google"
import "../global.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider } from "@/components/ui/toast"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import AuthProvider from "@/components/AuthProvider"
import LeftSidebar from "@/components/LeftSidebar"
import MobileNavigation from "@/components/MobileNavigation"
import Header from "@/components/Header"

const inter = Inter({ subsets: ["latin"] })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider session={session}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
            <div className="flex min-h-screen">
              <LeftSidebar />
              <div className="flex-1 flex flex-col w-full">
                <Header />
                <main className="flex-1 w-full max-w-full overflow-hidden">
                  <div className="mx-auto w-full max-w-full px-0 md:px-4 pb-16 md:pb-0 [&.no-bottom-padding]:pb-0">
                    {children}
                  </div>
                </main>
                <MobileNavigation />
              </div>
            </div>
            <ToastProvider />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
