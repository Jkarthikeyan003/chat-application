import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// JWT secret for verifying tokens
const JWT_SECRET = process.env.JWT_SECRET || "your-default-secret-key-change-this-in-production"

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === "/"

  // Get the token from the cookies
  const token = request.cookies.get("token")?.value || ""

  console.log(`Middleware: Path=${path}, HasToken=${!!token}, IsPublicPath=${isPublicPath}`)

  // Redirect logic
  if (isPublicPath && token) {
    // If user is on public path but has token, redirect to conversations
    console.log("Middleware: Redirecting authenticated user to conversations")
    return NextResponse.redirect(new URL("/conversations", request.url))
  }

  if (!isPublicPath && !token && !path.startsWith("/api")) {
    // If user is not on public path and has no token, redirect to login
    console.log("Middleware: Redirecting unauthenticated user to login")
    return NextResponse.redirect(new URL("/", request.url))
  }

  // For API routes that require authentication
  if (path.startsWith("/api/") && !path.startsWith("/api/auth/login") && !token) {
    // Return JSON response for API routes
    return NextResponse.json({ message: "Authentication required" }, { status: 401 })
  }

  return NextResponse.next()
}

// Configure the paths that should trigger this middleware
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api/auth/login (login API)
     * 2. /_next (Next.js internals)
     * 3. /static (public files)
     * 4. All files in the public folder
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
