import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

import { SESSION_COOKIE_NAME, SESSION_ALG } from "@/lib/auth/config";

/* ============================================
   Middleware
   - Sets security headers on all responses
   - Protects /dashboard (redirects to /login)
   - Prevents authenticated users from /login
   ============================================ */

/** Routes that require authentication. */
const PROTECTED_PREFIXES = ["/dashboard"];

/** Routes blocked for authenticated users. */
const AUTH_ROUTES = ["/login"];

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is required");
  }
  return new TextEncoder().encode(secret);
}

async function verifySession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    await jwtVerify(token, getSecret(), { algorithms: [SESSION_ALG] });
    return true;
  } catch {
    return false;
  }
}

/** Apply security headers to any response (including redirects). */
function setSecurityHeaders(response: NextResponse): void {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set("X-DNS-Prefetch-Control", "on");

  // HSTS — production only
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Content-Security-Policy
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = PROTECTED_PREFIXES.some((p) =>
    pathname.startsWith(p)
  );
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname === p);

  // Only verify session for routes that need auth checks
  if (isProtectedRoute || isAuthRoute) {
    const isAuthenticated = await verifySession(request);

    // Unauthenticated → redirect to login
    if (isProtectedRoute && !isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const redirect = NextResponse.redirect(loginUrl);
      setSecurityHeaders(redirect);
      return redirect;
    }

    // Authenticated → redirect away from login
    if (isAuthRoute && isAuthenticated) {
      const dashboardUrl = new URL("/dashboard", request.url);
      const redirect = NextResponse.redirect(dashboardUrl);
      setSecurityHeaders(redirect);
      return redirect;
    }
  }

  const response = NextResponse.next();
  setSecurityHeaders(response);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo|icons|images).*)",
  ],
};
