import prisma from "@/lib/prisma";
import {
    apiResponse,
    notFoundError,
    goneError,
} from "@/lib/api-helpers";

interface RouteParams {
    params: Promise<{ token: string }>;
}

// ============================================
// GET /api/p/[token] - Get proposal by code (PUBLIC)
// ============================================

export async function GET(request: Request, { params }: RouteParams) {
    const { token } = await params;

    // Find proposal by code with full data
    const proposal = await prisma.deliveryProposal.findUnique({
        where: { code: token },
        include: {
            order: {
                include: {
                    client: {
                        select: { id: true, firstName: true, lastName: true, phone: true, email: true },
                    },
                    agency: {
                        select: { id: true, name: true, address: true, city: true, phone: true },
                    },
                    deliveryZone: {
                        select: { id: true, name: true, city: true, baseFee: true },
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

    if (!proposal) {
        return notFoundError("Proposition");
    }

    // Check if expired
    if (new Date() > proposal.expiresAt && proposal.decision === "PENDING") {
        await prisma.deliveryProposal.update({
            where: { id: proposal.id },
            data: { decision: "EXPIRED" },
        });

        return goneError("Cette proposition a expiré");
    }

    // Return proposal data
    return apiResponse({
        id: proposal.id,
        code: proposal.code,
        decision: proposal.decision,
        expiresAt: proposal.expiresAt,
        createdAt: proposal.createdAt,
        decidedAt: proposal.decidedAt,
        shortUrl: proposal.shortUrl,
        deliveryAddress: proposal.deliveryAddress,
        paymentChoice: proposal.paymentChoice,
        order: {
            id: proposal.order.id,
            orderNumber: proposal.order.orderNumber,
            productDescription: proposal.order.productDescription,
            parcelImageUrl: proposal.order.parcelImageUrl,
            status: proposal.order.status,
            amount: proposal.order.amount,
            specialInstructions: proposal.order.specialInstructions,
            client: proposal.order.client,
            agency: proposal.order.agency,
            // Pricing breakdown
            pricing: {
                productAmount: proposal.order.productAmount,
                deliveryFee: proposal.order.deliveryFee,
                totalAmount: proposal.order.amount,
            },
            // Location info
            locationKnown: proposal.order.locationKnown,
            deliveryZone: proposal.order.deliveryZone,
            deliveryAddress: proposal.order.deliveryAddress,
            addressDetails: proposal.order.addressDetails,
        },
        booking: proposal.booking
            ? {
                slotDate: proposal.booking.slot.slotDate,
                slotHour: proposal.booking.slot.slotHour,
            }
            : null,
    });
}
