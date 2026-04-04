/** @format */

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

interface RoomCancelledModalProps {
    open: boolean;
    countdown?: number;
}

export default function RoomCancelledModal({ open, countdown = 4 }: RoomCancelledModalProps) {
    const router = useRouter();
    const [timeLeft, setTimeLeft] = useState(countdown);

    useEffect(() => {
        if (!open) return;

        setTimeLeft(countdown);

        const timer = window.setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    window.clearInterval(timer);
                    router.push("/");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [open, countdown, router]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="room-cancelled-title"
                        aria-describedby="room-cancelled-desc"
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        initial={{ opacity: 0, scale: 0.9, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d0f14]/95 p-8 text-center shadow-[0_32px_80px_rgba(0,0,0,0.65)]"
                    >
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10">
                            <XCircle className="h-7 w-7 text-red-400" />
                        </div>

                        <h2 id="room-cancelled-title" className="mb-2 text-2xl font-bold tracking-tight text-white">
                            The meeting has been canceled by the host
                        </h2>

                        <p id="room-cancelled-desc" className="mb-6 text-sm leading-relaxed text-white/45">
                            The host canceled the meeting. Redirecting to the home
                        </p>

                        <div className="mb-6 flex items-center justify-center gap-2 text-sm text-white/35">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                            Redirecting in {timeLeft}s...
                        </div>

                        <button
                            onClick={() => router.push("/")}
                            className="inline-flex w-full items-center justify-center rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 active:scale-[0.99] cursor-pointer"
                        >
                            Back to home now
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
