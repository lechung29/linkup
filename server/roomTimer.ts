/** @format */

import { Server as SocketServer } from "socket.io";

const ROOM_DURATION = 60 * 60 * 1000;
const WARNING_BEFORE = 15 * 60 * 1000;

interface RoomTimer {
    startedAt: number;
    warningTimer: NodeJS.Timeout;
    kickTimer: NodeJS.Timeout;
}

const roomTimers: Record<string, RoomTimer> = {};

async function deleteRoomAndMessages(roomId: string) {
    try {
        const connectDB = (await import("../lib/mongodb")).default;
        const Room = (await import("../models/room")).default;
        const Message = (await import("../models/message")).default;
        await connectDB();
        await Room.findOneAndDelete({ roomId });
        await Message.deleteMany({ roomId });
        console.log(`[timer] Room ${roomId} → deleted`);
    } catch (err) {
        console.error("[timer] DB error:", err);
    }
}

export function startRoomTimer(io: SocketServer, roomId: string, startedAt: number) {
    if (roomTimers[roomId]) return;

    const warningAt = ROOM_DURATION - WARNING_BEFORE;
    const elapsed = Date.now() - startedAt;

    const warningDelay = Math.max(0, warningAt - elapsed);
    const kickDelay = Math.max(0, ROOM_DURATION - elapsed);

    console.log(`[timer] Room ${roomId} started — warning in ${Math.round(warningDelay / 1000)}s`);

    const warningTimer = setTimeout(() => {
        io.to(`room:${roomId}`).emit("room:warning", {
            message: "Phòng sẽ kết thúc sau 15 phút",
            minutesLeft: 15,
        });
    }, warningDelay);

    const kickTimer = setTimeout(async () => {
        console.log(`[timer] Room ${roomId} — time's up`);
        io.to(`room:${roomId}`).emit("room:ended", {
            message: "Phòng đã hết thời gian 1 tiếng",
        });
        await new Promise((r) => setTimeout(r, 2000));
        await deleteRoomAndMessages(roomId);
        stopRoomTimer(roomId);
    }, kickDelay);

    roomTimers[roomId] = { startedAt, warningTimer, kickTimer };
}

export function stopRoomTimer(roomId: string) {
    const timer = roomTimers[roomId];
    if (!timer) return;
    clearTimeout(timer.warningTimer);
    clearTimeout(timer.kickTimer);
    delete roomTimers[roomId];
}

export function getRoomTimeLeft(roomId: string): number | null {
    const timer = roomTimers[roomId];
    if (!timer) return null;
    return Math.max(0, ROOM_DURATION - (Date.now() - timer.startedAt));
}

export function getStartedAt(roomId: string): number | null {
    return roomTimers[roomId]?.startedAt ?? null;
}
