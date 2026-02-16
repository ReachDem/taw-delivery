import prisma from "@/lib/prisma";
import {
    apiResponse,
    notFoundError,
    goneError,
    parseSearchParams,
} from "@/lib/api-helpers";

interface RouteParams {
    params: Promise<{ token: string }>;
}

// ============================================
// GET /api/p/[token]/slots - Get available time slots (PUBLIC)
// ============================================

export async function GET(request: Request, { params }: RouteParams) {
    const { token } = await params;
    const queryParams = parseSearchParams(request);
    const { days = "7" } = queryParams;

    // Find proposal by code to get the agency
    const proposal = await prisma.deliveryProposal.findUnique({
        where: { code: token },
        include: {
            order: {
                select: { agencyId: true },
            },
        },
    });

    if (!proposal) {
        return notFoundError("Proposition");
    }

    // Check if expired
    if (new Date() > proposal.expiresAt && proposal.decision === "PENDING") {
        return goneError("Cette proposition a expiré");
    }

    // ─── Auto-generate slots if none exist for the period ───
    const agencyId = proposal.order.agencyId;
    const daysCount = Math.min(Math.max(parseInt(days) || 7, 1), 31);

    // Slots start from TOMORROW — same-day slots are never available to customers
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const endDate = new Date(tomorrow);
    endDate.setDate(endDate.getDate() + daysCount);

    // Check if slots exist for the period
    const existingCount = await prisma.timeSlot.count({
        where: {
            agencyId,
            slotDate: { gte: tomorrow, lt: endDate },
        },
    });

    // Auto-create slots if none exist (or very few)
    if (existingCount < daysCount) {
        const DEFAULT_START_HOUR = 9;
        const DEFAULT_END_HOUR = 17;
        const DEFAULT_CAPACITY = 4;

        const slotsToCreate: Array<{
            agencyId: string;
            slotDate: Date;
            slotHour: number;
            maxCapacity: number;
        }> = [];

        const currentDate = new Date(tomorrow);
        while (currentDate < endDate) {
            // Skip Sundays (day 0)
            if (currentDate.getDay() !== 0) {
                for (let hour = DEFAULT_START_HOUR; hour < DEFAULT_END_HOUR; hour++) {
                    slotsToCreate.push({
                        agencyId,
                        slotDate: new Date(currentDate),
                        slotHour: hour,
                        maxCapacity: DEFAULT_CAPACITY,
                    });
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        if (slotsToCreate.length > 0) {
            await prisma.timeSlot.createMany({
                data: slotsToCreate,
                skipDuplicates: true,
            });
        }
    }

    // ─── Fetch available slots ───
    const slots = await prisma.timeSlot.findMany({
        where: {
            agencyId,
            slotDate: {
                gte: tomorrow,
                lt: endDate,
            },
            isLocked: false,
        },
        orderBy: [
            { slotDate: 'asc' },
            { slotHour: 'asc' },
        ],
        select: {
            id: true,
            slotDate: true,
            slotHour: true,
            maxCapacity: true,
            currentBookings: true,
        },
    });

    // Filter to only available slots and add remaining capacity
    const availableSlots = slots
        .filter(slot => slot.currentBookings < slot.maxCapacity)
        .map(slot => ({
            id: slot.id,
            date: slot.slotDate,
            hour: slot.slotHour,
            hourLabel: `${slot.slotHour}h - ${slot.slotHour + 1}h`,
            remainingCapacity: slot.maxCapacity - slot.currentBookings,
            isAlmostFull: (slot.maxCapacity - slot.currentBookings) <= 1,
        }));

    // Group slots by date for easier display
    const slotsByDate = availableSlots.reduce((acc, slot) => {
        const dateKey = new Date(slot.date).toISOString().split('T')[0];
        if (!acc[dateKey]) {
            acc[dateKey] = {
                date: slot.date,
                dateLabel: formatDate(new Date(slot.date)),
                slots: [],
            };
        }
        acc[dateKey].slots.push({
            id: slot.id,
            hour: slot.hour,
            hourLabel: slot.hourLabel,
            remainingCapacity: slot.remainingCapacity,
            isAlmostFull: slot.isAlmostFull,
        });
        return acc;
    }, {} as Record<string, { date: Date; dateLabel: string; slots: any[] }>);

    return apiResponse({
        slots: availableSlots,
        slotsByDate: Object.values(slotsByDate),
        totalAvailable: availableSlots.length,
    });
}

// Helper to format date in French
function formatDate(date: Date): string {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const months = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    
    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    
    return `${dayName} ${dayNum} ${monthName}`;
}
