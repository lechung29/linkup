/** @format */

import mongoose, { Schema, Document } from "mongoose";

export interface IRoom extends Document {
    roomId: string;
    name: string;
    hostId: string;
    participants: string[];
    settings: {
        maxParticipants: number;
        muteOnEntry: boolean;
        waitingRoom: boolean;
    };
    createdAt: Date;
    isActive: boolean;
}

const RoomSchema = new Schema<IRoom>({
    roomId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    hostId: { type: String, required: true },
    participants: [{ type: String }],
    settings: {
        maxParticipants: { type: Number, default: 10 },
        muteOnEntry: { type: Boolean, default: false },
        waitingRoom: { type: Boolean, default: false },
    },
    createdAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
});

export default mongoose.models.Room || mongoose.model<IRoom>("Rooms", RoomSchema);
