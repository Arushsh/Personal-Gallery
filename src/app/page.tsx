import Link from "next/link";
import { ThreeDScene } from '@/components/ThreeDScene';
import { auth } from "@/lib/nextauth";
import { LogIn, Image as ImageIcon, Upload } from "lucide-react";

export default async function Home() {
    const session = await auth();
    const role = (session?.user as any)?.role;

    return (
        <main className="bg-zinc-950 min-h-screen text-white overflow-hidden m-0 p-0 relative">
            {/* 3D Canvas */}
            <ThreeDScene />

            {/* CTA overlay — bottom center */}
            <div className="absolute bottom-10 left-0 right-0 z-20 flex flex-col items-center gap-4 px-4">
                {!session ? (
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 justify-center">
                        <Link
                            href="/login?from=gallery"
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-8 py-4 sm:py-3.5 rounded-full font-bold hover:scale-105 transition-transform shadow-[0_0_30px_rgba(0,221,255,0.4)] w-full sm:w-auto shrink-0"
                        >
                            <LogIn size={18} className="shrink-0" /> <span className="whitespace-nowrap pr-2">Login as Viewer</span>
                        </Link>
                        <Link
                            href="/login?from=upload"
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 sm:py-3.5 rounded-full font-bold hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,0,85,0.4)] w-full sm:w-auto shrink-0"
                        >
                            <Upload size={18} className="shrink-0" /> <span className="whitespace-nowrap pr-2">Login as Uploader</span>
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <p className="text-zinc-400 text-sm font-medium tracking-wide">
                            Logged in as <span className={role === "uploader" ? "text-pink-400" : "text-cyan-400"}>{role.toUpperCase()}</span>
                        </p>
                        <div className="flex gap-4">
                            <Link
                                href="/gallery"
                                className="group flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-3 rounded-full font-bold hover:bg-white/20 transition-all hover:scale-105"
                            >
                                <span className="w-2 h-2 rounded-full bg-cyan-400 group-hover:animate-ping" />
                                Enter Gallery
                            </Link>
                            {role === "uploader" && (
                                <Link
                                    href="/upload"
                                    className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,0,85,0.4)]"
                                >
                                    <Upload size={18} /> Upload Media
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}