import prisma from "@/lib/prisma";
import { Decision } from "@/lib/generated/prisma/client";
import { apiResponse, apiError } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-middleware";

// ============================================
// GET /api/proposals/stats - Get proposal statistics
// ============================================

export async function GET() {
    const [session, authError] = await requireAuth();
    if (authError) return authError;

    try {
        // Get the current month's start date
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get all-time pending count
        const pendingCount = await prisma.deliveryProposal.count({
            where: {
                decision: Decision.PENDING,
            },
        });

        // Get this month's accepted count
        const acceptedCount = await prisma.deliveryProposal.count({
            where: {
                decision: Decision.ACCEPTED,
                updatedAt: {
                    gte: startOfMonth,
                },
            },
        });

        // Get this month's refused count
        const refusedCount = await prisma.deliveryProposal.count({
            where: {
                decision: Decision.REFUSED,
                updatedAt: {
                    gte: startOfMonth,
                },
            },
        });

        // Calculate acceptance rate (this month)
        const totalDecided = acceptedCount + refusedCount;
        const acceptanceRate = totalDecided > 0
            ? Math.round((acceptedCount / totalDecided) * 100)
            : 0;

        return apiResponse({
            pending: pendingCount,
            accepted: acceptedCount,
            refused: refusedCount,
            acceptanceRate,
        });
    } catch (error) {
        console.error("Error fetching proposal stats:", error);
        return apiError("Erreur lors de la récupération des statistiques", 500);
    }
}
