import { z } from "zod";
import prisma from "@/lib/prisma";
import {
    apiResponse,
    validateBody,
} from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-middleware";

// ============================================
// Validation Schemas
// ============================================

const createClientSchema = z.object({
    firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
    lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    phone: z.string().min(8, "Le numéro de téléphone doit contenir au moins 8 caractères"),
    email: z.string().email("Email invalide").optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    preferredLanguage: z.enum(["fr", "wo"]).default("fr"),
});

// ============================================
// GET /api/clients - List clients
// ============================================

export async function GET(request: Request) {
    const [session, authError] = await requireAuth();
    if (authError) return authError;

    const clients = await prisma.client.findMany({
        orderBy: { lastName: "asc" },
        take: 100, // Limit results
    });

    return apiResponse(clients);
}

// ============================================
// POST /api/clients - Create or find client by phone
// ============================================

export async function POST(request: Request) {
    const [session, authError] = await requireAuth();
    if (authError) return authError;

    const validation = await validateBody(request, createClientSchema);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // Try to find existing client by phone
    const existingClient = await prisma.client.findUnique({
        where: { phone: data.phone },
    });

    if (existingClient) {
        // Return existing client (200 instead of 201)
        return apiResponse(existingClient, { status: 200 });
    }

    // Create new client
    const client = await prisma.client.create({
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            email: data.email,
            address: data.address,
            city: data.city,
            preferredLanguage: data.preferredLanguage,
        },
    });

    return apiResponse(client, { status: 201 });
}
