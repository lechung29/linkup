/** @format */

"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Session } from "next-auth";
import { Mic, MicOff, Video, VideoOff, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LinkupLogo } from "../ui/logo";

interface PreJoinProps {
    roomId: string;
    roomName: string;
    session: Session;
    onJoin: (options: { micEnabled: boolean; camEnabled: boolean }) => void;
}

export default function PreJoin({ roomId, roomName, session, onJoin }: PreJoinProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [displayName, setDisplayName] = useState(session.user?.name || "");
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        if (camOn) {
            navigator.mediaDevices
                .getUserMedia({ video: true, audio: false })
                .then((s) => {
                    setStream(s);
                    if (videoRef.current) videoRef.current.srcObject = s;
                })
                .catch(() => setCamOn(false));
        } else {
            stream?.getVideoTracks().forEach((t) => t.stop());
            setStream(null);
            if (videoRef.current) videoRef.current.srcObject = null;
        }

        return () => stream?.getTracks().forEach((t) => t.stop());
    }, [camOn]);

    const initials =
        session.user?.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() ?? "?";

    return (
        <div className="fixed inset-0 bg-[#0a0c10] flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-linear-to-br from-[#0d1f1a] via-[#0a0c10] to-[#0a0c10]" />

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="relative w-full max-w-lg px-6 z-10">
                <div className="flex justify-center mb-6">
                    <LinkupLogo />
                </div>
                <div className="text-center mb-6">
                    <h1 className="text-white text-2xl font-bold tracking-tight mb-1">Get Started</h1>
                    <p className="text-white/40 text-sm">Prepare your audio and video before connecting</p>
                </div>

                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-2 bg-[#ff4d2e]/20 border border-[#ff4d2e]/40 rounded-full px-4 py-1.5">
                        <div className="w-2 h-2 rounded-full bg-[#ff4d2e] animate-pulse" />
                        <span className="text-[#ff4d2e] text-xs font-semibold tracking-wide">LIVE</span>
                    </div>
                    <div className="flex items-center ml-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
                        <span className="text-white/50 text-xs">{roomName}</span>
                    </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden bg-[#111318] aspect-video mb-4 border border-white/6">
                    {camOn ? (
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Avatar className="w-20 h-20">
                                <AvatarImage src={session.user?.image ?? ""} />
                                <AvatarFallback className="bg-[#6346ff] text-white text-2xl font-bold">{initials}</AvatarFallback>
                            </Avatar>
                        </div>
                    )}
                    {!micOn && (
                        <div className="absolute top-3 right-3 bg-red-500/80 rounded-full p-1.5">
                            <MicOff className="w-3 h-3 text-white" />
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setMicOn(!micOn)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 border cursor-pointer ${
                                micOn ? "bg-white/5 border-white/10 hover:bg-white/10 text-white/70" : "bg-red-500/20 border-red-500/40 text-red-400"
                            }`}
                        >
                            {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setCamOn(!camOn)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 border cursor-pointer ${
                                camOn ? "bg-white/5 border-white/10 hover:bg-white/10 text-white/70" : "bg-red-500/20 border-red-500/40 text-red-400"
                            }`}
                        >
                            {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className="flex gap-3">
                        <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your name..."
                            className="h-12 rounded-xl bg-white/4 border-white/8 text-white placeholder:text-white/20 focus-visible:ring-[#6346ff]/50 focus-visible:border-[#6346ff]/50"
                        />
                        <PrimaryButton
                            onClick={() => {
                                stream?.getTracks().forEach((t) => t.stop());
                                onJoin({ micEnabled: micOn, camEnabled: camOn });
                            }}
                            disabled={!displayName.trim()}
                            uiVariant="filled"
                            tone="dark"
                            className="px-6 whitespace-nowrap"
                        >
                            Join Now
                        </PrimaryButton>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
