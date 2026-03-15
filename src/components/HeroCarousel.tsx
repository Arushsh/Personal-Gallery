"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { MediaResource } from "@/app/gallery/page"

// interface MediaItem {
//     public_id: string;
//     secure_url: string;
//     resource_type: "image" | "video";
//     width?: number;
//     height?: number;
//     format?: string;
//     created_at?: string;
// }

interface HeroCarouselProps {
    items: MediaResource[]
    onItemClick: (item: MediaResource) => void
}

export function HeroCarousel({ items, onItemClick }: HeroCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!items || items.length === 0) return null;

    const next = () => setCurrentIndex(prev => (prev + 1) % items.length);
    const prev = () => setCurrentIndex(prev => (prev - 1 + items.length) % items.length);

    return (
        <div className="relative w-full h-[50vh] min-h-[380px] md:h-[60vh] md:min-h-[500px] max-h-[600px] flex flex-col items-center justify-center overflow-hidden perspective-[1500px]">
            {/* Carousel track */}
            <div className="relative w-full max-w-5xl h-full flex items-center justify-center transform-style-3d mt-4 md:mt-10">
                <AnimatePresence initial={false}>
                    {items.map((item, idx) => {
                        // Calculate relative position based on currentIndex
                        const offset = idx - currentIndex;
                        const absoluteOffset = Math.abs(offset);
                        const isCenter = offset === 0;

                        // Only render items close to the center for performance
                        if (absoluteOffset > 2 && absoluteOffset < items.length - 2) return null;

                        // Handle wrap-around offsets visually
                        let visualOffset = offset;
                        if (offset > 2) visualOffset -= items.length;
                        if (offset < -2) visualOffset += items.length;

                        // Calculate 3D transforms
                        const zIndex = 10 - Math.abs(visualOffset);
                        const rotateY = visualOffset * -25;
                        const scale = 1 - Math.abs(visualOffset) * 0.2;
                        const x = visualOffset * 60; // Spread x axis
                        const opacity = Math.max(1 - Math.abs(visualOffset) * 0.4, 0);

                        return (
                            <motion.div
                                key={item.public_id}
                                className="absolute w-[65vw] sm:w-[280px] md:w-[400px] aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer bg-[#111] border border-white/10 shadow-2xl"
                                initial={false}
                                animate={{
                                    rotateY,
                                    scale,
                                    x: `${x}%`,
                                    z: -Math.abs(visualOffset) * 100,
                                    opacity,
                                    zIndex
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 260,
                                    damping: 20,
                                    mass: 1
                                }}
                                onClick={() => isCenter ? onItemClick(item) : setCurrentIndex(idx)}
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

                                {/* Overlays */}
                                {!isCenter && (
                                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
                                )}
                                
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
                <button onClick={prev} className="w-12 h-12 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                    <ChevronLeft size={24} />
                </button>
                
                {/* Dots */}
                <div className="flex gap-2">
                    {items.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentIndex ? "w-8 bg-cyan-400 shadow-[0_0_10px_#00ddff]" : "bg-white/30"}`} />
                    ))}
                </div>

                <button onClick={next} className="w-12 h-12 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
    );
}
