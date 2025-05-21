import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Check if the user is authenticated
    const isAuthenticated = !!session
    const isAuthPage = req.nextUrl.pathname === "/" || req.nextUrl.pathname === "/register"

    // If the user is on an auth page but is already authenticated, redirect to dashboard
    if (isAuthPage && isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // If the user is not authenticated and not on an auth page, redirect to login
    if (!isAuthPage && !isAuthenticated) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)

    // אם יש שגיאה, אפשר גישה לדפי האימות
    const isAuthPage = req.nextUrl.pathname === "/" || req.nextUrl.pathname === "/register"

    if (isAuthPage) {
      return res
    }

    // אם לא בדף אימות, הפנה לדף הכניסה
    return NextResponse.redirect(new URL("/", req.url))
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    "/",
    "/register",
    "/dashboard",
    "/chat",
    "/shelters",
    "/equipment",
    "/chat-history",
    "/favorite-shelters",
    "/equipment-lists",
    "/profile",
  ],
}
