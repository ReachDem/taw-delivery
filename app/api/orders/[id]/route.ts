import { z } from "zod";
import prisma from "@/lib/prisma";
import { OrderStatus } from "@/lib/generated/prisma/client";
import {
    apiResponse,
    validateBody,
    notFoundError,
} from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-middleware";

// ============================================
// Validation Schemas
// ============================================

const updateOrderSchema = z.object({
    productDescription: z.string().min(3, "La description doit contenir au moins 3 caractères").optional(),
    amount: z.number().positive("Le montant doit être positif").optional(),
    specialInstructions: z.string().optional().nullable(),
    status: z.enum([
        "PENDING",
        "PROPOSAL_SENT",
        "WAITING_RESPONSE",
        "ACCEPTED",
        "REFUSED",
        "SCHEDULED",
        "IN_DELIVERY",
        "DELIVERED",
        "CANCELLED",
    ]).optional(),
    driverId: z.string().uuid("ID livreur invalide").optional().nullable(),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

// ============================================
// GET /api/orders/[id] - Get order details
// ============================================

export async function GET(request: Request, { params }: RouteParams) {
    const [session, authError] = await requireAuth();
    if (authError) return authError;

    const { id } = await params;

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            client: true,
            agency: {
                select: { id: true, name: true, city: true, address: true, phone: true },
            },
            agent: {
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
            },
            driver: {
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
            },
            proposal: {
                include: {
                    booking: {
                        include: {
                            slot: true,
                        },
                    },
                },
            },
            messages: {
                orderBy: { createdAt: "desc" },
                take: 10,
            },
        },
    });

    if (!order) {
        return notFoundError("Commande");
    }

    return apiResponse(order);
}

// ============================================
// PATCH /api/orders/[id] - Update order
// ============================================

export async function PATCH(request: Request, { params }: RouteParams) {
    const [session, authError] = await requireAuth();
    if (authError) return authError;

    const { id } = await params;

    const validation = await validateBody(request, updateOrderSchema);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // Check if order exists
    const existing = await prisma.order.findUnique({
        where: { id },
    });

    if (!existing) {
        return notFoundError("Commande");
    }

    // If driverId is provided, verify driver exists
    if (data.driverId) {
        const driver = await prisma.driver.findUnique({
            where: { id: data.driverId },
        });

        if (!driver) {
            return notFoundError("Livreur");
        }
    }

    const order = await prisma.order.update({
        where: { id },
        data: {
            ...(data.productDescription && { productDescription: data.productDescription }),
            ...(data.amount && { amount: data.amount }),
            ...(data.specialInstructions !== undefined && { specialInstructions: data.specialInstructions }),
            ...(data.status && { status: data.status as OrderStatus }),
            ...(data.driverId !== undefined && { driverId: data.driverId }),
        },
        include: {
            client: {
                select: { id: true, firstName: true, lastName: true, phone: true },
            },
            agency: {
                select: { id: true, name: true, city: true },
            },
            proposal: {
                select: { id: true, code: true, decision: true },
            },
        },
    });

    return apiResponse(order);
}
