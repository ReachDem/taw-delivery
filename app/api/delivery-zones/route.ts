import { z } from "zod";
import prisma from "@/lib/prisma";
import {
    apiResponse,
    apiError,
    validateBody,
    parseSearchParams,
} from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-middleware";

// ============================================
// Validation Schemas
// ============================================

const createZoneSchema = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    city: z.string().min(2, "La ville doit contenir au moins 2 caractères"),
    baseFee: z.number().nonnegative("Le tarif doit être positif ou zéro"),
    sortOrder: z.number().int().optional(),
});

// ============================================
// GET /api/delivery-zones - List delivery zones
// ============================================

export async function GET(request: Request) {
    const [session, authError] = await requireAuth();
    if (authError) return authError;

    const params = parseSearchParams(request);
    const { agencyId, city, active } = params;

    // Build where clause
    const where: any = {};

    // Super Admins can see all zones
    if (session.user.role !== "SUPER_ADMIN") {
        // Get user's agency
        const userAgent = await prisma.agent.findUnique({
            where: { userId: session.user.id },
            select: { agencyId: true },
        });

        if (!userAgent) {
            return apiResponse([]);
        }

        // Filter by user's agency
        where.agencyId = userAgent.agencyId;
    } else if (agencyId) {
        where.agencyId = agencyId;
    }

    if (city) {
        where.city = { contains: city, mode: 'insensitive' };
    }

    if (active !== undefined) {
        where.isActive = active === 'true';
    }

    const zones = await prisma.deliveryZone.findMany({
        where,
        orderBy: [
            { city: 'asc' },
            { baseFee: 'asc' },
            { sortOrder: 'asc' },
            { name: 'asc' },
        ],
        include: {
            agency: {
                select: { id: true, name: true, city: true },
            },
        },
    });

    return apiResponse(zones);
}

// ============================================
// POST /api/delivery-zones - Create a delivery zone
// ============================================

export async function POST(request: Request) {
    const [session, authError] = await requireAuth();
    if (authError) return authError;

    // Only ADMIN and SUPER_ADMIN can create zones
    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        return apiError("Vous n'avez pas les droits pour créer une zone", 403);
    }

    const validation = await validateBody(request, createZoneSchema);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // Get user's agency
    let agencyId: string;

    if (session.user.role === "SUPER_ADMIN") {
        // Super admin must provide agencyId
        const body = await request.clone().json();
        if (!body.agencyId) {
            return apiError("L'ID de l'agence est requis", 400);
        }
        agencyId = body.agencyId;
    } else {
        const userAgent = await prisma.agent.findUnique({
            where: { userId: session.user.id },
            select: { agencyId: true },
        });

        if (!userAgent) {
            return apiError("Vous devez être associé à une agence", 403);
        }
        agencyId = userAgent.agencyId;
    }

    // Check if zone already exists for this agency
    const existing = await prisma.deliveryZone.findUnique({
        where: {
            agencyId_name: {
                agencyId,
                name: data.name,
            },
        },
    });

    if (existing) {
        return apiError("Cette zone existe déjà pour cette agence", 409);
    }

    const zone = await prisma.deliveryZone.create({
        data: {
            agencyId,
            name: data.name,
            city: data.city,
            baseFee: data.baseFee,
            sortOrder: data.sortOrder ?? 0,
        },
        include: {
            agency: {
                select: { id: true, name: true, city: true },
            },
        },
    });

    return apiResponse(zone, { status: 201 });
}
