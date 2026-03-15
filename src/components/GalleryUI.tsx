"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';

const galleryItems = [
    { id: 1, title: 'Performance Engineering', desc: 'Twin-Turbocharged 3.0L Inline-6 engine delivering uncompromising power.' },
    { id: 2, title: 'Aerodynamics', desc: 'Precision engineered widebody kit for maximum downforce and presence.' },
    { id: 3, title: 'Carbon Fiber', desc: 'Extensive use of exposed carbon fiber lowering weight and enhancing style.' },
    { id: 4, title: 'Custom Exhaust', desc: 'Titanium exhaust system providing a signature roar that demands attention.' },
];

export function GalleryUI() {
    return (
        <div className="relative z-10 bg-black/80 backdrop-blur-xl border-t border-zinc-800 text-white min-h-screen pt-32 pb-24 px-8 md:px-24">
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="max-w-7xl mx-auto"
            >
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                    <div>
                        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-red-500">M4 Knitro</span> Build
                        </h2>
                        <p className="text-zinc-400 mt-4 max-w-xl text-lg">
                            Explore the pinnacle of aftermarket tuning and aesthetic enhancement.
                            The ultimate driving machine, elevated.
                        </p>
                    </div>
                    <button className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform">
                        Build Yours <ArrowRight size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {galleryItems.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="group relative overflow-hidden rounded-2xl bg-zinc-900/50 border border-zinc-800 p-8 hover:bg-zinc-800/80 transition-colors"
                        >
                            <Star className="text-blue-500 mb-6" size={32} />
                            <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                            <p className="text-zinc-400 leading-relaxed">{item.desc}</p>

                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
