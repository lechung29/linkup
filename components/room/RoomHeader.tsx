/** @format */

"use client";

import { useElapsedTime } from "use-elapsed-time";
import { Session } from "next-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogoWithText } from "../ui/logo";

interface RoomHeaderProps {
    roomName: string;
    session: Session;
}

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
        .toString()
        .padStart(2, "0");
    const s = Math.floor(seconds % 60)
        .toString()
        .padStart(2, "0");
    return `${m}:${s}`;
}

export default function RoomHeader({ roomName, session }: RoomHeaderProps) {
    const { elapsedTime } = useElapsedTime({ isPlaying: true });
    const initials =
        session.user?.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() ?? "?";

    return (
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/6 bg-[#0d0f14]/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
                <LogoWithText />
                <div className="w-px h-4 bg-white/10" />
                <span className="text-white/60 text-sm font-medium truncate max-w-100">{roomName}</span>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-[#ff4d2e]/15 border border-[#ff4d2e]/30 rounded-full px-3 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ff4d2e] animate-pulse" />
                    <span className="text-[#ff4d2e] text-xs font-semibold">LIVE</span>
                    <span className="text-[#ff4d2e]/70 text-xs">{formatTime(elapsedTime)}</span>
                </div>

                <Avatar className="w-8 h-8">
                    <AvatarImage src={session.user?.image ?? ""} />
                    <AvatarFallback className="bg-[#6346ff] text-white text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>
            </div>
        </div>
    );
}
