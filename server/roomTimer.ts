/** @format */

import { Server as SocketServer } from "socket.io";

export const ROOM_DURATION = 60 * 60 * 1000;
export const WARNING_BEFORE = 15 * 60 * 1000;

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

    const warningTimer = setTimeout(() => {
        io.to(`room:${roomId}`).emit("room:warning", {
            message: "The meeting will end in 15 minutes",
            minutesLeft: 15,
        });
    }, warningDelay);

    const kickTimer = setTimeout(async () => {
        io.to(`room:${roomId}`).emit("room:ended", {
            message: "The meeting has reached its 1-hour limit",
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
