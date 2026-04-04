/** @format */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { encrypt, decrypt } from "@/lib/crypto";
import Message from "@/models/message";

type MessageType = "text" | "image" | "file";

type RequestBody = {
    roomId?: string;
    message?: string;
    type?: MessageType;
    fileData?: {
        url: string;
        name: string;
        size: number;
        mimeType: string;
    };
};

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

    const body = (await req.json()) as RequestBody;
    const { roomId, message = "", type, fileData } = body;

    if (!roomId || (!message && !fileData)) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await connectDB();

    const resolvedType: MessageType = type ?? (fileData?.mimeType?.startsWith("image/") ? "image" : fileData ? "file" : "text");

    const msg = await Message.create({
        roomId,
        identity: session.user?.email ?? "",
        name: session.user?.name ?? "Unknown",
        avatar: session.user?.image ?? "",
        type: resolvedType,
        fileData: fileData ?? undefined,
        message: encrypt(message),
        reactions: [],
    });

    return NextResponse.json(
        {
            message: {
                ...msg.toObject(),
                message,
                fileData,
            },
        },
        { status: 201 },
    );
}
