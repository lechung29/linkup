/** @format */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { decrypt } from "@/lib/crypto";
import Message from "@/models/message";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { emoji } = await req.json();
    const identity = session.user?.email!;

    await connectDB();

    const msg = await Message.findById(id);
    if (!msg) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    const existing = msg.reactions.find((r: any) => r.emoji === emoji);

    if (existing) {
        if (existing.identities.includes(identity)) {
            existing.identities = existing.identities.filter((id: string) => id !== identity);
            if (existing.identities.length === 0) {
                msg.reactions = msg.reactions.filter((r: any) => r.emoji !== emoji);
            }
        } else {
            existing.identities.push(identity);
        }
    } else {
        msg.reactions.push({ emoji, identities: [identity] });
    }

    await msg.save();

    return NextResponse.json({
        message: {
            ...msg.toObject(),
            message: decrypt(msg.message),
        },
    });
}
