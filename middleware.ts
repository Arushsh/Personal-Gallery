import { auth } from "@/lib/nextauth";
import { NextResponse } from "next/server";

export default auth((req: any) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;

  if (!session && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/gallery", req.url));
  }

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