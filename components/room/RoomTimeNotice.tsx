/** @format */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, X } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { useRouter } from "next/navigation";

export default function RoomTimerNotice() {
    const socket = useSocket();
    const router = useRouter();
    const [warning, setWarning] = useState<{ message: string; minutesLeft: number } | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!socket) return;

        socket.on("room:warning", ({ message, minutesLeft }: { message: string; minutesLeft: number }) => {
            setWarning({ message, minutesLeft });
            setCountdown(minutesLeft * 60);
            setDismissed(false);
        });

        socket.on("room:ended", ({ message }: { message: string }) => {
            setWarning(null);
            setCountdown(null);
            setTimeout(() => router.push("/"), 3000);
            alert(message); 
        });

        return () => {
            socket.off("room:warning");
            socket.off("room:ended");
        };
    }, [socket]);

    useEffect(() => {
        if (countdown === null || countdown <= 0) return;
        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [countdown]);

    const formatCountdown = (seconds: number) => {
        const m = Math.floor(seconds / 60)
            .toString()
            .padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    return (
        <AnimatePresence>
            {warning && !dismissed && (
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                    className="absolute top-16 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4"
                >
                    <div className="flex items-center gap-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl px-4 py-3 backdrop-blur-xl shadow-lg">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4 text-amber-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-amber-200 text-sm font-medium">{warning.message}</p>
                            {countdown !== null && countdown > 0 && <p className="text-amber-400/70 text-xs font-mono mt-0.5">{formatCountdown(countdown)} còn lại</p>}
                        </div>

                        <button onClick={() => setDismissed(true)} className="text-amber-400/50 hover:text-amber-200 transition-colors shrink-0">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
