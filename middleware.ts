import { auth } from "@/lib/nextauth";
import { NextResponse } from "next/server";

export default auth((req: any) => {
    const { pathname } = req.nextUrl;
    const session = req.auth;
    const role = session?.user?.role;

    // Public routes that don't need protection
    // Allow public assets
if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/models") || // if you later store models here
    pathname.endsWith(".glb") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".webp") ||
    pathname === "/favicon.ico" ||
    pathname === "/"
) {
    return NextResponse.next();
}

    if (!session && pathname !== "/login") {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    if (session && pathname === "/login") {
        return NextResponse.redirect(new URL("/gallery", req.url));
    }

    // Protect upload
    if (pathname.startsWith("/upload") && role !== "uploader") {
        return NextResponse.redirect(new URL("/gallery?error=unauthorized", req.url));
    }

    return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|glb)).*)",
  ],
};
