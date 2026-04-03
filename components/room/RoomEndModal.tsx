/** @format */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { useRouter } from "next/navigation";

export default function RoomEndedModal() {
    const socket = useSocket();
    const router = useRouter();
    const [show, setShow] = useState(false);
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (!socket) return;

        socket.on("room:ended", () => {
            setShow(true);
            setCountdown(5);
        });

        return () => {
            socket.off("room:ended");
        };
    }, [socket]);

    useEffect(() => {
        if (!show) return;
        if (countdown <= 0) {
            router.push("/");
            return;
        }
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [show, countdown]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="bg-[#0d0f14]/95 border border-white/10 rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">
                            <Clock className="w-7 h-7 text-amber-400" />
                        </div>

                        <h2 className="text-white text-xl font-bold tracking-tight mb-2">Phòng đã hết thời gian</h2>
                        <p className="text-white/40 text-sm leading-relaxed mb-6">Phòng họp đã đạt giới hạn 1 tiếng. Tất cả thành viên sẽ được đưa ra ngoài.</p>

                        <div className="flex items-center justify-center gap-2 text-white/30 text-sm">
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                            Chuyển về trang chủ sau {countdown}s...
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
