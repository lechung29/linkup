/** @format */

import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    return new Response("Socket.io requires custom server", { status: 200 });
}
