import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Paths that are always public (no session required).
const PUBLIC_PATHS = ["/", "/sign-in", "/sign-up", "/password-change"]

// Paths that require a signed-in, approved user.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/exposure",
  "/rates",
  "/requests",
  "/alerts",
  "/import",
  "/reports",
  "/settings",
  "/api/",
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get("hedgehint_session")?.value

  // Static assets and favicon
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next()
  }

  // Scheduler endpoint: protected by secret, not session (handled in route handler).
  if (pathname.startsWith("/api/scheduler")) {
    return NextResponse.next()
  }

  // Webhook endpoint: protected by signature/secret in route handler.
  if (pathname.startsWith("/api/webhook")) {
    return NextResponse.next()
  }

  const isPublic = PUBLIC_PATHS.includes(pathname)
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  if (isProtected && !session) {
    // API calls get 401; page calls get redirected to sign-in.
    if (pathname.startsWith("/api/")) {
      return new NextResponse(JSON.stringify({ error: "unauthenticated" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/sign-in"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  if (isPublic && session) {
    // Already signed in: send auth pages to dashboard, landing stays public (no redirect).
    if (pathname !== "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
}
