/** @format */

"use client";

import { useState } from "react";
import { Session } from "next-auth";
import { useParticipants } from "@livekit/components-react";
import RoomHeader from "./RoomHeader";
import ChatPanel from "./ChatPanel";
import ParticipantGrid from "./Participant";
import ControlBar from "./ControllerBar";
import WaitingGuests from "./WaitingGuest";
import ScreenShareRequest from "./ScreenShareRequest";
import { useSocket } from "@/hooks/useSocket";
import { useEffect } from "react";
import RoomTimerNotice from "./RoomTimeNotice";
import RoomEndedModal from "./RoomEndModal";

interface RoomLayoutProps {
    roomName: string;
    roomId: string;
    hostId: string;
    session: Session;
    initialMic: boolean;
    initialCam: boolean;
}

interface ShareRequester {
    name: string;
    image: string;
    socketId: string;
}

export default function RoomLayout({ roomName, roomId, hostId, session, initialMic, initialCam }: RoomLayoutProps) {
    const [chatOpen, setChatOpen] = useState(false);
    const [activePanel, setActivePanel] = useState<"chat" | "participants">("chat");
    const [shareRequester, setShareRequester] = useState<ShareRequester | null>(null);
    const participants = useParticipants();
    const isHost = session.user?.id === hostId;
    const isOverflow = participants.length > 8;
    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;

        socket.on("screenshare:incoming_request", ({ requesterSocketId, requester }: { requesterSocketId: string; requester: { name: string; image: string } }) => {
            setShareRequester({ ...requester, socketId: requesterSocketId });
        });

        return () => {
            socket.off("screenshare:incoming_request");
        };
    }, [socket]);

    const handleApproveShare = () => {
        if (!socket || !shareRequester) return;
        socket.emit("screenshare:approve", { requesterSocketId: shareRequester.socketId });
        setShareRequester(null);
    };

    const handleRejectShare = () => {
        if (!socket || !shareRequester) return;
        socket.emit("screenshare:reject", { requesterSocketId: shareRequester.socketId });
        setShareRequester(null);
    };

    return (
        <div className="fixed inset-0 flex flex-col bg-[#0a0c10]">
            <RoomHeader roomName={roomName} session={session} />

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-hidden">
                    <ParticipantGrid />
                </div>

                {chatOpen && (
                    <ChatPanel
                        roomId={roomId}
                        activePanel={activePanel}
                        onPanelChange={setActivePanel}
                        onClose={() => setChatOpen(false)}
                        session={session}
                        participantCount={participants.length}
                        isHost={isHost}
                        isOverflow={isOverflow}
                    />
                )}
            </div>

            <ControlBar
                chatOpen={chatOpen}
                onToggleChat={() => setChatOpen(!chatOpen)}
                participantCount={participants.length}
                initialMic={initialMic}
                initialCam={initialCam}
                roomId={roomId}
                session={session}
                onShareRequest={(requester, socketId) => setShareRequester({ ...requester, socketId })}
            />

            <WaitingGuests roomId={roomId} session={session} isHost={isHost} />

            <ScreenShareRequest requester={shareRequester} onApprove={handleApproveShare} onReject={handleRejectShare} />
            <RoomTimerNotice />
            <RoomEndedModal />
        </div>
    );
}
