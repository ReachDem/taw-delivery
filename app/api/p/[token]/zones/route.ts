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
// GET /api/p/[token]/zones - Get available delivery zones (PUBLIC)
// ============================================

export async function GET(request: Request, { params }: RouteParams) {
    const { token } = await params;

    // Find proposal by code to get the agency
    const proposal = await prisma.deliveryProposal.findUnique({
        where: { code: token },
        include: {
            order: {
                select: { agencyId: true },
            },
        },
    });

    if (!proposal) {
        return notFoundError("Proposition");
    }

    // Check if expired
    if (new Date() > proposal.expiresAt && proposal.decision === "PENDING") {
        return goneError("Cette proposition a expiré");
    }

    // Get active delivery zones for the agency
    const zones = await prisma.deliveryZone.findMany({
        where: {
            agencyId: proposal.order.agencyId,
            isActive: true,
        },
        orderBy: [
            { baseFee: 'asc' },
            { sortOrder: 'asc' },
            { name: 'asc' },
        ],
        select: {
            id: true,
            name: true,
            city: true,
            baseFee: true,
        },
    });

    // Group zones by price tier for better UX
    const groupedZones = zones.reduce((acc, zone) => {
        const fee = Number(zone.baseFee);
        if (!acc[fee]) {
            acc[fee] = [];
        }
        acc[fee].push(zone);
        return acc;
    }, {} as Record<number, typeof zones>);

    return apiResponse({
        zones,
        groupedByFee: groupedZones,
        feeDisclaimer: "Des frais entre 200 et 1,000 FCFA peuvent s'ajouter selon votre position exacte",
    });
}
