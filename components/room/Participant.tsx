/** @format */

"use client";

import { useTracks, VideoTrack, useIsSpeaking, TrackReference, TrackReferenceOrPlaceholder, useParticipants } from "@livekit/components-react";
import { isTrackReference } from "@livekit/components-core";
import { Track } from "livekit-client";
import { MicOff, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useRoomStore } from "@/store/useRoomStore";
import { useEffect } from "react";

const MAX_VISIBLE = 8;
const MAX_SIDEBAR = 3;

const colors = ["bg-violet-500", "bg-orange-400", "bg-blue-500", "bg-green-500", "bg-pink-500", "bg-yellow-500"];

function ParticipantTile({ trackRef, className }: { trackRef: TrackReferenceOrPlaceholder; className?: string }) {
    const participant = trackRef.participant;
    const isSpeaking = useIsSpeaking(participant);
    const isMuted = !participant.isMicrophoneEnabled;
    const isScreenShare = trackRef.source === Track.Source.ScreenShare;
    const hasVideo = isTrackReference(trackRef) && !trackRef.publication.isMuted;

    const initials =
        participant.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() ?? "?";
    const color = colors[participant.identity.charCodeAt(0) % colors.length];

    const avatarUrl = (() => {
        try {
            const meta = participant.metadata ? JSON.parse(participant.metadata) : {};
            return meta.image ?? "";
        } catch {
            return "";
        }
    })();

    return (
        <div
            className={cn(
                "relative rounded-xl overflow-hidden bg-[#111318] transition-all duration-300",
                isSpeaking && !isScreenShare && "ring-2 ring-[#6346ff] ring-offset-1 ring-offset-[#0a0c10]",
                isScreenShare && "ring-2 ring-emerald-500 ring-offset-1 ring-offset-[#0a0c10]",
                className,
            )}
        >
            {hasVideo ? (
                <VideoTrack trackRef={trackRef as TrackReference} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <Avatar className="w-10 h-10 sm:w-16 sm:h-16">
                        <AvatarImage src={avatarUrl} alt="user-avatar" />
                        <AvatarFallback className={`${color} text-white text-base sm:text-xl font-bold`}>{initials}</AvatarFallback>
                    </Avatar>
                </div>
            )}

            <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2">
                <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-md">
                    {participant.name || participant.identity}
                    {isScreenShare && " — Screen"}
                </span>
            </div>

            {isMuted && !isScreenShare && (
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-black/60 backdrop-blur-sm rounded-full p-1">
                    <MicOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/70" />
                </div>
            )}
        </div>
    );
}

function OverflowTile({ count, className }: { count: number; className?: string }) {
    return (
        <div className={cn("relative rounded-xl overflow-hidden bg-[#111318] flex items-center justify-center", className)}>
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white/50" />
                </div>
                <span className="text-white/60 text-xs sm:text-sm font-medium">+{count} more</span>
                <span className="text-white/30 text-[10px] sm:text-xs hidden sm:block">Manage in Participants</span>
            </div>
        </div>
    );
}

function ScreenShareLayoutDesktop({ screenTracks, cameraTracks, overflowCount }: { screenTracks: TrackReferenceOrPlaceholder[]; cameraTracks: TrackReferenceOrPlaceholder[]; overflowCount: number }) {
    const sidebarTracks = cameraTracks.slice(0, MAX_SIDEBAR);
    const sidebarOverflow = overflowCount + (cameraTracks.length - sidebarTracks.length);

    return (
        <div className="flex gap-2 p-3 h-full">
            <div className="flex-1 flex flex-col gap-2">
                {screenTracks.map((trackRef) => (
                    <ParticipantTile key={`${trackRef.participant.identity}-${trackRef.source}`} trackRef={trackRef} className="flex-1" />
                ))}
            </div>
            <div className="w-52 flex flex-col gap-2">
                {sidebarTracks.map((trackRef) => (
                    <ParticipantTile key={`${trackRef.participant.identity}-${trackRef.source}`} trackRef={trackRef} className="flex-1" />
                ))}
                {sidebarOverflow > 0 && <OverflowTile count={sidebarOverflow} className="flex-1" />}
            </div>
        </div>
    );
}

