/** @format */

import crypto from "crypto";

const SECRET = process.env.MESSAGE_SECRET!;
const KEY = crypto.scryptSync(SECRET, "salt", 32);
const ALGORITHM = "aes-256-gcm";

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);

    const authTag = cipher.getAuthTag();
    return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(":");
}

export function decrypt(encryptedText: string): string {
    const [ivBase64, authTagBase64, encryptedBase64] = encryptedText.split(":");

    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");
    const encrypted = Buffer.from(encryptedBase64, "base64");

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
