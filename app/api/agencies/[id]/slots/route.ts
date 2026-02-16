import { z } from "zod";
import prisma from "@/lib/prisma";
import {
    apiResponse,
    apiError,
    validateBody,
    notFoundError,
    parseSearchParams,
    forbiddenError,
} from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth-middleware";
import { getAgencySettings } from "@/app/actions/agency";

// ============================================
// Validation Schemas
// ============================================

interface RouteParams {
    params: Promise<{ id: string }>;
}

// ============================================
// GET /api/agencies/[id]/slots - Get available slots
// ============================================

export async function GET(request: Request, { params }: RouteParams) {
    // This endpoint is public (for clients to see available slots)
    const { id } = await params;
    const searchParams = parseSearchParams(request);
    const { date, available } = searchParams;

    // Verify agency exists
    const agency = await prisma.agency.findUnique({
        where: { id },
    });

    if (!agency) {
        return notFoundError("Agence");
    }

    // Build filter
    const where: Record<string, unknown> = { agencyId: id };

    if (date) {
        where.slotDate = new Date(date);
    } else {
        // Default: show slots from today onwards
        where.slotDate = { gte: new Date() };
    }

    if (available === "true") {
        where.isLocked = false;
        // Note: Le filtrage par capacité est fait en mémoire après la requête (ligne 74-75)
    }

    const slots = await prisma.timeSlot.findMany({
        where: {
            agencyId: id,
            ...(date && { slotDate: new Date(date) }),
            ...(!date && { slotDate: { gte: new Date() } }),
            ...(available === "true" && { isLocked: false }),
        },
        orderBy: [{ slotDate: "asc" }, { slotHour: "asc" }],
        take: 100,
    });

    // Filter available slots if requested
    const filteredSlots = available === "true"
        ? slots.filter((slot) => slot.currentBookings < slot.maxCapacity)
        : slots;

    return apiResponse(filteredSlots);
}

// ============================================
// POST /api/agencies/[id]/slots - Create slots (ADMIN)
// ============================================

export async function POST(request: Request, { params }: RouteParams) {
    const [session, authError] = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;

    // Verify agency exists and user has access
    const agency = await prisma.agency.findUnique({
        where: { id },
    });

    if (!agency) {
        return notFoundError("Agence");
    }

    if (session.user.role !== "SUPER_ADMIN") {
        if (!agency.organizationId) {
            return forbiddenError();
        }
        const membership = await prisma.member.findFirst({
            where: {
                userId: session.user.id,
                organizationId: agency.organizationId,
            },
        });
        if (!membership) {
            return forbiddenError();
        }
    }

    // Get agency settings for defaults
    const settings = await getAgencySettings(id);

    const createSlotsSchema = z.object({
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)"),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)"),
        startHour: z.number().min(6).max(20).default(settings.slotStartHour),
        endHour: z.number().min(7).max(22).default(settings.slotEndHour),
        maxCapacity: z.number().min(1).max(20).default(settings.slotMaxCapacity),
    });

    const validation = await validateBody(request, createSlotsSchema);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // Validate dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (startDate > endDate) {
        return apiError("La date de début doit être avant la date de fin", 400);
    }

    if (data.startHour >= data.endHour) {
        return apiError("L'heure de début doit être avant l'heure de fin", 400);
    }

    // Generate slots
    const slotsToCreate: Array<{
        agencyId: string;
        slotDate: Date;
        slotHour: number;
        maxCapacity: number;
    }> = [];

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        for (let hour = data.startHour; hour < data.endHour; hour++) {
            slotsToCreate.push({
                agencyId: id,
                slotDate: new Date(currentDate),
                slotHour: hour,
                maxCapacity: data.maxCapacity,
            });
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Use createMany with skipDuplicates
    const result = await prisma.timeSlot.createMany({
        data: slotsToCreate,
        skipDuplicates: true, // Skip if slot already exists
    });

    return apiResponse(
        {
            created: result.count,
            message: `${result.count} créneaux créés`,
        },
        { status: 201 }
    );
}