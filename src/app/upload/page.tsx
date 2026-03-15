"use client";
import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, X, CheckCircle, AlertCircle, Film, ImageIcon, LogOut, Plus } from "lucide-react";

interface FileState {
    file: File;
    id: string;
    progress: number;
    status: "pending" | "uploading" | "done" | "error";
    preview?: string;
    url?: string;
}

export default function UploadPage() {
    const { data: session } = useSession();
    const [files, setFiles] = useState<FileState[]>([]);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const addFiles = useCallback((incoming: File[]) => {
        const newItems: FileState[] = incoming.map(file => ({
            file,
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            progress: 0,
            status: "pending",
            preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        }));
        setFiles(prev => [...prev, ...newItems]);
        // Auto-upload
        newItems.forEach(item => uploadFile(item));
    }, []);

    async function uploadFile(item: FileState) {
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: "uploading" } : f));

        const formData = new FormData();
        formData.append("file", item.file);

        try {
            // Use XHR for progress tracking
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.withCredentials = true; // send session cookie
                xhr.upload.addEventListener("progress", e => {
                    if (e.lengthComputable) {
                        const pct = Math.round((e.loaded / e.total) * 100);
                        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, progress: pct } : f));
                    }
                });
                xhr.addEventListener("load", () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        const data = JSON.parse(xhr.responseText);
                        setFiles(prev => prev.map(f =>
                            f.id === item.id ? { ...f, status: "done", progress: 100, url: data.secure_url } : f
                        ));
                        resolve();
                    } else {
                        reject(new Error(xhr.responseText));
                    }
                });
                xhr.addEventListener("error", () => reject(new Error("Upload failed")));
                xhr.open("POST", "/api/upload");
                xhr.send(formData);
            });
        } catch {
            setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: "error" } : f));
        }
    }

    function onDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragging(false);
        addFiles(Array.from(e.dataTransfer.files));
    }

    const doneCount = files.filter(f => f.status === "done").length;

    return (
        <div className="vault-bg min-h-screen">
            <div className="vault-blob vault-blob-1" />
            <div className="vault-blob vault-blob-2" />

            {/* Navbar */}
            <nav className="sticky top-0 z-40 vault-nav">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                    <Link href="/" className="text-white font-black text-lg sm:text-xl tracking-tight hover:text-cyan-400 transition-colors shrink-0 whitespace-nowrap">
                        ⬡ Vault Gallery
                    </Link>
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                        <Link href="/gallery" className="vault-btn-ghost text-xs sm:text-sm">Gallery</Link>
                        <button onClick={() => signOut({ callbackUrl: "/" })} className="vault-btn-ghost text-xs sm:text-sm">
                            <LogOut size={14} className="shrink-0" /> Sign out
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 sm:mb-10">
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight">
                        Upload <span className="text-gradient ml-2 sm:ml-4">Media</span>
                    </h1>
                    <p className="text-zinc-400 mt-2 text-sm sm:text-base">Photos and videos are saved to Cloudinary</p>
                </motion.div>

                {/* Drop Zone */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`vault-dropzone ${dragging ? "dragging" : ""}`}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={e => addFiles(Array.from(e.target.files ?? []))}
                    />
                    <div className="flex flex-col items-center gap-3 sm:gap-4 pointer-events-none">
                        <div className={`vault-upload-icon ${dragging ? "animate-bounce" : ""}`}>
                            <Upload size={32} className="text-cyan-400 sm:w-[36px] sm:h-[36px]" />
                        </div>
                        <div className="text-center">
                            <p className="text-white text-base sm:text-lg font-semibold">Drop files here or click to browse</p>
                            <p className="text-zinc-500 text-xs sm:text-sm mt-1">Supports JPG, PNG, GIF, MP4, MOV, WebM • No size limit</p>
                        </div>
                        <div className="flex gap-2 sm:gap-4 mt-1 sm:mt-2 flex-wrap justify-center">
                            <span className="vault-type-badge badge-photo"><ImageIcon size={12} /> Images</span>
                            <span className="vault-type-badge badge-video"><Film size={12} /> Videos</span>
                        </div>
                    </div>
                </motion.div>

                {/* File Queue */}
                <AnimatePresence>
                    {files.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 sm:mt-8 space-y-2 sm:space-y-3"
                        >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 sm:mb-4">
                                <p className="text-white font-semibold text-sm sm:text-base">
                                    {doneCount}/{files.length} uploaded
                                </p>
                                <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                                    <button
                                        onClick={() => inputRef.current?.click()}
                                        className="vault-btn-sm flex-1 sm:flex-none text-xs sm:text-sm"
                                    >
                                        <Plus size={14} /> Add more
                                    </button>
                                    {doneCount > 0 && (
                                        <Link href="/gallery" className="vault-btn-primary flex-1 sm:flex-none text-xs sm:text-sm">
                                            View Gallery →
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {files.map(item => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="vault-file-row"
                                >
                                    {/* Thumbnail */}
                                    <div className="vault-file-thumb">
                                        {item.preview ? (
                                            <img src={item.preview} className="w-full h-full object-cover rounded-lg" alt="" />
                                        ) : (
                                            <Film size={20} className="text-zinc-500" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-xs sm:text-sm font-medium truncate">{item.file.name}</p>
                                        <p className="text-zinc-500 text-xs">
                                            {(item.file.size / 1024 / 1024).toFixed(1)} MB
                                            {item.status === "error" && <span className="text-red-400 ml-2">• Upload failed</span>}
                                        </p>
                                        {item.status === "uploading" && (
                                            <div className="vault-progress-bar mt-1.5">
                                                <div className="vault-progress-fill" style={{ width: `${item.progress}%` }} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Status icon */}
                                    <div className="flex-shrink-0">
                                        {item.status === "done" && <CheckCircle size={18} className="text-green-400 sm:w-[20px] sm:h-[20px]" />}
                                        {item.status === "error" && (
                                            <button onClick={() => uploadFile(item)} title="Retry">
                                                <AlertCircle size={18} className="text-red-400 hover:text-red-300 sm:w-[20px] sm:h-[20px]" />
                                            </button>
                                        )}
                                        {item.status === "uploading" && (
                                            <span className="text-cyan-400 text-xs font-mono">{item.progress}%</span>
                                        )}
                                        {item.status === "pending" && <span className="text-zinc-600 text-xs">Queued</span>}
                                    </div>

                                    {/* Remove */}
                                    <button
                                        onClick={() => setFiles(prev => prev.filter(f => f.id !== item.id))}
                                        className="text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0"
                                        aria-label="Remove file"
                                    >
                                        <X size={16} />
                                    </button>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}