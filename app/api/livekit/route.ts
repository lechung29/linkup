/** @format */

import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const room = req.nextUrl.searchParams.get("room");
    if (!room) return NextResponse.json({ error: "Room required" }, { status: 400 });

    const token = new AccessToken(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!, {
        identity: session.user?.email!,
        name: session.user?.name!,
        metadata: JSON.stringify({ image: session.user?.image ?? "" }),
    });

    token.addGrant({
        roomJoin: true,
        room,
        canPublish: true,
        canSubscribe: true,
    });

    return NextResponse.json({ token: await token.toJwt() });
}
