import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

// Use ONLY the edge-safe config here — no mongoose, no bcrypt
const { auth } = NextAuth(authConfig);

export default auth((req: any) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;

  // Allow landing page and login without auth
  if (!session && pathname !== "/login" && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Already logged in → redirect away from login
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/gallery", req.url));
  }

  // Viewers cannot access upload
  if (pathname.startsWith("/upload") && role !== "uploader") {
    return NextResponse.redirect(new URL("/gallery?error=unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif|glb)).*)",
  ],
};