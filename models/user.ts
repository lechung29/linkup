/** @format */

import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    image: string;
    provider: string;
    createdAt: Date;
    lastLoginAt: Date;
}

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    provider: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model<IUser>("Users", UserSchema);
