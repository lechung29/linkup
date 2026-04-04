/** @format */

import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const auth = req.headers.get("authorization");

        if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response("Unauthorized", { status: 401 });
        }
        console.log("Cron job running...");

        return NextResponse.json({
            success: true,
            message: "Cron executed",
            time: new Date().toISOString(),
        });
    } catch (err) {
        console.error("Cron error:", err);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
