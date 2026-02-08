import { z } from "zod";
import prisma from "@/lib/prisma";
import { OrderStatus } from "@/lib/generated/prisma/client";
import {
    apiResponse,
    apiError,
    validateBody,
    notFoundError,
    conflictError,
} from "@/lib/api-helpers";

// ============================================
// Validation Schemas
// ============================================

const createBookingSchema = z.object({
    proposalId: z.string().uuid("ID proposition invalide"),
    slotId: z.string().uuid("ID créneau invalide"),
});

// ============================================
// POST /api/bookings - Create a booking (PUBLIC - for clients)
// ============================================

export async function POST(request: Request) {
    const validation = await validateBody(request, createBookingSchema);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // Verify proposal exists and is accepted
    const proposal = await prisma.deliveryProposal.findUnique({
        where: { id: data.proposalId },
        include: {
            order: true,
            booking: true,
        },
    });

    if (!proposal) {
        return notFoundError("Proposition");
    }

    if (proposal.decision !== "ACCEPTED") {
        return apiError("La proposition doit être acceptée pour réserver un créneau", 400);
    }

    if (proposal.booking) {
        return conflictError("Cette proposition a déjà un créneau réservé");
    }

    // Verify slot exists and is available
    const slot = await prisma.timeSlot.findUnique({
        where: { id: data.slotId },
    });

    if (!slot) {
        return notFoundError("Créneau");
    }

    if (slot.isLocked) {
        return conflictError("Ce créneau est verrouillé");
    }

    if (slot.currentBookings >= slot.maxCapacity) {
        return conflictError("Ce créneau est complet");
    }

    // Create booking in transaction
    const [booking] = await prisma.$transaction([
        prisma.booking.create({
            data: {
                slotId: data.slotId,
                proposalId: data.proposalId,
                position: slot.currentBookings + 1,
            },
            include: {
                slot: {
                    select: { slotDate: true, slotHour: true, agencyId: true },
                },
            },
        }),
        prisma.timeSlot.update({
            where: { id: data.slotId },
            data: { currentBookings: { increment: 1 } },
        }),
        prisma.order.update({
            where: { id: proposal.orderId },
            data: { status: OrderStatus.SCHEDULED },
        }),
    ]);

    return apiResponse(
        {
            id: booking.id,
            position: booking.position,
            slot: {
                date: booking.slot.slotDate,
                hour: booking.slot.slotHour,
            },
        },
        { status: 201 }
    );
}
