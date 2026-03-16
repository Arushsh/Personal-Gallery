import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible NextAuth config.
 * MUST NOT import mongoose, bcrypt, or any Node.js-only module
 * because this file is used in middleware (Edge Runtime).
 */
export const authConfig: NextAuthConfig = {
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 60,
    },
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                token.role = (user as any).role;
            }
            return token;
        },
        session({ session, token }) {
            if (session.user && token.role) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (session.user as any).role = token.role;
            }
            return session;
        },
    },
    providers: [], // Providers added in nextauth.ts (Node.js runtime only)
};
