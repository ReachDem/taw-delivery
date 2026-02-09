import { z } from "zod";
import prisma from "@/lib/prisma";
import {
    apiResponse,
    apiError,
    validateBody,
    parseSearchParams,
} from "@/lib/api-helpers";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth-middleware";

// ============================================
// Validation Schemas
// ============================================

const createAgencySchema = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
    city: z.string().min(2, "La ville doit contenir au moins 2 caractères"),
    phone: z.string().optional(),
});

// ============================================
// GET /api/agencies - List all agencies
// ============================================

export async function GET(request: Request) {
    // TODO: Re-enable auth later
    // const [session, authError] = await requireAdmin();
    // if (authError) return authError;

    const params = parseSearchParams(request);
    const { city, search, page = "1", limit = "10" } = params;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where: any = {};
    if (city) {
        where.city = { contains: city, mode: "insensitive" };
    }
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } },
        ];
    }

    const [agencies, total] = await Promise.all([
        prisma.agency.findMany({
            where,
            skip,
            take: parseInt(limit),
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: {
                        agents: true,
                        drivers: true,
                        orders: true,
                    },
                },
            },
        }),
        prisma.agency.count({ where }),
    ]);

    return apiResponse({
        agencies,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
    });
}

// ============================================
// POST /api/agencies - Create agency
// ============================================

export async function POST(request: Request) {
    // TODO: Re-enable auth later (SUPER_ADMIN only)
    // const [session, authError] = await requireSuperAdmin();
    // if (authError) return authError;

    const validation = await validateBody(request, createAgencySchema);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // Check if agency with same name and city already exists
    const existing = await prisma.agency.findFirst({
        where: {
            name: data.name,
            city: data.city,
        },
    });

    if (existing) {
        return apiError("Une agence avec ce nom existe déjà dans cette ville", 409);
    }

    const agency = await prisma.agency.create({
        data: {
            name: data.name,
            address: data.address,
            city: data.city,
            phone: data.phone,
        },
    });

    return apiResponse(agency, { status: 201 });
}
