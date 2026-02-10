import { z } from "zod";
import prisma from "@/lib/prisma";
import {
    apiResponse,
    apiError,
    validateBody,
    notFoundError,
    forbiddenError,
} from "@/lib/api-helpers";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth-middleware";

// ============================================
// Validation Schemas
// ============================================

const updateAgencySchema = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").optional(),
    address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères").optional(),
    city: z.string().min(2, "La ville doit contenir au moins 2 caractères").optional(),
    phone: z.string().optional().nullable(),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

// ============================================
// GET /api/agencies/[id] - Get agency details
// ============================================

export async function GET(request: Request, { params }: RouteParams) {
    const [session, authError] = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;

    const agency = await prisma.agency.findUnique({
        where: { id },
        include: {
            agents: {
                include: {
                    user: {
                        select: { id: true, name: true, email: true, role: true },
                    },
                },
            },
            drivers: {
                include: {
                    user: {
                        select: { id: true, name: true, email: true, role: true },
                    },
                },
            },
            _count: {
                select: {
                    orders: true,
                    timeSlots: true,
                },
            },
        },
    });

    if (!agency) {
        return notFoundError("Agence");
    }

    // Verify user has access to this agency (unless SUPER_ADMIN)
    if (session.user.role !== "SUPER_ADMIN") {
        if (!agency.organizationId) {
            return notFoundError("Agence");
        }
        const membership = await prisma.member.findFirst({
            where: {
                userId: session.user.id,
                organizationId: agency.organizationId,
            },
        });
        if (!membership) {
            return forbiddenError();
        }
    }

    return apiResponse(agency);
}

// ============================================
// PATCH /api/agencies/[id] - Update agency (SUPER_ADMIN only)
// ============================================

export async function PATCH(request: Request, { params }: RouteParams) {
    const [session, authError] = await requireSuperAdmin();
    if (authError) return authError;

    const { id } = await params;

    const validation = await validateBody(request, updateAgencySchema);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // Check if agency exists
    const existing = await prisma.agency.findUnique({
        where: { id },
    });

    if (!existing) {
        return notFoundError("Agence");
    }

    // If changing name/city, check for duplicates
    if (data.name || data.city) {
        const duplicate = await prisma.agency.findFirst({
            where: {
                id: { not: id },
                name: data.name || existing.name,
                city: data.city || existing.city,
            },
        });

        if (duplicate) {
            return apiError("Une agence avec ce nom existe déjà dans cette ville", 409);
        }
    }

    const agency = await prisma.agency.update({
        where: { id },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.address && { address: data.address }),
            ...(data.city && { city: data.city }),
            ...(data.phone !== undefined && { phone: data.phone }),
        },
    });

    return apiResponse(agency);
}

// ============================================
// DELETE /api/agencies/[id] - Delete agency (SUPER_ADMIN only)
// ============================================

export async function DELETE(request: Request, { params }: RouteParams) {
    const [session, authError] = await requireSuperAdmin();
    if (authError) return authError;

    const { id } = await params;

    // Check if agency exists
    const existing = await prisma.agency.findUnique({
        where: { id },
        include: {
            _count: {
                select: { orders: true, agents: true, drivers: true },
            },
        },
    });

    if (!existing) {
        return notFoundError("Agence");
    }

    // Prevent deletion if agency has related records
    if (existing._count.orders > 0) {
        return apiError("Impossible de supprimer une agence avec des commandes", 409);
    }

    if (existing._count.agents > 0 || existing._count.drivers > 0) {
        return apiError("Impossible de supprimer une agence avec du personnel", 409);
    }

    await prisma.agency.delete({
        where: { id },
    });

    return apiResponse({ deleted: true });
}
