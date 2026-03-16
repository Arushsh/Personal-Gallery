"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, Video, LogOut, Upload, Trash2, Download, LayoutGrid, Sparkles, Clock, ChevronDown } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { IntroCard } from "@/components/IntroCard";
import { HeroCarousel } from "@/components/HeroCarousel";

export interface MediaResource {
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

function formatDate(dateStr: string) {
    try {
        return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
        return "";
    }
}

export default function GalleryPage() {
    const { data: session } = useSession();
    const isUploader = (session?.user as any)?.role === "uploader";

    const [media, setMedia] = useState<MediaResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "image" | "video">("all");
    const [lightbox, setLightbox] = useState<LightboxState>({ open: false, item: null });
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
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
    }, [lightbox, media, filter]);

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
    const imageCount = media.filter(m => m.resource_type === "image").length;
    const videoCount = media.filter(m => m.resource_type === "video").length;

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

            {/* Main Gallery Content */}
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
                                /* ─── Skeleton Loading ─── */
                                <div className="space-y-12">
                                    <div className="flex items-center justify-center gap-6 py-6">
                                        {[1,2,3].map(i => (
                                            <div key={i} className="vault-skeleton h-20 w-36 rounded-2xl" />
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-center min-h-[50vh]">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-14 h-14 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
                                            <p className="text-zinc-500 text-sm tracking-widest uppercase animate-pulse">Loading Vault…</p>
                                        </div>
                                    </div>
                                </div>
                            ) : filtered.length === 0 ? (
                                /* ─── Empty State ─── */
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-6"
                                >
                                    <div className="relative">
                                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center text-5xl shadow-[0_0_60px_rgba(0,221,255,0.15)]">
                                            📷
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center">
                                            <Sparkles size={16} className="text-cyan-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-4xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
                                            The Vault is Empty
                                        </h2>
                                        <p className="text-zinc-400 text-base mb-2 max-w-sm mx-auto leading-relaxed">
                                            No memories have been sealed here yet.
                                            {filter !== "all" && <span className="text-zinc-500"> Try switching the filter above.</span>}
                                        </p>
                                    </div>
                                    {isUploader && (
                                        <Link href="/upload" className="vault-btn-primary px-10 py-4 text-base mt-2">
                                            <Upload size={18} /> Upload your first memory
                                        </Link>
                                    )}
                                </motion.div>
                            ) : (
                                <>
                                    {/* ─── Stats Bar ─── */}
                                    <motion.div
                                        initial={{ opacity: 0, y: -16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5 }}
                                        className="vault-stats-bar mb-10"
                                    >
                                        <div className="vault-stat-item">
                                            <LayoutGrid size={16} className="text-white/50 shrink-0" />
                                            <span className="vault-stat-num">{media.length}</span>
                                            <span className="vault-stat-label">Total</span>
                                        </div>
                                        <div className="vault-stat-divider" />
                                        <div className="vault-stat-item">
                                            <ImageIcon size={16} className="text-cyan-400 shrink-0" />
                                            <span className="vault-stat-num text-cyan-400">{imageCount}</span>
                                            <span className="vault-stat-label">Photos</span>
                                        </div>
                                        <div className="vault-stat-divider" />
                                        <div className="vault-stat-item">
                                            <Video size={16} className="text-purple-400 shrink-0" />
                                            <span className="vault-stat-num text-purple-400">{videoCount}</span>
                                            <span className="vault-stat-label">Videos</span>
                                        </div>
                                        {filter !== "all" && (
                                            <>
                                                <div className="vault-stat-divider" />
                                                <div className="vault-stat-item">
                                                    <span className="text-xs text-zinc-400 font-medium">
                                                        Showing <span className="text-white font-bold">{filtered.length}</span> {filter}s
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>

                                    {/* ─── Hero Carousel — UNTOUCHED ─── */}
                                    {carouselItems.length > 0 && (
                                        <div className="mb-20">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Sparkles size={14} className="text-cyan-400" />
                                                <h2 className="text-cyan-400 font-bold uppercase tracking-[0.3em] text-xs">Featured</h2>
                                                <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/30 to-transparent" />
                                            </div>
                                            <HeroCarousel
                                                items={carouselItems}
                                                onItemClick={(item) => setLightbox({ open: true, item })}
                                                onDelete={handleDelete}
                                                isUploader={isUploader}
                                            />
                                        </div>
                                    )}

                                    {/* ─── Archive Grid ─── */}
                                    {gridItems.length > 0 && (
                                        <div>
                                            {/* Section header */}
                                            <div className="vault-section-header mb-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="vault-section-icon">
                                                        <LayoutGrid size={15} />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-xl font-black text-white tracking-tight">Archive</h2>
                                                        <p className="text-zinc-500 text-xs font-mono">{filtered.length} memories sealed</p>
                                                    </div>
                                                </div>
                                                <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-600">
                                                    <Clock size={12} />
                                                    <span>Newest first</span>
                                                </div>
                                            </div>

                                            {/* Masonry grid */}
                                            <motion.div
                                                className="vault-masonry"
                                                initial="hidden"
                                                animate="show"
                                                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
                                            >
                                                {gridItems.map((item) => (
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
                                                            {/* Top: type badge */}
                                                            <span className={`vault-type-badge shadow-lg backdrop-blur-md ${item.resource_type === "video" ? "badge-video" : "badge-photo"}`}>
                                                                {item.resource_type === "video" ? <Video size={12} /> : <ImageIcon size={12} />}
                                                                {item.resource_type}
                                                            </span>

                                                            <div className="mt-auto space-y-2">
                                                                {/* Date */}
                                                                {item.created_at && (
                                                                    <p className="text-white/60 text-xs flex items-center gap-1">
                                                                        <Clock size={10} />
                                                                        {formatDate(item.created_at)}
                                                                    </p>
                                                                )}
                                                                {/* Actions */}
                                                                <div className="flex gap-2">
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
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </motion.div>

                                            {/* Load more / End of vault */}
                                            {nextCursor ? (
                                                <div className="text-center mt-16 pb-10">
                                                    <button
                                                        onClick={loadMore}
                                                        disabled={loadingMore}
                                                        className="vault-load-more-btn"
                                                    >
                                                        {loadingMore ? (
                                                            <span className="flex items-center gap-2">
                                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                Loading from Vault…
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-2">
                                                                <ChevronDown size={16} />
                                                                Load Older Media
                                                            </span>
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                /* End of vault section */
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.3, duration: 0.8 }}
                                                    className="vault-end-section"
                                                >
                                                    <div className="vault-end-line" />
                                                    <div className="vault-end-content">
                                                        <div className="vault-end-emblem">⬡</div>
                                                        <p className="vault-end-title">End of Vault</p>
                                                        <p className="vault-end-sub">
                                                            {filtered.length} {filter === "all" ? "memories" : filter + "s"} — all sealed
                                                        </p>
                                                        {isUploader && (
                                                            <Link href="/upload" className="vault-btn-sm mt-4 border-white/10">
                                                                <Upload size={13} /> Add more memories
                                                            </Link>
                                                        )}
                                                    </div>
                                                    <div className="vault-end-line" />
                                                </motion.div>
                                            )}
                                        </div>
                                    )}

                                    {/* When there are only carousel items and no grid items */}
                                    {carouselItems.length > 0 && gridItems.length === 0 && !nextCursor && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4, duration: 0.8 }}
                                            className="vault-end-section"
                                        >
                                            <div className="vault-end-line" />
                                            <div className="vault-end-content">
                                                <div className="vault-end-emblem">⬡</div>
                                                <p className="vault-end-title">End of Vault</p>
                                                <p className="vault-end-sub">
                                                    {filtered.length} {filter === "all" ? "memories" : filter + "s"} — all sealed
                                                </p>
                                                {isUploader && (
                                                    <Link href="/upload" className="vault-btn-sm mt-4 border-white/10">
                                                        <Upload size={13} /> Add more memories
                                                    </Link>
                                                )}
                                            </div>
                                            <div className="vault-end-line" />
                                        </motion.div>
                                    )}
                                </>
                            )}
                        </main>

                        {/* ─── Page Footer ─── */}
                        <footer className="vault-page-footer">
                            <div className="max-w-[1400px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
                                <span className="text-zinc-700 text-xs font-mono">⬡ Vault Gallery</span>
                                <span className="text-zinc-700 text-xs">
                                    {new Date().getFullYear()} · Made with <span className="text-pink-600">♥</span> by Arush
                                </span>
                            </div>
                        </footer>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Lightbox ─── */}
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
                                {lightbox.item.created_at && (
                                    <span className="text-zinc-500 text-xs flex items-center gap-1 mr-auto">
                                        <Clock size={11} /> {formatDate(lightbox.item.created_at)}
                                    </span>
                                )}
                                <a href={lightbox.item.secure_url} download className="vault-btn-sm !bg-white/10 hover:!bg-white/20">
                                    <Download size={14} /> Download
                                </a>
                                {isUploader && (
                                    <button onClick={() => handleDelete(lightbox.item!)} className="vault-btn-sm danger !bg-red-500/20 hover:!bg-red-500/30">
                                        <Trash2 size={14} /> Delete
                                    </button>
                                )}
                                <button onClick={() => setLightbox({ open: false, item: null })} className="vault-btn-ghost ml-auto !font-bold hover:text-pink-400">
                                    ✕ Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
