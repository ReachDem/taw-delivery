import { z } from "zod";
import prisma from "@/lib/prisma";
import {
    apiResponse,
    validateBody,
    notFoundError,
} from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-middleware";

// ============================================
// Validation Schemas
// ============================================

const updateClientSchema = z.object({
    firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères").optional(),
    lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères").optional(),
    email: z.string().email("Email invalide").optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    preferredLanguage: z.enum(["fr", "wo"]).optional(),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

// ============================================
// GET /api/clients/[id] - Get client details
// ============================================

export async function GET(request: Request, { params }: RouteParams) {
    const [session, authError] = await requireAuth();
    if (authError) return authError;

    const { id } = await params;

    const client = await prisma.client.findUnique({
        where: { id },
        include: {
            orders: {
                take: 10,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    amount: true,
                    createdAt: true,
                },
            },
        },
    });

    if (!client) {
        return notFoundError("Client");
    }

    return apiResponse(client);
}

// ============================================
// PATCH /api/clients/[id] - Update client
// ============================================

export async function PATCH(request: Request, { params }: RouteParams) {
    const [session, authError] = await requireAuth();
    if (authError) return authError;

    const { id } = await params;

    const validation = await validateBody(request, updateClientSchema);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // Check if client exists
    const existing = await prisma.client.findUnique({
        where: { id },
    });

    if (!existing) {
        return notFoundError("Client");
    }

    const client = await prisma.client.update({
        where: { id },
        data: {
            ...(data.firstName && { firstName: data.firstName }),
            ...(data.lastName && { lastName: data.lastName }),
            ...(data.email !== undefined && { email: data.email }),
            ...(data.address !== undefined && { address: data.address }),
            ...(data.city !== undefined && { city: data.city }),
            ...(data.preferredLanguage && { preferredLanguage: data.preferredLanguage }),
        },
    });

    return apiResponse(client);
}
