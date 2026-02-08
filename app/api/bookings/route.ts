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

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Verify proposal exists and is accepted
            const proposal = await tx.deliveryProposal.findUnique({
                where: { id: data.proposalId },
                include: {
                    booking: true,
                },
            });

            if (!proposal) {
                throw new Error("PROPOSAL_NOT_FOUND");
            }

            if (proposal.decision !== "ACCEPTED") {
                throw new Error("PROPOSAL_NOT_ACCEPTED");
            }

            if (proposal.booking) {
                throw new Error("PROPOSAL_ALREADY_BOOKED");
            }

            // 2. Verify slot exists and check capacity locally first
            const slot = await tx.timeSlot.findUnique({
                where: { id: data.slotId },
            });

            if (!slot) {
                throw new Error("SLOT_NOT_FOUND");
            }

            if (slot.isLocked) {
                throw new Error("SLOT_LOCKED");
            }

            if (slot.currentBookings >= slot.maxCapacity) {
                throw new Error("SLOT_FULL");
            }

            // 3. Atomically increment booking count
            const updatedSlot = await tx.timeSlot.update({
                where: { id: data.slotId },
                data: { currentBookings: { increment: 1 } },
            });

            // 4. Double-check capacity after increment (race condition protection)
            if (updatedSlot.currentBookings > updatedSlot.maxCapacity) {
                throw new Error("SLOT_FULL_RACE");
            }

            // 5. Create booking
            const booking = await tx.booking.create({
                data: {
                    slotId: data.slotId,
                    proposalId: data.proposalId,
                    position: updatedSlot.currentBookings, // Use the new count as position
                },
                include: {
                    slot: {
                        select: { slotDate: true, slotHour: true, agencyId: true },
                    },
                },
            });

            // 6. Update order status
            await tx.order.update({
                where: { id: proposal.orderId },
                data: { status: OrderStatus.SCHEDULED },
            });

            return booking;
        });

        return apiResponse(
            {
                id: result.id,
                position: result.position,
                slot: {
                    date: result.slot.slotDate,
                    hour: result.slot.slotHour,
                },
            },
            { status: 201 }
        );

    } catch (error: any) {
        // Map transaction errors to API responses
        if (error.message === "PROPOSAL_NOT_FOUND") return notFoundError("Proposition");
        if (error.message === "PROPOSAL_NOT_ACCEPTED") return apiError("La proposition doit être acceptée pour réserver un créneau", 400);
        if (error.message === "PROPOSAL_ALREADY_BOOKED") return conflictError("Cette proposition a déjà un créneau réservé");
        if (error.message === "SLOT_NOT_FOUND") return notFoundError("Créneau");
        if (error.message === "SLOT_LOCKED") return conflictError("Ce créneau est verrouillé");
        if (error.message === "SLOT_FULL" || error.message === "SLOT_FULL_RACE") return conflictError("Ce créneau est complet");

        console.error("Booking Transaction Error:", error);
        return apiError("Erreur lors de la réservation", 500);
    }
}
