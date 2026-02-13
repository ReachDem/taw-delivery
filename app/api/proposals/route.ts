import { z } from "zod";
import prisma from "@/lib/prisma";
import { OrderStatus } from "@/lib/generated/prisma/client";
import {
    apiResponse,
    apiError,
    validateBody,
} from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-middleware";
import { generateUniqueCode } from "@/lib/code-generator";
import { getProposalUrl } from "@/lib/url";

// ============================================
// Validation Schemas
// ============================================

const createProposalSchema = z.object({
    orderId: z.string().uuid("ID commande invalide"),
    expiresInHours: z.number().min(1).max(168).default(48), // 1h to 7 days, default 48h
});

// ============================================
// GET /api/proposals - List all proposals
// Supports server-side filtering by search and status
// ============================================

export async function GET(request: Request) {
    const [session, authError] = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "all";

    const where: {
        decision?: string;
        OR?: Array<{
            code?: { contains: string; mode: "insensitive" };
            order?: {
                client?: {
                    firstName?: { contains: string; mode: "insensitive" };
                    lastName?: { contains: string; mode: "insensitive" };
                    phone?: { contains: string };
                };
            };
        }>;
    } = {};

    if (status !== "all") {
        where.decision = status;
    }

    if (search) {
        where.OR = [
            { code: { contains: search, mode: "insensitive" } },
            {
                order: {
                    client: {
                        firstName: { contains: search, mode: "insensitive" },
                    },
                },
            },
            {
                order: {
                    client: {
                        lastName: { contains: search, mode: "insensitive" },
                    },
                },
            },
            {
                order: {
                    client: {
                        phone: { contains: search },
                    },
                },
            },
        ];
    }

    const proposals = await prisma.deliveryProposal.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
            order: {
                include: {
                    client: {
                        select: { id: true, firstName: true, lastName: true, phone: true },
                    },
                    agency: {
                        select: { id: true, name: true, city: true },
                    },
                },
            },
            booking: {
                include: {
                    slot: true,
                },
            },
        },
    });

    return apiResponse(proposals);
}

// ============================================
// POST /api/proposals - Create proposal for an order
// ============================================

export async function POST(request: Request) {
    const [session, authError] = await requireAuth();
    if (authError) return authError;

    const validation = await validateBody(request, createProposalSchema);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // Verify order exists
    const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        include: {
            proposal: true,
            client: true,
            agency: true,
        },
    });

    if (!order) {
        return apiError("Commande non trouvée", 404);
    }

    // Check if proposal already exists
    if (order.proposal) {
        return apiError("Une proposition existe déjà pour cette commande", 409);
    }

    // Check order status
    if (order.status !== OrderStatus.PENDING) {
        return apiError("Seules les commandes en attente peuvent recevoir une proposition", 400);
    }

    // Generate unique 4-char code
    const code = await generateUniqueCode();

    // Calculate expiration
    const expiresAt = new Date(Date.now() + data.expiresInHours * 60 * 60 * 1000);

    // Create proposal and update order status
    const [proposal] = await prisma.$transaction([
        prisma.deliveryProposal.create({
            data: {
                orderId: data.orderId,
                code,
                expiresAt,
            },
            include: {
                order: {
                    include: {
                        client: {
                            select: { id: true, firstName: true, lastName: true, phone: true },
                        },
                        agency: {
                            select: { id: true, name: true, city: true },
                        },
                    },
                },
            },
        }),
        prisma.order.update({
            where: { id: data.orderId },
            data: { status: OrderStatus.PROPOSAL_SENT },
        }),
    ]);

    // Generate the proposal link
    const proposalLink = getProposalUrl(code);

    return apiResponse(
        {
            ...proposal,
            proposalLink,
        },
        { status: 201 }
    );
}
