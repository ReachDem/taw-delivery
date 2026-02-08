import prisma from "@/lib/prisma";
import { apiResponse, notFoundError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth-middleware";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// ============================================
// GET /api/agencies/[id]/agents - List agents of an agency
// ============================================

export async function GET(request: Request, { params }: RouteParams) {
    const [session, authError] = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;

    // Verify agency exists
    const agency = await prisma.agency.findUnique({
        where: { id },
    });

    if (!agency) {
        return notFoundError("Agence");
    }

    const agents = await prisma.agent.findMany({
        where: { agencyId: id },
        orderBy: { lastName: "asc" },
        include: {
            user: {
                select: { id: true, name: true, email: true, role: true },
            },
        },
    });

    return apiResponse(agents);
}
