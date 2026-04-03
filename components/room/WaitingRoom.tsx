/** @format */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Session } from "next-auth";
import { useSocket } from "@/hooks/useSocket";
import { Loader2, XCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface WaitingRoomProps {
    roomId: string;
    session: Session;
    onApproved: () => void;
}

export default function WaitingRoom({ roomId, session, onApproved }: WaitingRoomProps) {
    const socket = useSocket();
    const [status, setStatus] = useState<"waiting" | "rejected">("waiting");
    const user = session.user;
    const initials =
        user?.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() ?? "?";

    useEffect(() => {
        if (!socket) return;

        // Gửi request join lên host
        socket.emit("guest:request", {
            roomId,
            user: {
                id: user?.id,
                name: user?.name,
                image: user?.image,
            },
        });

        // Lắng nghe approved/rejected
        socket.on("guest:approved", () => {
            onApproved();
        });

        socket.on("guest:rejected", () => {
            setStatus("rejected");
        });

        return () => {
            socket.off("guest:approved");
            socket.off("guest:rejected");
        };
    }, [socket, roomId]);

    return (
        <div className="fixed inset-0 bg-[#0a0c10] flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-linear-to-br from-[#0d1f1a] via-[#0a0c10] to-[#0a0c10]" />

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 flex flex-col items-center max-w-sm text-center px-6">
                {/* Avatar */}
                <Avatar className="w-20 h-20 mb-6 ring-4 ring-[#6346ff]/30">
                    <AvatarImage src={user?.image ?? ""} />
                    <AvatarFallback className="bg-[#6346ff] text-white text-2xl font-bold">{initials}</AvatarFallback>
                </Avatar>

                {status === "waiting" ? (
                    <>
                        <div className="flex items-center gap-2 mb-4">
                            <Loader2 className="w-4 h-4 text-[#6346ff] animate-spin" />
                            <span className="text-white/60 text-sm">Waiting for host approval</span>
                        </div>

                        <h1 className="text-white text-2xl font-bold tracking-tight mb-2">Waiting to join</h1>
                        <p className="text-white/40 text-sm leading-relaxed">The host will let you in soon. Please wait while your request is being reviewed.</p>

                        {/* Animated dots */}
                        <div className="flex items-center gap-1.5 mt-8">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-2 h-2 rounded-full bg-[#6346ff]/50"
                                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                    }}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <XCircle className="w-12 h-12 text-red-400 mb-4" />
                        <h1 className="text-white text-2xl font-bold tracking-tight mb-2">Request declined</h1>
                        <p className="text-white/40 text-sm leading-relaxed mb-6">The host has declined your request to join this meeting.</p>
                        <a href="/" className="text-[#6346ff] hover:text-[#8b6aff] text-sm font-medium transition-colors">
                            ← Back to home
                        </a>
                    </>
                )}
            </motion.div>
        </div>
    );
}
