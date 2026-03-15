"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, Video, Filter, LogOut, Upload, Trash2, Download } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IntroCard } from "@/components/IntroCard";
import { HeroCarousel } from "@/components/HeroCarousel";

interface MediaResource {
    public_id: string;
    secure_url: string;
    resource_type: "image" | "video";
    width: number;
    height: number;
    format: string;
    created_at: string;
}

interface LightboxState {
    open: boolean;
    item: MediaResource | null;
}

export default function GalleryPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const isUploader = (session?.user as any)?.role === "uploader";

    const [media, setMedia] = useState<MediaResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "image" | "video">("all");
    const [lightbox, setLightbox] = useState<LightboxState>({ open: false, item: null });
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    
    // UI State: locked (Intro), or revealed (Gallery)
    const [isRevealed, setIsRevealed] = useState(false);

    async function fetchMedia(type: string, cursor?: string) {
        const params = new URLSearchParams();
        if (type !== "all") params.set("type", type);
        if (cursor) params.set("next_cursor", cursor);
        const res = await fetch(`/api/media?${params}`);
        return res.json();
    }

    useEffect(() => {
        setLoading(true);
        setMedia([]);
        setNextCursor(null);
        fetchMedia(filter).then(data => {
            setMedia(data.resources ?? []);
            setNextCursor(data.next_cursor ?? null);
            setLoading(false);
        });
    }, [filter]);

    // Keyboard lightbox nav
    useEffect(() => {
        if (!lightbox.open) return;
        const visible = getFiltered();
        const idx = visible.findIndex(m => m.public_id === lightbox.item?.public_id);
        function handle(e: KeyboardEvent) {
            if (e.key === "Escape") setLightbox({ open: false, item: null });
            if (e.key === "ArrowRight" && idx < visible.length - 1) setLightbox({ open: true, item: visible[idx + 1] });
            if (e.key === "ArrowLeft" && idx > 0) setLightbox({ open: true, item: visible[idx - 1] });
        }
        window.addEventListener("keydown", handle);
        return () => window.removeEventListener("keydown", handle);
    }, [lightbox, media, filter]); // added deps to ensure latest state

    function getFiltered() {
        if (filter === "all") return media;
        return media.filter(m => m.resource_type === filter);
    }

    async function handleDelete(item: MediaResource) {
        if (!confirm("Delete this media permanently?")) return;
        await fetch(`/api/media/${encodeURIComponent(item.public_id)}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resource_type: item.resource_type }),
        });
        setMedia(prev => prev.filter(m => m.public_id !== item.public_id));
        if (lightbox.item?.public_id === item.public_id) setLightbox({ open: false, item: null });
    }

    async function loadMore() {
        if (!nextCursor || loadingMore) return;
        setLoadingMore(true);
        const data = await fetchMedia(filter, nextCursor);
        setMedia(prev => [...prev, ...(data.resources ?? [])]);
        setNextCursor(data.next_cursor ?? null);
        setLoadingMore(false);
    }

    const filtered = getFiltered();
    
    // Split media for Carousel vs Grid
    const carouselItems = filtered.slice(0, 5);
    const gridItems = filtered.slice(5);

    return (
        <div className="vault-bg min-h-screen">
            <AnimatePresence>
                {!isRevealed && <IntroCard key="intro" onReveal={() => setIsRevealed(true)} />}
            </AnimatePresence>

            {/* Ambient blobs */}
            <div className="vault-blob vault-blob-1" />
            <div className="vault-blob vault-blob-2" />

            {/* Main Gallery Content — animates in only after reveal */}
            <AnimatePresence>
                {isRevealed && (
                    <motion.div
                        key="gallery"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    >
                        {/* Navbar */}
                        <nav className="sticky top-0 z-40 vault-nav">
                            <div className="max-w-[1400px] mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
                                <div className="flex items-center gap-3">
                                    <Link href="/" className="text-white font-black text-xl tracking-tight hover:text-cyan-400 transition-colors">
                                        ⬡ Vault Gallery
                                    </Link>
                                    <span className={`vault-role-badge tracking-widest ${isUploader ? "badge-uploader" : "badge-viewer"}`}>
                                        {isUploader ? "Uploader" : "Viewer"}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 sm:gap-4 w-full md:w-auto">
                                    {/* Filters inside Navbar for cleaner look */}
                                    <div className="flex items-center space-x-2 bg-white/5 rounded-full p-1.5 border border-white/10 shrink-0 overflow-x-auto">
                                        {(["all", "image", "video"] as const).map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setFilter(f)}
                                                className={`px-4 sm:px-5 py-1.5 mx-0.5 rounded-full text-xs font-bold transition-all shrink-0 whitespace-nowrap ${filter === f ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(0,221,255,0.2)]" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
                                            >
                                                {f.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>

                                    {isUploader && (
                                        <Link href="/upload" className="vault-btn-sm bg-gradient-to-r from-pink-500 to-purple-500 border-none text-white shadow-lg shadow-pink-500/20">
                                            <Upload size={14} /> Upload
                                        </Link>
                                    )}
                                    <button onClick={() => signOut({ callbackUrl: "/" })} className="vault-btn-ghost hover:bg-white/5 rounded-full">
                                        <LogOut size={14} /> Sign out
                                    </button>
                                </div>
                            </div>
                        </nav>

                        <main className="max-w-[1400px] mx-auto px-6 py-8">
                            
                            {loading ? (
                                <div className="flex items-center justify-center min-h-[50vh]">
                                    <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                                </div>
                            ) : filtered.length === 0 ? (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                                    <div className="text-6xl mb-6 bg-gradient-to-br from-cyan-400 to-pink-500 rounded-full w-24 h-24 flex items-center justify-center shadow-[0_0_40px_rgba(255,0,85,0.3)]">
                                        📷
                                    </div>
                                    <h2 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">The Vault is Empty</h2>
                                    <p className="text-zinc-400 text-lg mb-8 max-w-sm">There are no memories here yet. Switch to the uploader role to add some.</p>
                                    {isUploader && (
                                        <Link href="/upload" className="vault-btn-primary px-8 py-4 text-lg">Upload your first file</Link>
                                    )}
                                </motion.div>
                            ) : (
                                <>
                                    {/* 3D Hero Carousel for top items */}
                                    {carouselItems.length > 0 && (
                                        <div className="mb-20">
                                            <div className="text-center mb-6">
                                                <h2 className="text-cyan-400 font-bold uppercase tracking-[0.3em] text-xs">Featured</h2>
                                            </div>
                                            <HeroCarousel items={carouselItems} onItemClick={(item) => setLightbox({ open: true, item })} />
                                        </div>
                                    )}

                                    {/* Advanced Masonry Grid for remaining items */}
                                    {gridItems.length > 0 && (
                                        <div>
                                            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                                                <h2 className="text-2xl font-black">Archive</h2>
                                                <p className="text-zinc-500 font-mono text-sm">{filtered.length} total items</p>
                                            </div>
                                            
                                            <motion.div
                                                className="vault-masonry"
                                                initial="hidden"
                                                animate="show"
                                                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
                                            >
                                                {gridItems.map((item, i) => (
                                                    <motion.div
                                                        key={item.public_id}
                                                        variants={{
                                                            hidden: { opacity: 0, y: 50, scale: 0.9 },
                                                            show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
                                                        }}
                                                        className="vault-card group"
                                                        onClick={() => setLightbox({ open: true, item })}
                                                    >
                                                        {item.resource_type === "video" ? (
                                                            <video
                                                                src={item.secure_url}
                                                                className="vault-card-media"
                                                                muted
                                                                loop
                                                                onMouseEnter={e => (e.target as HTMLVideoElement).play()}
                                                                onMouseLeave={e => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }}
                                                            />
                                                        ) : (
                                                            <img src={item.secure_url} alt="" className="vault-card-media" loading="lazy" />
                                                        )}
                                                        <div className="vault-card-overlay">
                                                            <span className={`vault-type-badge shadow-lg backdrop-blur-md ${item.resource_type === "video" ? "badge-video" : "badge-photo"}`}>
                                                                {item.resource_type === "video" ? <Video size={12} /> : <ImageIcon size={12} />}
                                                                {item.resource_type}
                                                            </span>
                                                            <div className="flex gap-2 mt-auto">
                                                                <a
                                                                    href={item.secure_url}
                                                                    download
                                                                    onClick={e => e.stopPropagation()}
                                                                    className="vault-icon-btn shadow-lg"
                                                                    title="Download"
                                                                >
                                                                    <Download size={14} />
                                                                </a>
                                                                {isUploader && (
                                                                    <button
                                                                        onClick={e => { e.stopPropagation(); handleDelete(item); }}
                                                                        className="vault-icon-btn danger shadow-lg"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </motion.div>

                                            {nextCursor && (
                                                <div className="text-center mt-16 pb-10">
                                                    <button onClick={loadMore} disabled={loadingMore} className="border border-white/20 bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                                                        {loadingMore ? "Loading from Vault..." : "Load Older Media"}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </main>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Lightbox */}
            <AnimatePresence>
                {lightbox.open && lightbox.item && (
                    <motion.div
                        key="lightbox"
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        transition={{ duration: 0.3 }}
                        className="vault-lightbox"
                        onClick={() => setLightbox({ open: false, item: null })}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="vault-lightbox-inner shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 bg-black/60"
                            onClick={e => e.stopPropagation()}
                        >
                            {lightbox.item.resource_type === "video" ? (
                                <video src={lightbox.item.secure_url} controls autoPlay className="vault-lightbox-media" />
                            ) : (
                                <img src={lightbox.item.secure_url} alt="" className="vault-lightbox-media" />
                            )}
                            <div className="vault-lightbox-actions bg-black/40 p-3 mt-2 rounded-xl backdrop-blur-md">
                                <a href={lightbox.item.secure_url} download className="vault-btn-sm !bg-white/10 hover:!bg-white/20">
                                    <Download size={14} /> Download File
                                </a>
                                {isUploader && (
                                    <button onClick={() => handleDelete(lightbox.item!)} className="vault-btn-sm danger !bg-red-500/20 hover:!bg-red-500/30">
                                        <Trash2 size={14} /> Delete
                                    </button>
                                )}
                                <button onClick={() => setLightbox({ open: false, item: null })} className="vault-btn-ghost ml-auto !font-bold hover:text-pink-400">
                                    ✕ Close Viewer
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
