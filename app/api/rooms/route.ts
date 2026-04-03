/** @format */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { nanoid } from "nanoid";
import Room from "@/models/room";

// POST — tạo phòng mới
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { roomId, name, joinPolicy } = await req.json();
    if (!roomId) return NextResponse.json({ error: "Room ID required" }, { status: 400 });

    await connectDB();

    const existing = await Room.findOne({ roomId });
    if (existing) return NextResponse.json({ error: "Room already exists" }, { status: 409 });

    const room = await Room.create({
        roomId,
        name: name || `Room ${roomId}`,
        hostId: session.user.id,
        joinPolicy: joinPolicy ?? "always",
    });

    return NextResponse.json({ room }, { status: 201 });
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roomId = req.nextUrl.searchParams.get("roomId");
    if (!roomId) return NextResponse.json({ error: "Room ID required" }, { status: 400 });

    await connectDB();

    const room = await Room.findOne({ roomId, isActive: true });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    return NextResponse.json({
        room: {
            roomId: room.roomId,
            name: room.name,
            hostId: room.hostId,
            joinPolicy: room.joinPolicy,
        },
    });
}
