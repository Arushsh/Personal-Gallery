"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Trash2, X, Download } from "lucide-react";
import type { MediaResource } from "@/app/gallery/page";

interface HeroCarouselProps {
    items: MediaResource[];
    onItemClick: (item: MediaResource) => void;
    onDelete?: (item: MediaResource) => void;
    isUploader?: boolean;
}

export function HeroCarousel({ items, onItemClick, onDelete, isUploader }: HeroCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hovered, setHovered] = useState(false);
    const [lightbox, setLightbox] = useState<{ open: boolean; item: MediaResource | null }>({
        open: false,
        item: null,
    });
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    if (!items || items.length === 0) return null;

    const next = useCallback(() => setCurrentIndex(prev => (prev + 1) % items.length), [items.length]);
    const prev = useCallback(() => setCurrentIndex(prev => (prev - 1 + items.length) % items.length), [items.length]);

    // ── Auto-rotation: slow, pauses on hover or when lightbox is open ──
    useEffect(() => {
        if (hovered || lightbox.open || items.length <= 1) return;
        intervalRef.current = setInterval(next, 3000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [hovered, lightbox.open, next, items.length]);

    // Keyboard navigation for inline lightbox
    useEffect(() => {
        if (!lightbox.open || !lightbox.item) return;
        const idx = items.findIndex(m => m.public_id === lightbox.item!.public_id);
        function handle(e: KeyboardEvent) {
            if (e.key === "Escape") setLightbox({ open: false, item: null });
            if (e.key === "ArrowRight" && idx < items.length - 1) setLightbox({ open: true, item: items[idx + 1] });
            if (e.key === "ArrowLeft" && idx > 0) setLightbox({ open: true, item: items[idx - 1] });
        }
        window.addEventListener("keydown", handle);
        return () => window.removeEventListener("keydown", handle);
    }, [lightbox, items]);

    function openLightbox(item: MediaResource) {
        setLightbox({ open: true, item });
    }

    async function handleDelete(item: MediaResource) {
        if (!confirm("Delete this media permanently?")) return;
        onDelete?.(item);
        setLightbox({ open: false, item: null });
    }

    return (
        <>
            {/* ── Carousel ── */}
            <div
                className="relative w-full h-[50vh] min-h-[380px] md:h-[60vh] md:min-h-[500px] max-h-[600px] flex flex-col items-center justify-center overflow-hidden perspective-[1500px]"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <div className="relative w-full max-w-5xl h-full flex items-center justify-center transform-style-3d mt-4 md:mt-10">
                    <AnimatePresence initial={false}>
                        {items.map((item, idx) => {
                            const offset = idx - currentIndex;
                            const absoluteOffset = Math.abs(offset);
                            const isCenter = offset === 0;

                            if (absoluteOffset > 2 && absoluteOffset < items.length - 2) return null;

                            let visualOffset = offset;
                            if (offset > 2) visualOffset -= items.length;
                            if (offset < -2) visualOffset += items.length;

                            const zIndex = 10 - Math.abs(visualOffset);
                            const rotateY = visualOffset * -25;
                            const scale = 1 - Math.abs(visualOffset) * 0.2;
                            const x = visualOffset * 60;
                            const opacity = Math.max(1 - Math.abs(visualOffset) * 0.4, 0);

                            return (
                                <motion.div
                                    key={item.public_id}
                                    className="absolute w-[65vw] sm:w-[280px] md:w-[400px] aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer bg-[#111] border border-white/10 shadow-2xl group"
                                    initial={false}
                                    animate={{
                                        rotateY,
                                        scale,
                                        x: `${x}%`,
                                        z: -Math.abs(visualOffset) * 100,
                                        opacity,
                                        zIndex,
                                    }}
                                    transition={{ type: "tween", duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
                                    onClick={() => {
                                        if (isCenter) {
                                            openLightbox(item);
                                        } else {
                                            setCurrentIndex(idx);
                                        }
                                    }}
                                >
                                    {/* Media */}
                                    {item.resource_type === "video" ? (
                                        <video
                                            src={item.secure_url}
                                            muted
                                            loop
                                            className="w-full h-full object-cover"
                                            autoPlay={isCenter}
                                        />
                                    ) : (
                                        <img src={item.secure_url} alt="" className="w-full h-full object-cover" />
                                    )}

                                    {/* Side-card dim overlay */}
                                    {!isCenter && (
                                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
                                    )}

                                    {/* Center card — hover overlay with actions */}
                                    {isCenter && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 gap-2">
                                            <p className="text-white text-xs font-semibold opacity-70 uppercase tracking-widest">
                                                {item.resource_type === "video" ? "▶ Video" : "⊞ Photo"} · tap to view
                                            </p>
                                            {isUploader && onDelete && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); handleDelete(item); }}
                                                    className="self-start flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 px-3 py-1.5 rounded-full transition-all"
                                                >
                                                    <Trash2 size={12} /> Delete
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Video indicator */}
                                    {isCenter && item.resource_type === "video" && (
                                        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-full">
                                            <Play size={16} className="text-white ml-1" />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Controls */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 z-20">
                    <button
                        onClick={prev}
                        className="w-12 h-12 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    {/* Dots */}
                    <div className="flex gap-2">
                        {items.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentIndex(i)}
                                className={`h-2 rounded-full transition-all duration-300 ${i === currentIndex ? "w-8 bg-cyan-400 shadow-[0_0_10px_#00ddff]" : "w-2 bg-white/30 hover:bg-white/50"}`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={next}
                        className="w-12 h-12 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* Auto-rotate progress indicator */}
                {!hovered && items.length > 1 && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden z-20">
                        <motion.div
                            key={currentIndex}
                            className="h-full bg-gradient-to-r from-cyan-400 to-pink-500"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 3.0, ease: "linear" }}
                        />
                    </div>
                )}
            </div>

            {/* ── Inline Lightbox ── */}
            <AnimatePresence>
                {lightbox.open && lightbox.item && (
                    <motion.div
                        key="carousel-lightbox"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setLightbox({ open: false, item: null })}
                    >
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 320, damping: 28 }}
                            className="relative max-w-[90vw] max-h-[90vh] bg-zinc-950/80 border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setLightbox({ open: false, item: null })}
                                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                            >
                                <X size={16} />
                            </button>

                            {/* Media */}
                            {lightbox.item.resource_type === "video" ? (
                                <video
                                    src={lightbox.item.secure_url}
                                    controls
                                    autoPlay
                                    className="max-h-[78vh] max-w-full object-contain block rounded-xl m-2"
                                />
                            ) : (
                                <img
                                    src={lightbox.item.secure_url}
                                    alt=""
                                    className="max-h-[78vh] max-w-full object-contain block rounded-xl m-2"
                                />
                            )}

                            {/* Actions bar */}
                            <div className="flex items-center gap-3 px-4 py-3 bg-black/40 border-t border-white/5">
                                <a
                                    href={lightbox.item.secure_url}
                                    download
                                    className="flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white bg-white/8 hover:bg-white/15 border border-white/10 px-3 py-2 rounded-xl transition-all"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <Download size={13} /> Download
                                </a>
                                {isUploader && onDelete && (
                                    <button
                                        onClick={() => handleDelete(lightbox.item!)}
                                        className="flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-500/15 hover:bg-red-500/30 border border-red-500/25 px-3 py-2 rounded-xl transition-all"
                                    >
                                        <Trash2 size={13} /> Delete
                                    </button>
                                )}
                                <button
                                    onClick={() => setLightbox({ open: false, item: null })}
                                    className="ml-auto text-xs text-zinc-500 hover:text-white transition-colors"
                                >
                                    ✕ Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
