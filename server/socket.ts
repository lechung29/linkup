/** @format */

import { Server as HTTPServer } from "http";
import { Server as SocketServer } from "socket.io";
import { startRoomTimer, stopRoomTimer, getRoomTimeLeft } from "./roomTimer";

let io: SocketServer;
const roomIdentityMap: Record<string, Record<string, string>> = {};
const roomParticipantCount: Record<string, number> = {};

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
            });

            socket.on("guest:request", ({ roomId, user }: any) => {
                socket.join(`waiting:${roomId}`);
                io.to(`host:${roomId}`).emit("guest:waiting", { socketId: socket.id, roomId, user });
            });

            socket.on("host:approve", ({ socketId, roomId }: any) => {
                io.to(socketId).emit("guest:approved", { roomId });
            });

            socket.on("host:reject", ({ socketId, roomId }: any) => {
                io.to(socketId).emit("guest:rejected", { roomId });
            });

            socket.on("room:join", ({ roomId, identity }: { roomId: string; identity: string }) => {
                socket.join(`room:${roomId}`);
                socket.data.roomId = roomId;
                socket.data.identity = identity;

                if (!roomIdentityMap[roomId]) roomIdentityMap[roomId] = {};
                roomIdentityMap[roomId][identity] = socket.id;

                // Đếm participants
                roomParticipantCount[roomId] = (roomParticipantCount[roomId] || 0) + 1;

                // Start timer khi người đầu tiên vào
                if (roomParticipantCount[roomId] === 1) {
                    startRoomTimer(io, roomId);
                }

                // Gửi thời gian còn lại cho người mới vào
                const timeLeft = getRoomTimeLeft(roomId);
                if (timeLeft !== null) {
                    const minutesLeft = Math.floor(timeLeft / 60000);
                    if (minutesLeft <= 15) {
                        // Nếu còn <= 15 phút → báo ngay cho người mới vào
                        socket.emit("room:warning", {
                            message: `Phòng sẽ kết thúc sau ${minutesLeft} phút`,
                            minutesLeft,
                        });
                    }
                }

                console.log(`[room:join] ${identity} in room ${roomId} — ${roomParticipantCount[roomId]} participants`);
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

            socket.on("disconnect", async () => {
                const roomId = socket.data.roomId;
                const identity = socket.data.identity;

                if (roomId && identity) {
                    if (roomIdentityMap[roomId]) {
                        delete roomIdentityMap[roomId][identity];
                    }

                    roomParticipantCount[roomId] = Math.max(0, (roomParticipantCount[roomId] || 1) - 1);

                    if (roomParticipantCount[roomId] === 0) {
                        stopRoomTimer(roomId);
                        delete roomParticipantCount[roomId];
                        delete roomIdentityMap[roomId];

                        try {
                            const connectDB = (await import("../lib/mongodb")).default;
                            const Room = (await import("../models/room")).default;
                            await connectDB();
                            await Room.findOneAndUpdate({ roomId }, { isActive: false });
                            console.log(`[room] ${roomId} empty → deactivated in DB`);
                        } catch (err) {
                            console.error("[room] DB error:", err);
                        }
                    }
                }

                console.log("Socket disconnected:", socket.id);
            });
        });
    }

    return io;
}
