import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge-safe auth — uses auth.config.ts only (no Prisma/pg/bcrypt)
const { auth } = NextAuth(authConfig);

// Protect all application routes except /login and static assets
export default auth(async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Allow unauthenticated access to login, setup & static assets
  if (
    pathname === "/login" ||
    pathname === "/setup" ||
    pathname.startsWith("/auth/recovery") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    /\.(png|jpg|jpeg|gif|webp|svg|css|js|ico)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (!req.auth?.user) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Force password change if required
  if (req.auth.user.mustChangePassword) {
    // Whitelist the force-change page and API routes
    if (!pathname.startsWith("/auth/force-change") && !pathname.startsWith("/api/auth")) {
      const forceChangeUrl = new URL("/auth/force-change", req.url);
      return NextResponse.redirect(forceChangeUrl);
    }
  } else {
    // Prevent access to force-change if not required
    if (pathname.startsWith("/auth/force-change")) {
      const dashboardUrl = new URL("/", req.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Pass current path to layout for system status check
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-current-path", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
