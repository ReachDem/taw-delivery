"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { DEFAULT_AGENCY_SETTINGS } from "@/lib/constants";

export async function getAgencyDetails() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        return null;
    }

    try {
        // Try via activeOrganizationId first
        if (session.session.activeOrganizationId) {
            const agency = await prisma.agency.findFirst({
                where: {
                    organizationId: session.session.activeOrganizationId
                },
                select: { id: true, name: true, city: true },
            });
            if (agency) return agency;
        }

        // Fallback: find agency via user's membership
        const membership = await prisma.member.findFirst({
            where: { userId: session.user.id },
            select: { organizationId: true },
        });
        if (!membership) return null;

        const agency = await prisma.agency.findFirst({
            where: { organizationId: membership.organizationId },
            select: { id: true, name: true, city: true },
        });

        return agency;
    } catch (error) {
        console.error("Error fetching agency details:", error);
        return null;
    }
}

/**
 * Get agency settings, returns defaults if none configured
 */
export async function getAgencySettings(agencyId: string) {
    const settings = await prisma.agencySettings.findUnique({
        where: { agencyId },
    });

    if (!settings) {
        return { ...DEFAULT_AGENCY_SETTINGS, agencyId };
    }

    return {
        agencyId: settings.agencyId,
        tariffLabel1: settings.tariffLabel1,
        tariffAmount1: Number(settings.tariffAmount1),
        tariffLabel2: settings.tariffLabel2,
        tariffAmount2: Number(settings.tariffAmount2),
        tariffLabel3: settings.tariffLabel3,
        tariffAmount3: Number(settings.tariffAmount3),
        currency: settings.currency,
        slotStartHour: settings.slotStartHour,
        slotEndHour: settings.slotEndHour,
        slotMaxCapacity: settings.slotMaxCapacity,
        proposalExpiryHours: settings.proposalExpiryHours,
    };
}
