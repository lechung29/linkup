/** @format */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Input } from "@/components/ui/input";

export function JoinRoom() {
    const router = useRouter();
    const [roomId, setRoomId] = useState("");
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState("");

    const handleJoin = async () => {
        if (!roomId.trim()) return;
        setJoining(true);
        setError("");

        try {
            const res = await fetch(`/api/rooms?roomId=${roomId.trim()}`);

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Room not found");
                return;
            }

            router.push(`/room/${roomId.trim()}`);
        } catch {
            setError("Cannot connect to server");
        } finally {
            setJoining(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <p className="text-white/50 text-sm text-center mb-2">Enter the room code shared by the meeting host</p>

            <Input
                value={roomId}
                onChange={(e) => {
                    setRoomId(e.target.value);
                    setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="Enter room code..."
                className="h-12 rounded-xl bg-white/4 border-white/8 text-white placeholder:text-white/20 focus-visible:ring-[#6346ff]/50 focus-visible:border-[#6346ff]/50 font-mono tracking-wider"
            />

            {error && <p className="text-red-400 text-xs text-center -mt-2">{error}</p>}

            <PrimaryButton onClick={handleJoin} isLoading={joining} disabled={!roomId.trim()} uiVariant="filled" tone="dark" rightIcon={<ArrowRight className="w-4 h-4" />} className="w-full">
                Join meeting
            </PrimaryButton>
        </div>
    );
}
