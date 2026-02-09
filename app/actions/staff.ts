"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function getStaffMembers() {
    // Get all members with their organization and user details
    // Exclude super admins — they belong to all agencies by default
    const members = await prisma.member.findMany({
        where: {
            user: {
                role: { not: "SUPER_ADMIN" }
            }
        },
        include: {
            user: true,
            organization: true,
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return { members };
}

export async function getPendingInvitations() {
    const invitations = await prisma.invitation.findMany({
        where: {
            status: "pending"
        },
        include: {
            organization: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    return invitations;
}

export async function getAgencies() {
    return await prisma.agency.findMany({
        orderBy: { name: 'asc' }
    });
}

export async function inviteStaffMember(data: {
    email: string;
    role: string;
    organizationId: string;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        throw new Error("Unauthorized");
    }

    // For Super Admins: ensure they are a member of the target org before inviting
    if (session.user.role === "SUPER_ADMIN") {
        const existingMember = await prisma.member.findFirst({
            where: {
                userId: session.user.id,
                organizationId: data.organizationId,
            },
        });

        if (!existingMember) {
            // Add Super Admin as owner of the org so they can invite
            await prisma.member.create({
                data: {
                    id: crypto.randomUUID(),
                    userId: session.user.id,
                    organizationId: data.organizationId,
                    role: "owner",
                    createdAt: new Date(),
                },
            });
        }
    }

    try {
        // Set active organization for the session, then create invitation
        const hdrs = await headers();

        await auth.api.setActiveOrganization({
            body: { organizationId: data.organizationId },
            headers: hdrs,
        });

        const res = await auth.api.createInvitation({
            body: {
                email: data.email,
                role: data.role as "admin" | "member" | "owner",
                organizationId: data.organizationId,
            },
            headers: hdrs,
        });
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
