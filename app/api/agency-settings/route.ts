import { z } from "zod";
import prisma from "@/lib/prisma";
import {
    apiResponse,
    apiError,
    validateBody,
    notFoundError,
} from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth-middleware";
import { DEFAULT_AGENCY_SETTINGS } from "@/lib/constants";

// ============================================
// Validation Schema
// ============================================

const updateSettingsSchema = z.object({
    tariffLabel1: z.string().min(1).max(50).optional(),
    tariffAmount1: z.number().min(0).optional(),
    tariffLabel2: z.string().min(1).max(50).optional(),
    tariffAmount2: z.number().min(0).optional(),
    tariffLabel3: z.string().min(1).max(50).optional(),
    tariffAmount3: z.number().min(0).optional(),
    currency: z.string().min(1).max(10).optional(),
    slotStartHour: z.number().min(6).max(20).optional(),
    slotEndHour: z.number().min(7).max(22).optional(),
    slotMaxCapacity: z.number().min(3).max(6).optional(),
    proposalExpiryHours: z.number().min(1).max(168).optional(),
}).refine(
    (data) => {
        if (data.slotStartHour !== undefined && data.slotEndHour !== undefined) {
            return data.slotStartHour < data.slotEndHour;
        }
        return true;
    },
    { message: "L'heure de début doit être avant l'heure de fin", path: ["slotStartHour"] }
);

// Helper: find agency by session's active organization (or by membership fallback)
async function getAgencyFromSession(userId: string, activeOrgId: string | undefined) {
    console.log("[agency-settings] getAgencyFromSession userId:", userId, "activeOrgId:", activeOrgId);

    // If we have an activeOrgId, use it directly
    if (activeOrgId) {
        const membership = await prisma.member.findFirst({
            where: { userId, organizationId: activeOrgId },
        });
        console.log("[agency-settings] membership:", membership?.id ?? "NOT FOUND");
        if (!membership) return null;

        const agency = await prisma.agency.findFirst({
            where: { organizationId: activeOrgId },
            select: { id: true },
        });
        console.log("[agency-settings] agency found:", agency);
        return agency;
    }

    // Fallback: find agency via user's membership (ADMIN has one org)
    console.log("[agency-settings] No activeOrgId → fallback via membership");
    const membership = await prisma.member.findFirst({
        where: { userId },
        select: { organizationId: true },
    });
    console.log("[agency-settings] fallback membership orgId:", membership?.organizationId ?? "NONE");
    if (!membership) return null;

    const agency = await prisma.agency.findFirst({
        where: { organizationId: membership.organizationId },
        select: { id: true },
    });
    console.log("[agency-settings] fallback agency:", agency);
    return agency;
}

// ============================================
// GET /api/agency-settings - Get settings for current admin's agency
// ============================================

export async function GET() {
    console.log("[agency-settings] GET called");
    const [session, authError] = await requireAdmin();
    if (authError) {
        console.log("[agency-settings] Auth error");
        return authError;
    }
    console.log("[agency-settings] User:", session.user.id, "Role:", session.user.role);

    const activeOrgId = await getActiveOrgFromSession(session.user.id);
    console.log("[agency-settings] activeOrgId:", activeOrgId);

    const agency = await getAgencyFromSession(session.user.id, activeOrgId ?? undefined);
    console.log("[agency-settings] agency:", agency);

    if (!agency) {
        console.log("[agency-settings] No agency found → 404");
        return notFoundError("Agence");
    }

    console.log("[agency-settings] prisma.agencySettings type:", typeof prisma.agencySettings);
    const settings = await prisma.agencySettings.findUnique({
        where: { agencyId: agency.id },
    });
    console.log("[agency-settings] settings:", settings);

    if (!settings) {
        return apiResponse({ ...DEFAULT_AGENCY_SETTINGS, agencyId: agency.id });
    }

    return apiResponse({
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
    });
}

// ============================================
// PUT /api/agency-settings - Update settings
// ============================================

export async function PUT(request: Request) {
    const [session, authError] = await requireAdmin();
    if (authError) return authError;

    const activeOrgId = await getActiveOrgFromSession(session.user.id);
    const agency = await getAgencyFromSession(session.user.id, activeOrgId ?? undefined);

    if (!agency) {
        return notFoundError("Agence");
    }

    const validation = await validateBody(request, updateSettingsSchema);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // If only one of start/end hour is provided, validate against existing
    if ((data.slotStartHour !== undefined) !== (data.slotEndHour !== undefined)) {
        const existing = await prisma.agencySettings.findUnique({
            where: { agencyId: agency.id },
        });
        const currentStart = existing?.slotStartHour ?? DEFAULT_AGENCY_SETTINGS.slotStartHour;
        const currentEnd = existing?.slotEndHour ?? DEFAULT_AGENCY_SETTINGS.slotEndHour;
        const newStart = data.slotStartHour ?? currentStart;
        const newEnd = data.slotEndHour ?? currentEnd;
        if (newStart >= newEnd) {
            return apiError("L'heure de début doit être avant l'heure de fin", 400);
        }
    }

    const settings = await prisma.agencySettings.upsert({
        where: { agencyId: agency.id },
        create: {
            agencyId: agency.id,
            ...DEFAULT_AGENCY_SETTINGS,
            ...data,
        },
        update: data,
    });

    return apiResponse({
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
    });
}

// Helper to get active org from Better-Auth session
async function getActiveOrgFromSession(userId: string): Promise<string | null> {
    console.log("[agency-settings] getActiveOrgFromSession for userId:", userId);
    const { auth } = await import("@/lib/auth");
    const { headers } = await import("next/headers");
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    console.log("[agency-settings] session activeOrg:", session?.session?.activeOrganizationId);
    return session?.session?.activeOrganizationId ?? null;
}
