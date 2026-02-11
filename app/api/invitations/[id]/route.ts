import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Public endpoint to fetch invitation details (no auth required).
 * Only returns non-sensitive information needed to display the invitation.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const invitation = await prisma.invitation.findUnique({
            where: { id },
            include: {
                organization: {
                    select: { id: true, name: true },
                },
                user: {
                    select: { name: true },
                },
            },
        });

        if (!invitation) {
            return NextResponse.json(
                { error: "Invitation introuvable" },
                { status: 404 }
            );
        }

        if (invitation.status !== "pending") {
            return NextResponse.json(
                { error: `Cette invitation a déjà été ${invitation.status === "accepted" ? "acceptée" : invitation.status === "rejected" ? "refusée" : "annulée"}` },
                { status: 410 }
            );
        }

        if (new Date(invitation.expiresAt) < new Date()) {
            return NextResponse.json(
                { error: "Cette invitation a expiré" },
                { status: 410 }
            );
        }

        // Check if a user with this email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: invitation.email },
            select: { id: true },
        });

        return NextResponse.json({
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            organizationName: invitation.organization.name,
            inviterName: invitation.user.name,
            userExists: !!existingUser,
        });
    } catch {
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
