import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { findUser } from "@/lib/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const user = findUser(
                    credentials?.email as string,
                    credentials?.password as string
                );
                if (!user) return null;
                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
            }
            return token;
        },
        session({ session, token }) {
            if (session.user && token.role) {
                (session.user as any).role = token.role;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: { 
        strategy: "jwt",
        maxAge: 30 * 60, // 30 minutes
    },
    jwt: {
        maxAge: 30 * 60,
    },
    secret: process.env.NEXTAUTH_SECRET ?? "vault-gallery-secret-2024",
});
