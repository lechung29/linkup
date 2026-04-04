/** @format */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGE_LIMIT = 5 * 1024 * 1024;
const FILE_LIMIT = 10 * 1024 * 1024;

function uploadStream(buffer: Buffer, options: Record<string, unknown>): Promise<{ secure_url: string; public_id: string }> {
    return new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream(options, (error, result) => {
                if (error || !result) return reject(error ?? new Error("Upload failed"));
                resolve({ secure_url: result.secure_url, public_id: result.public_id });
            })
            .end(buffer);
    });
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const isImage = file.type.startsWith("image/");
        const limit = isImage ? IMAGE_LIMIT : FILE_LIMIT;

        if (file.size > limit) {
            return NextResponse.json({ error: `File too large. Max ${isImage ? "5 MB" : "10 MB"}.` }, { status: 413 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await uploadStream(buffer, {
            folder: "linkup/chat",
            resource_type: isImage ? "image" : "raw",
            use_filename: true,
            unique_filename: true,
            ...(isImage && { fetch_format: "auto", quality: "auto" }),
        });

        return NextResponse.json({
            url: result.secure_url,
            publicId: result.public_id,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Upload failed",
            },
            { status: 500 },
        );
    }
}
