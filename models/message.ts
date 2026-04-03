/** @format */

import mongoose, { Schema, Document } from "mongoose";

export interface IReaction {
    emoji: string;
    identities: string[];
}

export interface IMessage extends Document {
    roomId: string;
    identity: string;
    name: string;
    avatar: string;
    message: string;
    reactions: IReaction[];
    createdAt: Date;
}

const ReactionSchema = new Schema<IReaction>({
    emoji: { type: String, required: true },
    identities: [{ type: String }],
});

const MessageSchema = new Schema<IMessage>({
    roomId: { type: String, required: true, index: true },
    identity: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String, default: "" },
    message: { type: String, required: true },
    reactions: [ReactionSchema],
    createdAt: { type: Date, default: Date.now },
});
const Message = mongoose.models?.Message || mongoose.model<IMessage>("Message", MessageSchema);
export default Message;
