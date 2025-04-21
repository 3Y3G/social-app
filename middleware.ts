import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuthenticated = !!token

  // Define protected routes
  const protectedRoutes = [
    "/profile",
    "/settings",
    "/messages",
    "/notifications",
    "/friends",
    "/saved",
    "/posts/[^/]+/edit", // Add the edit post route pattern
  ]

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => {
    if (route.includes("[^/]+")) {
      // Handle regex pattern for dynamic routes
      const pattern = new RegExp(route.replace("[^/]+", "[^/]+"))
      return pattern.test(request.nextUrl.pathname)
    }
    return request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`)
  })

  // Redirect to login if accessing a protected route without authentication
  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirect to home if accessing auth pages while authenticated
  if ((request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register") && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    "/profile/:path*",
    "/settings/:path*",
    "/messages/:path*",
    "/notifications/:path*",
    "/friends/:path*",
    "/saved/:path*",
    "/posts/:path*/edit",
    "/login",
    "/register",
  ],
}
