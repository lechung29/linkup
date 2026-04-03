/** @format */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import Room from "@/models/room";
import RoomClient from "@/components/room/RoomClient";

interface PageProps {
    params: Promise<{ roomId: string }>;
}

export default async function RoomPage({ params }: PageProps) {
    const session = await auth();
    if (!session) redirect("/login");

    const { roomId } = await params;

    await connectDB();
    const room = await Room.findOne({ roomId, isActive: true });
    if (!room) redirect("/");

    return <RoomClient roomId={roomId} roomName={room.name || `Room ${roomId}`} hostId={room.hostId} joinPolicy={room.joinPolicy} session={session} />;
}
