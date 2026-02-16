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
    deliveryZoneId: z.string().uuid("ID zone invalide").optional(),
    deliveryAddress: z.string().min(5, "L'adresse doit contenir au moins 5 caractères").optional(),
    addressDetails: z.string().optional(), // Indications supplémentaires
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
        // If location was not known by agent, client must select a zone
        if (!proposal.order.locationKnown && !data.deliveryZoneId) {
            return apiError("Veuillez sélectionner votre quartier de livraison", 400);
        }
        if (!data.paymentChoice) {
            return apiError("Le choix de paiement est requis pour accepter", 400);
        }
        if (!data.slotId) {
            return apiError("Veuillez sélectionner un créneau de livraison", 400);
        }

        // Calculate delivery fee if zone provided
        let deliveryFee = proposal.order.deliveryFee;
        let deliveryZoneId = proposal.order.deliveryZoneId;

        if (data.deliveryZoneId) {
            const zone = await prisma.deliveryZone.findUnique({
                where: { id: data.deliveryZoneId },
            });

            if (!zone) {
                return notFoundError("Zone de livraison");
            }

            if (!zone.isActive) {
                return apiError("Cette zone n'est plus disponible", 400);
            }

            deliveryFee = zone.baseFee;
            deliveryZoneId = zone.id;
        }

        // Calculate total amount
        // Calculate total amount
        const productAmount = Number(proposal.order.productAmount) || Number(proposal.order.amount);
        const finalDeliveryFee = deliveryFee ? Number(deliveryFee) : 0;
        const totalAmount = productAmount + finalDeliveryFee;

        // Verify and book the slot
        const slot = await prisma.timeSlot.findUnique({
            where: { id: data.slotId },
        });

        if (!slot) {
            return notFoundError("Créneau");
        }

        if (slot.isLocked || slot.currentBookings >= slot.maxCapacity) {
            return apiError("Ce créneau n'est plus disponible", 409);
        }

        // Create booking and update everything in transaction
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
                    deliveryAddress: data.deliveryAddress || proposal.deliveryAddress,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    paymentChoice: data.paymentChoice as PaymentChoice,
                },
            }),
            prisma.order.update({
                where: { id: proposal.orderId },
                data: {
                    status: OrderStatus.SCHEDULED,
                    deliveryZoneId,
                    deliveryFee,
                    amount: totalAmount,
                    deliveryAddress: data.deliveryAddress || proposal.deliveryAddress,
                    addressDetails: data.addressDetails,
                    latitude: data.latitude,
                    longitude: data.longitude,
                },
            }),
        ]);
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

    // Fetch updated proposal with full details
    const updatedProposal = await prisma.deliveryProposal.findUnique({
        where: { id: proposal.id },
        include: {
            order: {
                select: {
                    status: true,
                    productAmount: true,
                    deliveryFee: true,
                    amount: true,
                    deliveryAddress: true,
                    addressDetails: true,
                    deliveryZone: {
                        select: { name: true, city: true },
                    },
                },
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
        pricing: {
            productAmount: updatedProposal?.order.productAmount,
            deliveryFee: updatedProposal?.order.deliveryFee,
            totalAmount: updatedProposal?.order.amount,
        },
        deliveryZone: updatedProposal?.order.deliveryZone,
        deliveryAddress: updatedProposal?.order.deliveryAddress,
        booking: updatedProposal?.booking
            ? {
                slotDate: updatedProposal.booking.slot.slotDate,
                slotHour: updatedProposal.booking.slot.slotHour,
            }
            : null,
    });
}
