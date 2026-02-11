"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function getAgencyDetails() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user || !session.session.activeOrganizationId) {
        return null;
    }

    try {
        const agency = await prisma.agency.findFirst({
            where: {
                organizationId: session.session.activeOrganizationId
            },
            select: {
                id: true,
                name: true,
                city: true,
            }
        });

        return agency;
    } catch (error) {
        console.error("Error fetching agency details:", error);
        return null;
    }
}
