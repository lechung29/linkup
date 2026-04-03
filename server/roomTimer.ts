/** @format */

import { Server as SocketServer } from "socket.io";

const ROOM_DURATION = 60 * 60 * 1000; // 60 phút
const WARNING_BEFORE = 15 * 60 * 1000; // cảnh báo trước 15 phút

interface RoomTimer {
    startedAt: number;
    warningTimer: NodeJS.Timeout;
    kickTimer: NodeJS.Timeout;
}

const roomTimers: Record<string, RoomTimer> = {};

export function startRoomTimer(io: SocketServer, roomId: string) {
    if (roomTimers[roomId]) return;

    const startedAt = Date.now();
    const warningAt = ROOM_DURATION - WARNING_BEFORE;


    const warningTimer = setTimeout(() => {
        console.log(`[timer] Room ${roomId} — 15 minutes warning`);
        io.to(`room:${roomId}`).emit("room:warning", {
            message: "Phòng sẽ kết thúc sau 15 phút",
            minutesLeft: 15,
        });
    }, warningAt);

    const kickTimer = setTimeout(async () => {
        console.log(`[timer] Room ${roomId} — time's up, kicking all`);
        io.to(`room:${roomId}`).emit("room:ended", {
            message: "Phòng đã hết thời gian 1 tiếng",
        });

        try {
            const connectDB = (await import("../lib/mongodb")).default;
            const Room = (await import("../models/room")).default;
            await connectDB();
            await Room.findOneAndUpdate({ roomId }, { isActive: false });
            console.log(`[timer] Room ${roomId} deactivated in DB`);
        } catch (err) {
            console.error("[timer] DB error:", err);
        }

        stopRoomTimer(roomId);
    }, ROOM_DURATION);

    roomTimers[roomId] = { startedAt, warningTimer, kickTimer };
}

export function stopRoomTimer(roomId: string) {
    const timer = roomTimers[roomId];
    if (!timer) return;

    clearTimeout(timer.warningTimer);
    clearTimeout(timer.kickTimer);
    delete roomTimers[roomId];
    console.log(`[timer] Room ${roomId} timer stopped`);
}

export function getRoomTimeLeft(roomId: string): number | null {
    const timer = roomTimers[roomId];
    if (!timer) return null;
    return ROOM_DURATION - (Date.now() - timer.startedAt);
}
