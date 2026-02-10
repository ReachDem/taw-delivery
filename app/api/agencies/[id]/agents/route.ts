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

    // Verify user has access to this agency (unless SUPER_ADMIN)
    if (session.user.role !== "SUPER_ADMIN") {
        // Check if admin is a member of this agency's organization
        if (!agency.organizationId) {
            return apiResponse([]); // No org = no access for non-super-admins
        }

        const membership = await prisma.member.findFirst({
            where: {
                userId: session.user.id,
                organizationId: agency.organizationId,
            },
        });

        if (!membership) {
            return notFoundError("Agence");
        }
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
