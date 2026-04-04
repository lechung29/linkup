/** @format */

import mongoose, { Schema, Document } from "mongoose";

export interface IReaction {
    emoji: string;
    identities: string[];
}

export interface IFileData {
    url: string;
    name: string;
    size: number;
    mimeType: string;
}

export interface IMessage extends Document {
    roomId: string;
    identity: string;
    name: string;
    avatar: string;
    message: string;
    type: "text" | "image" | "file";
    fileData?: IFileData;
    reactions: IReaction[];
    createdAt: Date;
}

const ReactionSchema = new Schema<IReaction>({
    emoji: { type: String, required: true },
    identities: [{ type: String }],
});

const FileDataSchema = new Schema<IFileData>(
    {
        url: { type: String, required: true },
        name: { type: String, required: true },
        size: { type: Number, required: true },
        mimeType: { type: String, required: true },
    },
    { _id: false },
);

const MessageSchema = new Schema<IMessage>({
    roomId: { type: String, required: true, index: true },
    identity: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String, default: "" },
    message: { type: String, default: "" },
    type: { type: String, enum: ["text", "image", "file"], default: "text" },
    fileData: { type: FileDataSchema, default: undefined },
    reactions: [ReactionSchema],
    createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.models?.Message || mongoose.model<IMessage>("Message", MessageSchema);
export default Message;
