/** @format */

"use client";

import { useEffect, useState } from "react";
import { Session } from "next-auth";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import RoomLayout from "./RoomLayout";

interface VideoRoomProps {
    roomId: string;
    roomName: string;
    hostId: string;
    session: Session;
    initialMic: boolean; // 👈
    initialCam: boolean; // 👈
}

export default function VideoRoom({ roomId, roomName, hostId, session, initialMic, initialCam }: VideoRoomProps) {
    const [token, setToken] = useState("");

    useEffect(() => {
        fetch(`/api/livekit?room=${roomId}`)
            .then((r) => r.json())
            .then((d) => setToken(d.token));
    }, [roomId]);

    if (!token) {
        return (
            <div className="fixed inset-0 bg-[#0a0c10] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#6346ff]/30 border-t-[#6346ff] rounded-full animate-spin" />
                    <p className="text-white/40 text-sm">Connecting...</p>
                </div>
            </div>
        );
    }

    return (
        <LiveKitRoom
            token={token}
            audio={initialMic} // 👈
            video={initialCam}
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL!}
            connect={true}
            className="fixed inset-0 bg-[#0a0c10]"
        >
            <RoomAudioRenderer />
            <RoomLayout roomId={roomId} roomName={roomName} hostId={hostId} session={session} initialMic={initialMic} initialCam={initialCam} />
        </LiveKitRoom>
    );
}
