import { z } from "zod";
import prisma from "@/lib/prisma";
import { Decision, OrderStatus, PaymentChoice } from "@/lib/generated/prisma/client";
import {
    apiResponse,
    apiError,
    validateBody,
    notFoundError,
    goneError,
} from "@/lib/api-helpers";

// ============================================
// Validation Schemas
// ============================================

const decideSchema = z.object({
    decision: z.enum(["ACCEPTED", "REFUSED"]),
    // Required only if accepted
    deliveryAddress: z.string().min(5, "L'adresse doit contenir au moins 5 caractères").optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    paymentChoice: z.enum(["PAY_ON_DELIVERY", "ALREADY_PAID", "EXEMPT"]).optional(),
    slotId: z.string().uuid("ID créneau invalide").optional(),
});

interface RouteParams {
    params: Promise<{ token: string }>;
}

// ============================================
// POST /api/p/[token]/decide - Accept or refuse delivery (PUBLIC)
// ============================================

export async function POST(request: Request, { params }: RouteParams) {
    const { token } = await params;

    const validation = await validateBody(request, decideSchema);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // Find proposal by code
    const proposal = await prisma.deliveryProposal.findUnique({
        where: { code: token },
        include: {
            order: true,
        },
    });

    if (!proposal) {
        return notFoundError("Proposition");
    }

    // Check if already decided
    if (proposal.decision !== "PENDING") {
        return apiError("Cette proposition a déjà reçu une réponse", 400);
    }

    // Check if expired
    if (new Date() > proposal.expiresAt) {
        await prisma.deliveryProposal.update({
            where: { id: proposal.id },
            data: { decision: "EXPIRED" },
        });
        return goneError("Cette proposition a expiré");
    }

    // Handle ACCEPTED
    if (data.decision === "ACCEPTED") {
        // Validate required fields for acceptance
        if (!data.deliveryAddress) {
            return apiError("L'adresse de livraison est requise pour accepter", 400);
        }
        if (!data.paymentChoice) {
            return apiError("Le choix de paiement est requis pour accepter", 400);
        }

        // If slotId is provided, verify and book the slot
        if (data.slotId) {
            const slot = await prisma.timeSlot.findUnique({
                where: { id: data.slotId },
            });

            if (!slot) {
                return notFoundError("Créneau");
            }

            if (slot.isLocked || slot.currentBookings >= slot.maxCapacity) {
                return apiError("Ce créneau n'est plus disponible", 409);
            }

            // Create booking and update proposal in transaction
            await prisma.$transaction([
                prisma.booking.create({
                    data: {
                        slotId: data.slotId,
                        proposalId: proposal.id,
                        position: slot.currentBookings + 1,
                    },
                }),
                prisma.timeSlot.update({
                    where: { id: data.slotId },
                    data: { currentBookings: { increment: 1 } },
                }),
                prisma.deliveryProposal.update({
                    where: { id: proposal.id },
                    data: {
                        decision: Decision.ACCEPTED,
                        decidedAt: new Date(),
                        deliveryAddress: data.deliveryAddress,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        paymentChoice: data.paymentChoice as PaymentChoice,
                    },
                }),
                prisma.order.update({
                    where: { id: proposal.orderId },
                    data: { status: OrderStatus.SCHEDULED },
                }),
            ]);
        } else {
            // Accept without slot (will be scheduled later)
            await prisma.$transaction([
                prisma.deliveryProposal.update({
                    where: { id: proposal.id },
                    data: {
                        decision: Decision.ACCEPTED,
                        decidedAt: new Date(),
                        deliveryAddress: data.deliveryAddress,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        paymentChoice: data.paymentChoice as PaymentChoice,
                    },
                }),
                prisma.order.update({
                    where: { id: proposal.orderId },
                    data: { status: OrderStatus.ACCEPTED },
                }),
            ]);
        }
    } else {
        // Handle REFUSED
        await prisma.$transaction([
            prisma.deliveryProposal.update({
                where: { id: proposal.id },
                data: {
                    decision: Decision.REFUSED,
                    decidedAt: new Date(),
                },
            }),
            prisma.order.update({
                where: { id: proposal.orderId },
                data: { status: OrderStatus.REFUSED },
            }),
        ]);
    }

    // Fetch updated proposal
    const updatedProposal = await prisma.deliveryProposal.findUnique({
        where: { id: proposal.id },
        include: {
            order: {
                select: { status: true },
            },
            booking: {
                include: {
                    slot: {
                        select: { slotDate: true, slotHour: true },
                    },
                },
            },
        },
    });

    return apiResponse({
        decision: updatedProposal?.decision,
        orderStatus: updatedProposal?.order.status,
        booking: updatedProposal?.booking
            ? {
                slotDate: updatedProposal.booking.slot.slotDate,
                slotHour: updatedProposal.booking.slot.slotHour,
            }
            : null,
    });
}
