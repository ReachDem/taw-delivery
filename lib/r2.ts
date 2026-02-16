/**
 * Cloudflare R2 Storage Integration
 * Uses AWS S3-compatible SDK to interact with R2 buckets
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";

// ============================================
// R2 Client Configuration
// ============================================

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

// ============================================
// Upload Functions
// ============================================

/**
 * Upload a file buffer to R2
 * @param key - The storage key/path (e.g., "parcels/abc123.jpg")
 * @param body - File content as Buffer
 * @param contentType - MIME type of the file
 * @returns Public URL of the uploaded file
 */
export async function uploadToR2(
    key: string,
    body: Buffer,
    contentType: string
): Promise<string> {
    await r2Client.send(
        new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: body,
            ContentType: contentType,
        })
    );

    return getR2PublicUrl(key);
}

/**
 * Generate a presigned URL for direct client-side upload
 * @param key - The storage key/path
 * @param contentType - Expected MIME type
 * @param expiresIn - URL validity in seconds (default: 1 hour)
 * @returns Presigned upload URL
 */
export async function getUploadPresignedUrl(
    key: string,
    contentType: string,
    expiresIn = 3600
): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });

    return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Delete a file from R2
 * @param key - The storage key/path to delete
 */
export async function deleteFromR2(key: string): Promise<void> {
    await r2Client.send(
        new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        })
    );
}

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a unique storage key for a parcel photo
 * @param extension - File extension (e.g., "jpg", "png", "webp")
 * @returns Unique key like "parcels/abc123xyz.jpg"
 */
export function generateParcelPhotoKey(extension: string): string {
    return `parcels/${nanoid(12)}.${extension}`;
}

/**
 * Get the public URL for a stored file
 * @param key - The storage key/path
 * @returns Full public URL
 */
export function getR2PublicUrl(key: string): string {
    return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Extract the R2 key from a public URL
 * @param url - The full public URL
 * @returns The storage key or null if not a valid R2 URL
 */
export function getR2KeyFromUrl(url: string): string | null {
    if (!url.startsWith(R2_PUBLIC_URL)) return null;
    return url.replace(`${R2_PUBLIC_URL}/`, "");
}

// Allowed MIME types for parcel photos
export const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
];

// Max file size: 5MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Validate an image file before upload
 * @param contentType - MIME type
 * @param size - File size in bytes
 * @returns Error message or null if valid
 */
export function validateImageFile(contentType: string, size: number): string | null {
    if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
        return "Type de fichier non supporté. Utilisez JPG, PNG ou WebP.";
    }
    if (size > MAX_IMAGE_SIZE) {
        return "L'image ne doit pas dépasser 5 Mo.";
    }
    return null;
}
