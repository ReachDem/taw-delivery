import { z } from "zod";
import prisma from "@/lib/prisma";
import { OrderStatus } from "@/lib/generated/prisma/client";
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

const createOrderSchema = z.object({
    clientId: z.string().uuid("ID client invalide"),
    agencyId: z.string().uuid("ID agence invalide"),
    productDescription: z.string().min(3, "La description doit contenir au moins 3 caractères"),
    amount: z.number().positive("Le montant doit être positif"),
    specialInstructions: z.string().optional().nullable(),
});

// ============================================
// GET /api/orders - List orders with filters
// ============================================

export async function GET(request: Request) {
    const [session, authError] = await requireAuth();
    if (authError) return authError;

    const params = parseSearchParams(request);
    const { agencyId, status, clientId } = params;

    // Build where clause - filter by user's agency unless SUPER_ADMIN
    const where: any = {
        ...(status && { status: status as OrderStatus }),
        ...(clientId && { clientId }),
    };

    // Super Admins can see all orders
    if (session.user.role !== "SUPER_ADMIN") {
        // For ADMIN/AGENT/DRIVER, get their agency
        const userAgent = await prisma.agent.findUnique({
            where: { userId: session.user.id },
            select: { agencyId: true },
        });

        if (!userAgent) {
            return apiResponse([]);
        }

        // Filter by user's agency (or specific agencyId if provided and matches)
        if (agencyId) {
            // Only allow filtering by their own agency
            if (agencyId !== userAgent.agencyId) {
                return apiResponse([]);
            }
            where.agencyId = agencyId;
        } else {
            where.agencyId = userAgent.agencyId;
        }
    } else if (agencyId) {
        // Super Admin with specific agency filter
        where.agencyId = agencyId;
    }

    const orders = await prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
            client: {
                select: { id: true, firstName: true, lastName: true, phone: true },
            },
            agency: {
                select: { id: true, name: true, city: true },
            },
            agent: {
                select: { id: true, firstName: true, lastName: true },
            },
            proposal: {
                select: { id: true, code: true, decision: true, expiresAt: true },
            },
        },
    });

    return apiResponse(orders);
}

// ============================================
// POST /api/orders - Create order
// ============================================

export async function POST(request: Request) {
    const [session, authError] = await requireAuth();
    if (authError) return authError;

    const validation = await validateBody(request, createOrderSchema);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // Verify client exists
    const client = await prisma.client.findUnique({
        where: { id: data.clientId },
    });

    if (!client) {
        return apiError("Client non trouvé", 404);
    }

    // Verify agency exists
    const agency = await prisma.agency.findUnique({
        where: { id: data.agencyId },
    });

    if (!agency) {
        return apiError("Agence non trouvée", 404);
    }

    // Get the agent associated with the current user
    const agent = await prisma.agent.findUnique({
        where: { userId: session.user.id },
    });

    if (!agent) {
        return apiError("Vous devez être un agent pour créer une commande", 403);
    }

    // Verify agent belongs to the agency
    if (agent.agencyId !== data.agencyId) {
        return apiError("Vous ne pouvez créer des commandes que pour votre agence", 403);
    }

    const order = await prisma.order.create({
        data: {
            clientId: data.clientId,
            agencyId: data.agencyId,
            agentId: agent.id,
            productDescription: data.productDescription,
            amount: data.amount,
            specialInstructions: data.specialInstructions,
            status: OrderStatus.PENDING,
        },
        include: {
            client: {
                select: { id: true, firstName: true, lastName: true, phone: true },
            },
            agency: {
                select: { id: true, name: true, city: true },
            },
            agent: {
                select: { id: true, firstName: true, lastName: true },
            },
        },
    });

    return apiResponse(order, { status: 201 });
}
