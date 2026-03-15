"use client";
export const dynamic = "force-dynamic";
import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { Suspense } from "react";





export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-white text-center p-10">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
function LoginForm() {
    const router = useRouter();
    const params = useSearchParams();
    const from = params.get("from") ?? "gallery";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        const res = await signIn("credentials", {
            email, password, redirect: false,
        });
        setLoading(false);
        if (res?.error) {
            setError("Invalid credentials. Please try again.");
        } else {
            router.push(`/${from}`);
        }
    }

    return (
        <main className="vault-login-bg min-h-screen flex items-center justify-center p-4">
            {/* Ambient blobs */}
            <div className="vault-blob vault-blob-1" />
            <div className="vault-blob vault-blob-2" />

            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="vault-glass w-full max-w-md"
            >
                {/* Logo */}
                <div className="flex flex-col items-center mb-10">
                    <div className="vault-logo-ring mb-4">
                        <Lock size={28} className="text-cyan-400" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white">Vault Gallery</h1>
                    <p className="text-zinc-400 text-sm mt-1">Sign in to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div className="vault-field-wrap">
                        <Mail size={16} className="vault-field-icon" />
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="vault-input"
                        />
                    </div>

                    {/* Password */}
                    <div className="vault-field-wrap">
                        <Lock size={16} className="vault-field-icon" />
                        <input
                            type={showPw ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="vault-input pr-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPw(p => !p)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                        >
                            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-400 text-sm text-center bg-red-950/40 border border-red-800/40 rounded-xl py-2 px-4"
                        >
                            {error}
                        </motion.p>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="vault-btn-primary w-full"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 size={18} className="animate-spin" /> Signing in...
                            </span>
                        ) : "Sign In"}
                    </motion.button>
                </form>

                {/* Hint */}
                <div className="mt-8 space-y-2 border-t border-white/5 pt-6">
                    <p className="text-xs text-zinc-600 text-center">Demo credentials:</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => { setEmail("mishrajii@gmail.com"); setPassword("Shivangi@123"); }}
                            className="vault-hint-btn"
                        >
                            <span className="text-cyan-500 font-bold">Viewer</span>
                            <span className="text-zinc-500 text-xs">Browse gallery</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setEmail("varush395@gmail.com"); setPassword("Arush@123"); }}
                            className="vault-hint-btn"
                        >
                            <span className="text-pink-500 font-bold">Uploader</span>
                            <span className="text-zinc-500 text-xs">Upload media</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </main>
    );
}
