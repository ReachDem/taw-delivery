"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateId } from "better-auth";
import { headers } from "next/headers";
import type { SerializedMember, SerializedInvitation, SerializedAgency } from "@/lib/types/staff";

export async function getStaffMembers(): Promise<{ members: SerializedMember[] }> {
    // Verify user is authenticated and has SUPER_ADMIN or ADMIN role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        throw new Error("Non authentifié");
    }

    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
        throw new Error("Accès non autorisé");
    }

    // Get all members with their organization and user details
    // Exclude super admins — they belong to all agencies by default
    const members = await prisma.member.findMany({
        where: {
            user: {
                role: { not: "SUPER_ADMIN" }
            }
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                }
            },
            organization: {
                select: {
                    id: true,
                    name: true,
                }
            },
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // Serialize dates for client consumption
    const serializedMembers: SerializedMember[] = members.map(member => ({
        id: member.id,
        role: member.role,
        createdAt: member.createdAt.toISOString(),
        userId: member.userId,
        organizationId: member.organizationId,
        user: member.user,
        organization: member.organization,
    }));

    return { members: serializedMembers };
}

export async function getPendingInvitations(): Promise<SerializedInvitation[]> {
    // Verify user is authenticated and has SUPER_ADMIN or ADMIN role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        throw new Error("Non authentifié");
    }

    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
        throw new Error("Accès non autorisé");
    }

    const organizationId = session.session.activeOrganizationId;

    if (!organizationId) {
        return [];
    }

    const invitations = await prisma.invitation.findMany({
        where: {
            status: "pending",
            organizationId
        },
        include: {
            organization: {
                select: {
                    id: true,
                    name: true,
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // Serialize dates for client consumption
    return invitations.map(inv => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        createdAt: inv.createdAt.toISOString(),
        expiresAt: inv.expiresAt.toISOString(),
        organizationId: inv.organizationId,
        organization: inv.organization,
    }));
}

export async function getAgencies(): Promise<SerializedAgency[]> {
    // Verify user is authenticated
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        throw new Error("Non authentifié");
    }

    const agencies = await prisma.agency.findMany({
        select: {
            id: true,
            name: true,
            organizationId: true,
        },
        orderBy: { name: 'asc' }
    });

    // Already serializable, no dates to convert
    return agencies;
}

export async function inviteStaffMember(data: {
    email: string;
    role: string;
    organizationId: string;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    // If activeOrganizationId is missing, check if the user is a member of the requested organization
    // or if they are a super admin.
    const organizationId = data.organizationId;
    
    // Verify membership/permissions
    const member = await prisma.member.findFirst({
        where: {
            userId: session.user.id,
            organizationId: organizationId,
        }
    });

    const isSuperAdmin = session.user.role === "SUPER_ADMIN";

    if (!member && !isSuperAdmin) {
         throw new Error("Vous n'avez pas les droits pour inviter dans cette agence");
    }



    try {
        console.log("Starting invitation process for:", data.email);
        console.log("Inviting to organization:", organizationId);

        // Check if user is already a member
        const existingMember = await prisma.member.findFirst({
            where: {
                organizationId,
                user: {
                    email: data.email
                }
            }
        });

        if (existingMember) {
            throw new Error("Cet utilisateur est déjà membre de l'agence");
        }
        
        // Check if invitation already exists
        const existingInvitation = await prisma.invitation.findFirst({
            where: {
                organizationId,
                email: data.email,
                status: "pending"
            }
        });

        if (existingInvitation) {
            throw new Error("Une invitation est déjà en attente pour cet email");
        }

        const res = await auth.api.createInvitation({
            body: {
                email: data.email,
                role: data.role as "admin" | "member" | "owner",
                organizationId,
            },
            headers: await headers(),
        });
        
        console.log("Invitation created successfully:", res);
        return { success: true, data: res };
    } catch (error: any) {
        console.error("Invitation failed:", error);
        throw new Error(error.body?.message || error.message || "Failed to send invitation");
    }
}

export async function revokeInvitation(invitationId: string) {
    const res = await auth.api.cancelInvitation({
        body: {
            invitationId
        },
        headers: await headers()
    });
    return res;
}
