/** @format */

import { Server as HTTPServer } from "http";
import { Server as SocketServer } from "socket.io";
import { startRoomTimer, stopRoomTimer, getRoomTimeLeft, getStartedAt, WARNING_BEFORE } from "./roomTimer";

let io: SocketServer;
const roomIdentityMap: Record<string, Record<string, string>> = {};

// Server-side: roomId → host's socketId (set on "host:join", never trusts client).
const roomHostSocketMap: Record<string, string> = {};

// Server-side: roomId → list of guests waiting for approval.
// Kept so we can replay them if the host joins AFTER a guest already sent a request.
const roomPendingGuests: Record<string, Array<{ socketId: string; user: any }>> = {};

async function handleHostLeft(io: SocketServer, roomId: string) {
    const waitingSockets = await io.in(`waiting:${roomId}`).allSockets();
    const roomSockets = await io.in(`room:${roomId}`).allSockets();

    if (waitingSockets.size > 0) {
        io.to(`waiting:${roomId}`).emit("host:left");
    }

    delete roomPendingGuests[roomId];
    if (roomSockets.size === 0) return;

    try {
        const connectDB = (await import("../lib/mongodb")).default;
        const Room = (await import("../models/room")).default;
        await connectDB();
        await Room.findOneAndUpdate({ roomId }, { $set: { joinPolicy: "always" } });
    } catch (err) {
        console.error("[room] handleHostLeft DB error:", err);
    }
}

async function deleteRoomIfEmpty(io: SocketServer, roomId: string) {
    const socketsInRoom = await io.in(`room:${roomId}`).allSockets();
    if (socketsInRoom.size > 0) return;

    stopRoomTimer(roomId);
    delete roomIdentityMap[roomId];
    delete roomHostSocketMap[roomId];
    delete roomPendingGuests[roomId];

    try {
        const connectDB = (await import("../lib/mongodb")).default;
        const Room = (await import("../models/room")).default;
        const Message = (await import("../models/message")).default;
        await connectDB();
        await Room.findOneAndDelete({ roomId });
        await Message.deleteMany({ roomId });
    } catch (err) {
        console.error("[room] DB error:", err);
    }
}