function ScreenShareLayoutMobile({ screenTracks, cameraTracks, overflowCount }: { screenTracks: TrackReferenceOrPlaceholder[]; cameraTracks: TrackReferenceOrPlaceholder[]; overflowCount: number }) {
    const bottomTracks = cameraTracks.slice(0, 4);
    const bottomOverflow = overflowCount + (cameraTracks.length - bottomTracks.length);
    const bottomCount = bottomTracks.length + (bottomOverflow > 0 ? 1 : 0);

    const gridCols = bottomCount <= 2 ? "grid-cols-2" : bottomCount <= 3 ? "grid-cols-3" : "grid-cols-4";

    return (
        <div className="flex flex-col gap-2 p-2 h-full">
            <div className="flex flex-col gap-2" style={{ flex: "0 0 65%" }}>
                {screenTracks.map((trackRef) => (
                    <ParticipantTile key={`${trackRef.participant.identity}-${trackRef.source}`} trackRef={trackRef} className="flex-1" />
                ))}
            </div>
            <div className={`grid ${gridCols} gap-2 flex-1`}>
                {bottomTracks.map((trackRef) => (
                    <ParticipantTile key={`${trackRef.participant.identity}-${trackRef.source}`} trackRef={trackRef} />
                ))}
                {bottomOverflow > 0 && <OverflowTile count={bottomOverflow} />}
            </div>
        </div>
    );
}

function NormalLayout({ tracks, overflowCount }: { tracks: TrackReferenceOrPlaceholder[]; overflowCount: number }) {
    const count = tracks.length + (overflowCount > 0 ? 1 : 0);

    const gridCols =
        count <= 1 ? "grid-cols-1" : count === 2 ? "grid-cols-1 sm:grid-cols-2" : count <= 4 ? "grid-cols-2" : count <= 6 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

    return (
        <div className={`grid ${gridCols} gap-2 p-2 sm:p-3 h-full auto-rows-fr`}>
            {tracks.map((trackRef) => (
                <ParticipantTile key={`${trackRef.participant.identity}-${trackRef.source}`} trackRef={trackRef} />
            ))}
            {overflowCount > 0 && <OverflowTile count={overflowCount} />}
        </div>
    );
}

export default function ParticipantGrid() {
    const allParticipants = useParticipants();
    const { pinnedIdentities, setPinnedIdentities } = useRoomStore();

    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: false },
    );

    const allIdentities = allParticipants.map((p) => p.identity);
    const isOverflow = allParticipants.length > MAX_VISIBLE;

    useEffect(() => {
        if (!isOverflow) {
            setPinnedIdentities(allIdentities);
            return;
        }
        setPinnedIdentities((prev: string[]) => {
            const stillHere = prev.filter((id) => allIdentities.includes(id));
            if (stillHere.length < MAX_VISIBLE) {
                const notPinned = allIdentities.filter((id) => !stillHere.includes(id));
                const toAdd = notPinned.slice(0, MAX_VISIBLE - stillHere.length);
                return [...stillHere, ...toAdd];
            }
            return stillHere.slice(0, MAX_VISIBLE);
        });
    }, [allParticipants.length]);

    const screenTracks = tracks.filter((t) => t.source === Track.Source.ScreenShare);
    const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera);
    const visibleCameraTracks = isOverflow ? cameraTracks.filter((t) => pinnedIdentities.includes(t.participant.identity)) : cameraTracks;
    const overflowCount = isOverflow ? allParticipants.length - MAX_VISIBLE : 0;

    if (screenTracks.length > 0) {
        return (
            <>
                <div className="hidden lg:block h-full">
                    <ScreenShareLayoutDesktop screenTracks={screenTracks} cameraTracks={visibleCameraTracks} overflowCount={overflowCount} />
                </div>
                <div className="lg:hidden h-full">
                    <ScreenShareLayoutMobile screenTracks={screenTracks} cameraTracks={visibleCameraTracks} overflowCount={overflowCount} />
                </div>
            </>
        );
    }

    return <NormalLayout tracks={visibleCameraTracks} overflowCount={overflowCount} />;
}
