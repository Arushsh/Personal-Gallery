import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { findUser } from "@/lib/auth";
import { authConfig } from "@/lib/auth.config";

// Full NextAuth config — runs in Node.js runtime (API route).
// Safe to import mongoose, bcrypt, etc. here.
export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const user = await findUser(
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
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "vault-gallery-secret-2024",
});
