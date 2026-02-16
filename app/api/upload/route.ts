import { NextRequest, NextResponse } from "next/server";
import { uploadToR2, generateParcelPhotoKey, validateImageFile } from "@/lib/r2";
import { requireAuth } from "@/lib/auth-middleware";

/**
 * POST /api/upload
 * Upload a parcel photo to R2
 * Protected: requires authenticated agent
 */
export async function POST(request: NextRequest) {
    const [session, authError] = await requireAuth();
    if (authError) return authError;

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "Aucun fichier fourni" },
                { status: 400 }
            );
        }

        // Validate file
        const validationError = validateImageFile(file.type, file.size);
        if (validationError) {
            return NextResponse.json(
                { error: validationError },
                { status: 400 }
            );
        }

        // Generate key and upload
        const extension = file.name.split(".").pop() || "jpg";
        const key = generateParcelPhotoKey(extension);
        const buffer = Buffer.from(await file.arrayBuffer());

        const url = await uploadToR2(key, buffer, file.type);

        return NextResponse.json({
            success: true,
            url,
            key,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Erreur lors de l'upload de l'image" },
            { status: 500 }
        );
    }
}
