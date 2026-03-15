"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MailOpen, ArrowRight } from "lucide-react";

interface IntroCardProps {
    onReveal: () => void;
}

export function IntroCard({ onReveal }: IntroCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLetterPopped, setIsLetterPopped] = useState(false);

    const handleOpen = () => {
        setIsOpen(true);
        // After the flap opens and the letter slides up, we pop the letter fully and drop the envelope away
        setTimeout(() => setIsLetterPopped(true), 1200);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto h-screen w-screen overflow-hidden perspective-[2500px]">
            {/* Ambient background for the locked state */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#020202] intro-bg-gradient"
            />

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-cyan-400 rounded-full blur-[1px]"
                        initial={{
                            x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
                            y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 800),
                        }}
                        animate={{
                            y: [null, Math.random() * -500],
                            opacity: [0, 1, 0],
                        }}
                        transition={{
                            duration: Math.random() * 5 + 5,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 5,
                        }}
                    />
                ))}
            </div>

            <AnimatePresence>
                <motion.div 
                    className="relative w-[90vw] max-w-[480px] h-[320px] mt-10"
                    initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
                    animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                >
                    {/* Envelope Back */}
                    <motion.div 
                        className="absolute inset-0 rounded-xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-md"
                        animate={isLetterPopped ? { opacity: 0, y: 150, scale: 0.9, rotateX: -20 } : { opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                    />

                    {/* The Letter */}
                    <motion.div
                        className="absolute left-6 right-6 min-h-[320px] pb-6 bg-black/80 backdrop-blur-3xl border border-white/20 rounded-xl flex flex-col items-center justify-center p-4 md:p-6 text-center shadow-[0_0_50px_rgba(0,221,255,0.2)] select-none"
                        initial={{ y: 0, zIndex: 10, opacity: 0 }}
                        animate={
                            isLetterPopped 
                                ? { y: -60, zIndex: 30, scale: 1.15, opacity: 1, boxShadow: "0 20px 80px rgba(255,0,85,0.4)" } 
                                : isOpen 
                                    ? { y: -160, zIndex: 30, scale: 1.05, opacity: 1 } 
                                    : { y: 0, zIndex: 10, opacity: 0 }
                        }
                        transition={{ type: "spring", stiffness: 90, damping: 15 }}
                    >
                        <Sparkles size={24} className="text-pink-500 mb-2 md:mb-4 shrink-0" />
                        <h3 className="text-lg md:text-xl md:text-2xl font-bold mb-2 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 shrink-0">
                            A Message For You
                        </h3>
                        <p className="text-zinc-300 text-[11px] md:text-sm leading-snug mb-6 max-w-[260px] md:max-w-none shrink-0">
                            Every pic you shared with me is my responsibility to cherish and preserve. This is your vault made by me with ❤️
                        </p>
                        
                        <AnimatePresence>
                            {isLetterPopped && (
                                <motion.button
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={onReveal}
                                    whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255,0,85,0.6)" }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center justify-center whitespace-nowrap gap-2 bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-bold py-2 md:py-2.5 px-8 rounded-full shadow-[0_0_20px_rgba(255,0,85,0.4)] pointer-events-auto cursor-pointer min-w-[220px] shrink-0 mt-2"
                                >
                                    Reveal Gallery <ArrowRight size={16} />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Envelope Front Flaps */}
                    <motion.div 
                        className="absolute inset-0 z-20 pointer-events-none drop-shadow-2xl"
                        animate={isLetterPopped ? { opacity: 0, y: 150, scale: 0.9, rotateX: -20 } : { opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                    >
                        <div 
                            className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl"
                            style={{ clipPath: "polygon(0 0, 50% 50%, 100% 0, 100% 100%, 0 100%)" }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
                        </div>

                        {!isOpen && (
                            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-auto mt-[40px]">
                                <motion.button 
                                    onClick={handleOpen}
                                    whileHover={{ scale: 1.1, boxShadow: "0 0 40px rgba(0,221,255,0.8)" }}
                                    whileTap={{ scale: 0.9 }}
                                    className="bg-cyan-500/20 border border-cyan-400 text-cyan-400 font-bold px-8 py-3 rounded-full cursor-pointer backdrop-blur-md shadow-[0_0_20px_rgba(0,221,255,0.4)] flex items-center gap-2"
                                >
                                    Open Me <MailOpen size={16} />
                                </motion.button>
                            </div>
                        )}
                    </motion.div>

                    {/* Envelope Top Flap */}
                    <motion.div 
                        className="absolute top-0 left-0 w-full h-[60%] origin-top pointer-events-none drop-shadow-2xl"
                        initial={{ rotateX: 0, zIndex: 30 }}
                        animate={isLetterPopped ? { opacity: 0, y: 150 } : isOpen ? { rotateX: 180, zIndex: 5 } : { rotateX: 0, zIndex: 30 }}
                        transition={
                            isLetterPopped 
                                ? { duration: 0.8, ease: "easeInOut" }
                                : isOpen 
                                    ? { rotateX: { duration: 0.6, ease: "easeInOut" }, zIndex: { delay: 0.3 } } 
                                    : {}
                        }
                    >
                        <div 
                            className="w-full h-full bg-white/20 backdrop-blur-3xl border-t border-white/30 rounded-t-xl"
                            style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)", backfaceVisibility: "hidden" }}
                        />
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
