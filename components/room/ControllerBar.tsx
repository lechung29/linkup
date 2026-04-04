/** @format */

"use client";

import { useLocalParticipant, useParticipants, useRoomContext } from "@livekit/components-react";
import { Mic, MicOff, Video, VideoOff, MonitorUp, MessageSquare, Users, PhoneOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { RoomEvent, Track } from "livekit-client";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/useSocket";
import { Session } from "next-auth";
import { toast } from "sonner";
import { useRoomStore } from "@/store/useRoomStore";

interface ControlBarProps {
    chatOpen: boolean;
    onToggleChat: () => void;
    participantCount: number;
    initialMic: boolean;
    initialCam: boolean;
    roomId: string;
    session: Session;
    onShareRequest: (requester: { name: string; image: string }, socketId: string) => void;
}

export default function ControlBar({ chatOpen, onToggleChat, participantCount, initialMic, initialCam, roomId, session }: ControlBarProps) {
    const router = useRouter();
    const { localParticipant } = useLocalParticipant();
    const participants = useParticipants();
    const room = useRoomContext();
    const socket = useSocket();
    const { unreadCount } = useRoomStore();

    const [micEnabled, setMicEnabled] = useState(initialMic);
    const [camEnabled, setCamEnabled] = useState(initialCam);
    const [screenSharing, setScreenSharing] = useState(false);
    const [requestPending, setRequestPending] = useState(false);

    useEffect(() => {
        if (!socket) return;
        socket.emit("room:join", { roomId, identity: session.user?.email });
    }, [socket, roomId]);

    useEffect(() => {
        if (!socket) return;

        socket.on("screenshare:approved", async () => {
            setRequestPending(false);
            try {
                await localParticipant.setScreenShareEnabled(true);
                setScreenSharing(true);
            } catch {
                setScreenSharing(false);
            }
        });

        socket.on("screenshare:rejected", () => {
            setRequestPending(false);
            toast.error("Your screen sharing request was rejected");
        });

        socket.on("screenshare:stop_yours", async () => {
            try {
                await localParticipant.setScreenShareEnabled(false);
                setScreenSharing(false);
            } catch {}
        });

        return () => {
            socket.off("screenshare:approved");
            socket.off("screenshare:rejected");
            socket.off("screenshare:stop_yours");
        };
    }, [socket, roomId, localParticipant]);

    useEffect(() => {
        if (!room || !localParticipant) return;
        const onConnected = async () => {
            try {
                await localParticipant.setMicrophoneEnabled(initialMic);
                await localParticipant.setCameraEnabled(initialCam);
                setMicEnabled(initialMic);
                setCamEnabled(initialCam);
            } catch {}
        };
        if (room.state === "connected") onConnected();
        else room.on(RoomEvent.Connected, onConnected);
        return () => {
            room.off(RoomEvent.Connected, onConnected);
        };
    }, [room, localParticipant]);

    const toggleMic = async () => {
        const next = !micEnabled;
        setMicEnabled(next);
        try {
            await localParticipant.setMicrophoneEnabled(next);
        } catch {
            setMicEnabled(!next);
        }
    };

    const toggleCam = async () => {
        const next = !camEnabled;
        setCamEnabled(next);
        try {
            await localParticipant.setCameraEnabled(next);
        } catch {
            setCamEnabled(!next);
        }
    };

    const toggleScreenShare = async () => {
        if (screenSharing) {
            try {
                await localParticipant.setScreenShareEnabled(false);
                setScreenSharing(false);
            } catch {}
            return;
        }
        const sharer = participants.find((p) => p.identity !== localParticipant.identity && p.getTrackPublications().some((pub) => pub.source === Track.Source.ScreenShare && !pub.isMuted));
        if (sharer && socket) {
            setRequestPending(true);
            socket.emit("screenshare:request", {
                roomId,
                requester: { id: session.user?.id, name: session.user?.name, image: session.user?.image },
                sharerIdentity: sharer.identity,
            });
            setTimeout(() => setRequestPending(false), 30000);
        } else {
            try {
                await localParticipant.setScreenShareEnabled(true);
                setScreenSharing(true);
            } catch {
                setScreenSharing(false);
            }
        }
    };

    const handleLeave = async () => {
        try {
            await localParticipant.setMicrophoneEnabled(false);
            await localParticipant.setCameraEnabled(false);
            await room.disconnect();
        } catch {}
        if (socket) {
            socket.emit("room:leave", { roomId, identity: session.user?.email });
        }
        router.push("/");
    };

    return (
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-t border-white/6 bg-[#0d0f14]/80 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 sm:gap-2">
                <ControlButton onClick={toggleMic} icon={micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />} danger={!micEnabled} tooltip={micEnabled ? "Mute" : "Unmute"} />
                <ControlButton
                    onClick={toggleCam}
                    icon={camEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    danger={!camEnabled}
                    tooltip={camEnabled ? "Stop video" : "Start video"}
                />
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="hidden sm:block">
                    <ControlButton
                        onClick={toggleScreenShare}
                        icon={requestPending ? <div className="w-4 h-4 border-2 border-[#a78bfa]/30 border-t-[#a78bfa] rounded-full animate-spin" /> : <MonitorUp className="w-4 h-4" />}
                        active={screenSharing || requestPending}
                        tooltip={requestPending ? "Waiting..." : screenSharing ? "Stop sharing" : "Share screen"}
                    />
                </div>

                <button
                    onClick={handleLeave}
                    className="flex items-center gap-1.5 sm:gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 rounded-xl px-3 sm:px-4 h-9 sm:h-10 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer"
                >
                    <PhoneOff className="w-4 h-4" />
                    <span className="hidden sm:inline">Leave</span>
                </button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="relative">
                    <ControlButton onClick={onToggleChat} icon={<MessageSquare className="w-4 h-4" />} active={chatOpen} tooltip="Chat" />
                    {unreadCount > 0 && !chatOpen && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 px-1 rounded-full bg-[#6346ff] text-white text-[10px] font-bold flex items-center justify-center leading-none pointer-events-none">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 h-9 sm:h-10 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs sm:text-sm">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{participantCount}</span>
                </div>
            </div>
        </div>
    );
}

function ControlButton({ onClick, icon, active = true, danger = false, tooltip }: { onClick?: () => void; icon: React.ReactNode; active?: boolean; danger?: boolean; tooltip?: string }) {
    return (
        <button
            onClick={onClick}
            title={tooltip}
            className={cn(
                "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 border cursor-pointer",
                danger
                    ? "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
                    : active
                      ? "bg-[#6346ff]/20 border-[#6346ff]/40 text-[#a78bfa]"
                      : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70",
            )}
        >
            {icon}
        </button>
    );
}
