/** @format */

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, X } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { useRouter } from "next/navigation";

export default function RoomTimerNotice() {
    const socket = useSocket();
    const router = useRouter();
    const [warning, setWarning] = useState<{ message: string } | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [dismissed, setDismissed] = useState(false);

    const deadlineRef = useRef<number | null>(null);

    useEffect(() => {
        if (!socket) return;

        socket.on("room:warning", ({ message, minutesLeft }: { message: string; minutesLeft: number }) => {
            deadlineRef.current = Date.now() + minutesLeft * 60 * 1000;
            setWarning({ message });
            setCountdown(minutesLeft * 60);
            setDismissed(false);
        });

        socket.on("room:ended", ({ message }: { message: string }) => {
            deadlineRef.current = null;
            setWarning(null);
            setCountdown(null);
            setTimeout(() => router.push("/"), 5000);
        });

        return () => {
            socket.off("room:warning");
            socket.off("room:ended");
        };
    }, [socket]);

    useEffect(() => {
        if (!warning) return;

        const tick = () => {
            if (deadlineRef.current === null) return;
            const remaining = Math.max(0, Math.floor((deadlineRef.current - Date.now()) / 1000));
            setCountdown(remaining);
        };

        tick();
        const interval = setInterval(tick, 1000);

        const handleVisibility = () => {
            if (document.visibilityState === "visible") tick();
        };
        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [warning]);

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
                            {countdown !== null && countdown > 0 && <p className="text-amber-400/70 text-xs font-mono mt-0.5">{formatCountdown(countdown)} remaining</p>}
                        </div>

                        <button onClick={() => setDismissed(true)} className="text-amber-400/50 hover:text-amber-200 transition-colors shrink-0 cursor-pointer">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
