import { z } from "zod";
import prisma from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/client";
import {
    apiResponse,
    apiError,
    validateBody,
} from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth-middleware";
import { generateInvitationToken } from "@/lib/code-generator";

// ============================================
// Validation Schemas
// ============================================

const createInvitationSchema = z.object({
    email: z.string().email("Email invalide"),
    role: z.enum(["AGENT", "ADMIN", "DRIVER"]).default("AGENT"),
    agencyId: z.string().uuid("ID agence invalide").optional(),
});

// ============================================
// GET /api/invitations - List all invitations
// ============================================

export async function GET() {
    const [session, authError] = await requireAdmin();
    if (authError) return authError;

    const invitations = await prisma.invitation.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            agency: {
                select: { id: true, name: true },
            },
        },
    });

    return apiResponse(invitations);
}

// ============================================
// POST /api/invitations - Create invitation
// ============================================

export async function POST(request: Request) {
    const [session, authError] = await requireAdmin();
    if (authError) return authError;

    const validation = await validateBody(request, createInvitationSchema);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // Check if there's already a pending invitation for this email
    const existingInvitation = await prisma.invitation.findFirst({
        where: {
            email: data.email,
            status: "PENDING",
        },
    });

    if (existingInvitation) {
        return apiError("Une invitation en attente existe déjà pour cet email", 409);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (existingUser) {
        return apiError("Un utilisateur avec cet email existe déjà", 409);
    }

    // If agencyId is provided, verify it exists
    if (data.agencyId) {
        const agency = await prisma.agency.findUnique({
            where: { id: data.agencyId },
        });
        if (!agency) {
            return apiError("Agence non trouvée", 404);
        }
    }

    // Generate unique token
    const token = await generateInvitationToken();

    // Create invitation (expires in 7 days)
    const invitation = await prisma.invitation.create({
        data: {
            email: data.email,
            role: data.role as Role,
            agencyId: data.agencyId,
            token,
            invitedBy: session.user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        include: {
            agency: {
                select: { id: true, name: true },
            },
        },
    });

    // Return invitation with link
    // The actual link will be: {BASE_URL}/auth/accept-invitation?token={token}
    const invitationLink = `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/auth/accept-invitation?token=${token}`;

    return apiResponse(
        {
            ...invitation,
            invitationLink,
        },
        { status: 201 }
    );
}