export function getSocketServer(httpServer?: HTTPServer): SocketServer {
    if (!io) {
        io = new SocketServer(httpServer!, {
            path: "/api/socket",
            addTrailingSlash: false,
            cors: {
                origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
                methods: ["GET", "POST"],
            },
        });

        io.on("connection", (socket) => {
            console.log("Socket connected:", socket.id);

            socket.on("host:join", (roomId: string) => {
                socket.join(`host:${roomId}`);
                roomHostSocketMap[roomId] = socket.id;

                const pending = roomPendingGuests[roomId] ?? [];
                for (const guest of pending) {
                    socket.emit("guest:waiting", { socketId: guest.socketId, roomId, user: guest.user });
                }
            });

            socket.on("guest:request", ({ roomId, user }: any) => {
                socket.join(`waiting:${roomId}`);
                if (!roomPendingGuests[roomId]) roomPendingGuests[roomId] = [];
                roomPendingGuests[roomId] = roomPendingGuests[roomId].filter((g) => g.socketId !== socket.id);
                roomPendingGuests[roomId].push({ socketId: socket.id, user });

                io.to(`host:${roomId}`).emit("guest:waiting", { socketId: socket.id, roomId, user });
            });

            socket.on("host:approve", ({ socketId, roomId }: any) => {
                io.to(socketId).emit("guest:approved", { roomId });
                if (roomPendingGuests[roomId]) {
                    roomPendingGuests[roomId] = roomPendingGuests[roomId].filter((g) => g.socketId !== socketId);
                }
            });

            socket.on("host:reject", ({ socketId, roomId }: any) => {
                io.to(socketId).emit("guest:rejected", { roomId });
                if (roomPendingGuests[roomId]) {
                    roomPendingGuests[roomId] = roomPendingGuests[roomId].filter((g) => g.socketId !== socketId);
                }
            });

            socket.on("room:join", async ({ roomId, identity }: { roomId: string; identity: string }) => {
                socket.join(`room:${roomId}`);
                socket.data.roomId = roomId;
                socket.data.identity = identity;

                if (!roomIdentityMap[roomId]) roomIdentityMap[roomId] = {};
                roomIdentityMap[roomId][identity] = socket.id;

                const socketsInRoom = await io.in(`room:${roomId}`).allSockets();

                if (socketsInRoom.size === 1) {
                    const now = Date.now();
                    startRoomTimer(io, roomId, now);

                    try {
                        const connectDB = (await import("../lib/mongodb")).default;
                        const Room = (await import("../models/room")).default;
                        await connectDB();
                        await Room.findOneAndUpdate({ roomId }, { startedAt: new Date(now) });
                    } catch (err) {
                        console.error("[room] startedAt error:", err);
                    }
                }

                const timeLeft = getRoomTimeLeft(roomId);
                const startedAt = getStartedAt(roomId);

                socket.emit("room:sync", { startedAt, timeLeft });

                if (timeLeft !== null && timeLeft <= WARNING_BEFORE) {
                    const minutesLeft = Math.floor(timeLeft / 60000);
                    socket.emit("room:warning", {
                        message: `This meeting will end in ${minutesLeft} minutes`,
                        minutesLeft,
                    });
                }
            });

            socket.on("chat:send", ({ roomId, message }: { roomId: string; message: any }) => {
                io.to(`room:${roomId}`).emit("chat:message", message);
            });

            socket.on("chat:reaction", ({ roomId, message }: { roomId: string; message: any }) => {
                io.to(`room:${roomId}`).emit("chat:reaction_update", message);
            });

            socket.on("screenshare:request", ({ roomId, requester, sharerIdentity }: any) => {
                const sharerSocketId = roomIdentityMap[roomId]?.[sharerIdentity];
                if (!sharerSocketId) {
                    socket.emit("screenshare:approved");
                    return;
                }
                io.to(sharerSocketId).emit("screenshare:incoming_request", {
                    requesterSocketId: socket.id,
                    roomId,
                    requester,
                });
            });

            socket.on("screenshare:approve", ({ requesterSocketId }: any) => {
                socket.emit("screenshare:stop_yours");
                io.to(requesterSocketId).emit("screenshare:approved");
            });

            socket.on("screenshare:reject", ({ requesterSocketId }: any) => {
                io.to(requesterSocketId).emit("screenshare:rejected");
            });

            socket.on("room:leave", async ({ roomId, identity }: { roomId: string; identity: string }) => {
                const wasHost = roomHostSocketMap[roomId] === socket.id;

                socket.leave(`room:${roomId}`);
                if (roomIdentityMap[roomId]) delete roomIdentityMap[roomId][identity];
                socket.data.roomId = null;
                socket.data.identity = null;

                if (wasHost) {
                    delete roomHostSocketMap[roomId];
                    await handleHostLeft(io, roomId);
                }
                await deleteRoomIfEmpty(io, roomId);
            });

            socket.on("disconnect", async () => {
                const roomId = socket.data.roomId;
                const identity = socket.data.identity;

                for (const rid in roomPendingGuests) {
                    roomPendingGuests[rid] = roomPendingGuests[rid].filter((g) => g.socketId !== socket.id);
                }

                if (!roomId) return;

                const wasHost = roomHostSocketMap[roomId] === socket.id;
                if (identity && roomIdentityMap[roomId]) delete roomIdentityMap[roomId][identity];

                if (wasHost) {
                    delete roomHostSocketMap[roomId];
                    await handleHostLeft(io, roomId);
                }
                await deleteRoomIfEmpty(io, roomId);
            });
        });
    }

    return io;
}
