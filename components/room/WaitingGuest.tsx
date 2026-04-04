/** @format */

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/hooks/useSocket";
import { Session } from "next-auth";
import { Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface WaitingGuest {
    socketId: string;
    roomId: string;
    user: { id: string; name: string; image: string };
}

interface WaitingGuestsProps {
    roomId: string;
    session: Session;
    isHost: boolean;
}

export default function WaitingGuests({ roomId, session, isHost }: WaitingGuestsProps) {
    const socket = useSocket();
    const [guests, setGuests] = useState<WaitingGuest[]>([]);

    useEffect(() => {
        if (!socket || !isHost) return;

        socket.emit("host:join", roomId);

        const handleGuestWaiting = (guest: WaitingGuest) => {
            setGuests((prev) => {
                if (prev.some((g) => g.socketId === guest.socketId)) return prev;
                return [...prev, guest];
            });
        };

        socket.on("guest:waiting", handleGuestWaiting);

        return () => {
            socket.off("guest:waiting", handleGuestWaiting);
        };
    }, [socket, roomId, isHost]);

    const handleApprove = (guest: WaitingGuest) => {
        socket?.emit("host:approve", { socketId: guest.socketId, roomId });
        setGuests((prev) => prev.filter((g) => g.socketId !== guest.socketId));
    };

    const handleReject = (guest: WaitingGuest) => {
        socket?.emit("host:reject", { socketId: guest.socketId, roomId });
        setGuests((prev) => prev.filter((g) => g.socketId !== guest.socketId));
    };

    if (!isHost || guests.length === 0) return null;

    return (
        <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-xs w-full">
            <AnimatePresence>
                {guests.map((guest) => {
                    const initials =
                        guest.user.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase() ?? "?";
                    return (
                        <motion.div
                            key={guest.socketId}
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 40 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center gap-3 bg-[#111318]/95 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                        >
                            <Avatar className="w-9 h-9 shrink-0">
                                <AvatarImage src={guest.user.image} />
                                <AvatarFallback className="bg-[#6346ff] text-white text-xs font-semibold">{initials}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{guest.user.name}</p>
                                <p className="text-white/40 text-xs">Wants to join</p>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handleApprove(guest)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30 transition-all duration-200"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleReject(guest)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all duration-200"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
