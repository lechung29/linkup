/** @format */

"use client";

import { useState } from "react";
import { Session } from "next-auth";
import VideoRoom from "./VideoRoom";
import WaitingRoom from "./WaitingRoom";
import PreJoin from "./PreJoin";

interface RoomClientProps {
    roomId: string;
    roomName: string;
    hostId: string;
    joinPolicy: "always" | "approval";
    startedAt: string;
    session: Session;
}

type Stage = "prejoin" | "waiting" | "room";

interface JoinOptions {
    micEnabled: boolean;
    camEnabled: boolean;
}

export default function RoomClient({ roomId, roomName, hostId, joinPolicy, session, startedAt }: RoomClientProps) {
    const isHost = session.user?.id === hostId;
    const [stage, setStage] = useState<Stage>("prejoin");
    const [joinOptions, setJoinOptions] = useState<JoinOptions>({ micEnabled: true, camEnabled: true });

    const handlePreJoin = (options: JoinOptions) => {
        setJoinOptions(options);
        if (isHost || joinPolicy === "always") {
            setStage("room");
        } else {
            setStage("waiting");
        }
    };

    if (stage === "prejoin") {
        return <PreJoin roomId={roomId} roomName={roomName} session={session} onJoin={handlePreJoin} />;
    }

    if (stage === "waiting") {
        return <WaitingRoom roomId={roomId} session={session} onApproved={() => setStage("room")} />;
    }

    return <VideoRoom roomId={roomId} roomName={roomName} hostId={hostId} session={session} initialMic={joinOptions.micEnabled} initialCam={joinOptions.camEnabled} startedAt={startedAt}/>;
}
