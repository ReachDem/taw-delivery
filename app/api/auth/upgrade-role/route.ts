import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/client";

/**
 * POST /api/auth/upgrade-role
 * 
 * After accepting an organization invitation via /admin/accept-invitation,
 * upgrade the user's platform role from AGENT (default) to ADMIN.
 * 
 * This is necessary because Better Auth sign-up sets the default role to AGENT,
 * but users invited via the admin flow should have the ADMIN platform role
 * to access /admin/* routes.
 * 
 * Security: Only upgrades to ADMIN if the user is currently AGENT and
 * is actually a member of at least one organization (proves they accepted an invitation).
 */
export async function POST() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const currentRole = session.user.role as string;

        // Only upgrade AGENT → ADMIN (don't downgrade existing ADMIN/SUPER_ADMIN)
        if (currentRole === "ADMIN" || currentRole === "SUPER_ADMIN") {
            return NextResponse.json({ role: currentRole, message: "Rôle déjà suffisant" });
        }

        // Verify the user is actually a member of an organization
        // (proves they accepted an invitation)
        const membership = await prisma.member.findFirst({
            where: { userId },
        });

        if (!membership) {
            return NextResponse.json(
                { error: "Aucune organisation trouvée. Acceptez d'abord une invitation." },
                { status: 403 }
            );
        }

        // Upgrade user role to ADMIN
        await prisma.user.update({
            where: { id: userId },
            data: { role: Role.ADMIN },
        });

        // Force session refresh: update the session's updatedAt to ensure
        // the next getSession call fetches fresh user data from the DB
        await prisma.session.updateMany({
            where: { userId },
            data: { updatedAt: new Date(0) }, // Force refresh on next access
        });

        return NextResponse.json({ role: "ADMIN", message: "Rôle mis à jour" });
    } catch (error) {
        console.error("Error upgrading role:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
