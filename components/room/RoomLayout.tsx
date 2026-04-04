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
import { useRoomStore } from "@/store/useRoomStore";
import { motion, AnimatePresence } from "framer-motion";

interface RoomLayoutProps {
    roomName: string;
    roomId: string;
    hostId: string;
    session: Session;
    initialMic: boolean;
    initialCam: boolean;
    startedAt: string;
}

interface ShareRequester {
    name: string;
    image: string;
    socketId: string;
}

export default function RoomLayout({ roomName, roomId, hostId, session, initialMic, initialCam, startedAt }: RoomLayoutProps) {
    const [chatOpen, setChatOpen] = useState(false);
    const [activePanel, setActivePanel] = useState<"chat" | "participants" | "hands">("chat");
    const [raisedHands, setRaisedHands] = useState<Array<{ identity: string; name?: string; image?: string }>>([]);
    const [shareRequester, setShareRequester] = useState<ShareRequester | null>(null);
    const participants = useParticipants();
    const isHost = session.user?.id === hostId;
    const isOverflow = participants.length > 8;
    const socket = useSocket();
    const { setStartedAt, incrementUnread, resetUnread } = useRoomStore();
    const myIdentity = session.user?.email || "";
    const myHandRaised = raisedHands.some((hand) => hand.identity === myIdentity);

    const handleToggleChat = () => {
        setChatOpen((prev) => {
            if (!prev) resetUnread();
            return !prev;
        });
    };

    useEffect(() => {
        if (startedAt) setStartedAt(new Date(startedAt).getTime());
    }, [startedAt]);

    useEffect(() => {
        if (!socket) return;
        socket.on("room:sync", ({ startedAt }: { startedAt: number | null }) => {
            if (startedAt) setStartedAt(startedAt);
        });
        return () => {
            socket.off("room:sync");
        };
    }, [socket]);

    useEffect(() => {
        if (!socket) return;
        const handleHandsSync = ({ hands }: { hands: Array<{ identity: string; name?: string; image?: string }> }) => {
            setRaisedHands(hands || []);
        };

        socket.on("room:hands:sync", handleHandsSync);

        return () => {
            socket.off("room:hands:sync", handleHandsSync);
        };
    }, [socket]);

    useEffect(() => {
        if (!socket) return;
        const handleNewMessage = (msg: { identity: string }) => {
            if (msg.identity === session.user?.email) return;
            if (!chatOpen) incrementUnread();
            setChatOpen((open) => {
                return open;
            });
        };
        socket.on("chat:message", handleNewMessage);
        return () => {
            socket.off("chat:message", handleNewMessage);
        };
    }, [socket, session.user?.email]);

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

    const handleToggleHand = () => {
        if (!socket) return;
        socket.emit("room:hand:toggle", {
            roomId,
            identity: myIdentity,
            raised: !myHandRaised,
            user: {
                id: session.user?.id,
                name: session.user?.name,
                image: session.user?.image,
            },
        });
    };

    return (
        <div className="fixed inset-0 flex flex-col bg-[#0a0c10]">
            <RoomHeader roomName={roomName} session={session} />

            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 overflow-hidden">
                    <ParticipantGrid />
                </div>

                {chatOpen && (
                    <div className="hidden lg:flex">
                        <ChatPanel
                            roomId={roomId}
                            activePanel={activePanel}
                            onPanelChange={setActivePanel}
                            onClose={() => setChatOpen(false)}
                            session={session}
                            participantCount={participants.length}
                            isHost={isHost}
                            isOverflow={isOverflow}
                            raisedHands={raisedHands}
                        />
                    </div>
                )}

                <AnimatePresence>
                    {chatOpen && (
                        <>
                            <motion.div
                                key="backdrop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                                onClick={() => setChatOpen(false)}
                            />
                            <motion.div
                                key="drawer"
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                className="fixed bottom-0 right-0 z-40 lg:hidden"
                                style={{ height: "100vh" }}
                            >
                                <ChatPanel
                                    roomId={roomId}
                                    activePanel={activePanel}
                                    onPanelChange={setActivePanel}
                                    onClose={() => setChatOpen(false)}
                                    session={session}
                                    participantCount={participants.length}
                                    isHost={isHost}
                                    isOverflow={isOverflow}
                                    raisedHands={raisedHands}
                                    isDrawer
                                />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            <ControlBar
                chatOpen={chatOpen}
                onToggleChat={handleToggleChat}
                participantCount={participants.length}
                initialMic={initialMic}
                initialCam={initialCam}
                roomId={roomId}
                session={session}
                handRaised={myHandRaised}
                raisedHandsCount={raisedHands.length}
                onToggleHand={handleToggleHand}
                onShareRequest={(requester, socketId) => setShareRequester({ ...requester, socketId })}
            />
            <WaitingGuests roomId={roomId} session={session} isHost={isHost} />
            <ScreenShareRequest requester={shareRequester} onApprove={handleApproveShare} onReject={handleRejectShare} />
            <RoomTimerNotice />
            <RoomEndedModal />
        </div>
    );
}
