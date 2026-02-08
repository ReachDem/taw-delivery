import { z } from "zod";
import prisma from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/client";
import {
    apiResponse,
    apiError,
    validateBody,
} from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth-middleware";

// ============================================
// Validation Schemas
// ============================================

const createDriverSchema = z.object({
    userId: z.string().cuid("ID utilisateur invalide"),
    agencyId: z.string().uuid("ID agence invalide"),
    firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
    lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    phone: z.string().optional(),
});

// ============================================
// GET /api/drivers - List all drivers
// ============================================

export async function GET() {
    const [session, authError] = await requireAdmin();
    if (authError) return authError;

    const drivers = await prisma.driver.findMany({
        orderBy: { lastName: "asc" },
        include: {
            user: {
                select: { id: true, name: true, email: true, role: true },
            },
            agency: {
                select: { id: true, name: true, city: true },
            },
        },
    });

    return apiResponse(drivers);
}

// ============================================
// POST /api/drivers - Create driver
// ============================================

export async function POST(request: Request) {
    const [session, authError] = await requireAdmin();
    if (authError) return authError;

    const validation = await validateBody(request, createDriverSchema);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // Verify user exists and has correct role
    const user = await prisma.user.findUnique({
        where: { id: data.userId },
    });

    if (!user) {
        return apiError("Utilisateur non trouvé", 404);
    }

    if (user.role !== Role.DRIVER) {
        return apiError("L'utilisateur doit avoir le rôle DRIVER", 400);
    }

    // Check if user is already a driver
    const existingDriver = await prisma.driver.findUnique({
        where: { userId: data.userId },
    });

    if (existingDriver) {
        return apiError("Cet utilisateur est déjà un livreur", 409);
    }

    // Verify agency exists
    const agency = await prisma.agency.findUnique({
        where: { id: data.agencyId },
    });

    if (!agency) {
        return apiError("Agence non trouvée", 404);
    }

    const driver = await prisma.driver.create({
        data: {
            userId: data.userId,
            agencyId: data.agencyId,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
        },
        include: {
            user: {
                select: { id: true, name: true, email: true, role: true },
            },
            agency: {
                select: { id: true, name: true, city: true },
            },
        },
    });

    return apiResponse(driver, { status: 201 });
}
