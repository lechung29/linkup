/** @format */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { encrypt, decrypt } from "@/lib/crypto";
import Message from "@/models/message";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roomId = req.nextUrl.searchParams.get("roomId");
    if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });

    await connectDB();
    const messages = await Message.find({ roomId }).sort({ createdAt: 1 }).limit(200);

    const decrypted = messages.map((msg) => ({
        ...msg.toObject(),
        message: decrypt(msg.message),
    }));

    return NextResponse.json({ messages: decrypted });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { roomId, message } = await req.json();
    if (!roomId || !message) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    await connectDB();

    const msg = await Message.create({
        roomId,
        identity: session.user?.email,
        name: session.user?.name,
        avatar: session.user?.image,
        message: encrypt(message),
        reactions: [],
    });

    return NextResponse.json(
        {
            message: {
                ...msg.toObject(),
                message: message,
            },
        },
        { status: 201 },
    );
}
