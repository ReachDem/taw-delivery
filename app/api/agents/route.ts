import { z } from "zod";
import prisma from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/client";
import {
    apiResponse,
    apiError,
    validateBody,
} from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth-middleware";

// ============================================
// Validation Schemas
// ============================================

const createAgentSchema = z.object({
    userId: z.string().cuid("ID utilisateur invalide"),
    agencyId: z.string().uuid("ID agence invalide"),
    firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
    lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
});

// ============================================
// GET /api/agents - List all agents
// ============================================

export async function GET() {
    const [session, authError] = await requireAdmin();
    if (authError) return authError;

    const agents = await prisma.agent.findMany({
        orderBy: { lastName: "asc" },
        include: {
            user: {
                select: { id: true, name: true, email: true, role: true },
            },
            agency: {
                select: { id: true, name: true, city: true },
            },
        },
    });

    return apiResponse(agents);
}

// ============================================
// POST /api/agents - Create agent
// ============================================

export async function POST(request: Request) {
    const [session, authError] = await requireAdmin();
    if (authError) return authError;

    const validation = await validateBody(request, createAgentSchema);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // Verify user exists and has correct role
    const user = await prisma.user.findUnique({
        where: { id: data.userId },
    });

    if (!user) {
        return apiError("Utilisateur non trouvé", 404);
    }

    if (user.role !== Role.AGENT && user.role !== Role.ADMIN) {
        return apiError("L'utilisateur doit avoir le rôle AGENT ou ADMIN", 400);
    }

    // Check if user is already an agent
    const existingAgent = await prisma.agent.findUnique({
        where: { userId: data.userId },
    });

    if (existingAgent) {
        return apiError("Cet utilisateur est déjà un agent", 409);
    }

    // Verify agency exists
    const agency = await prisma.agency.findUnique({
        where: { id: data.agencyId },
    });

    if (!agency) {
        return apiError("Agence non trouvée", 404);
    }

    const agent = await prisma.agent.create({
        data: {
            userId: data.userId,
            agencyId: data.agencyId,
            firstName: data.firstName,
            lastName: data.lastName,
        },
        include: {
            user: {
                select: { id: true, name: true, email: true, role: true },
            },
            agency: {
                select: { id: true, name: true, city: true },
            },
        },
    });

    return apiResponse(agent, { status: 201 });
}
