/**
 * Tests d'intégration pour l'API Slots
 * /api/agencies/[id]/slots
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    VALID_UUIDS,
    mockAdminSession,
    createMockAgency,
    createMockSlot,
    HTTP_STATUS,
} from "../fixtures";

// Mock auth middleware
vi.mock("@/lib/auth-middleware", () => ({
    requireAdmin: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
    default: {
        agency: {
            findUnique: vi.fn(),
        },
        timeSlot: {
            findMany: vi.fn(),
            createMany: vi.fn(),
        },
    },
}));

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-middleware";
import { GET, POST } from "@/app/api/agencies/[id]/slots/route";

describe("API /api/agencies/[id]/slots", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("GET /api/agencies/[id]/slots (Public)", () => {
        it("should return 404 if agency not found", async () => {
            vi.mocked(prisma.agency.findUnique).mockResolvedValue(null);

            const response = await GET(
                new Request(`http://localhost:3000/api/agencies/${VALID_UUIDS.agency}/slots`),
                { params: Promise.resolve({ id: VALID_UUIDS.agency }) }
            );

            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        });

        it("should return all slots for agency", async () => {
            vi.mocked(prisma.agency.findUnique).mockResolvedValue(createMockAgency() as any);
            vi.mocked(prisma.timeSlot.findMany).mockResolvedValue([
                createMockSlot({ id: "slot-1", slotHour: 9, currentBookings: 2 }),
                createMockSlot({ id: "slot-2", slotHour: 10, currentBookings: 4, maxCapacity: 4 }), // Full
            ] as any);

            const response = await GET(
                new Request(`http://localhost:3000/api/agencies/${VALID_UUIDS.agency}/slots`),
                { params: Promise.resolve({ id: VALID_UUIDS.agency }) }
            );

            expect(response.status).toBe(HTTP_STATUS.OK);
            const json = await response.json();
            expect(json.data).toHaveLength(2);
        });

        it("should filter only available slots when requested", async () => {
            vi.mocked(prisma.agency.findUnique).mockResolvedValue(createMockAgency() as any);
            vi.mocked(prisma.timeSlot.findMany).mockResolvedValue([
                createMockSlot({ id: "slot-1", slotHour: 9, currentBookings: 2, maxCapacity: 4 }),
                createMockSlot({ id: "slot-2", slotHour: 10, currentBookings: 4, maxCapacity: 4 }), // Full
            ] as any);

            const response = await GET(
                new Request(`http://localhost:3000/api/agencies/${VALID_UUIDS.agency}/slots?available=true`),
                { params: Promise.resolve({ id: VALID_UUIDS.agency }) }
            );

            expect(response.status).toBe(HTTP_STATUS.OK);
            const json = await response.json();
            // Should only return slot-1 (not full)
            expect(json.data).toHaveLength(1);
            expect(json.data[0].id).toBe("slot-1");
        });
    });

    describe("POST /api/agencies/[id]/slots (Admin)", () => {
        it("should return 401 if not authenticated", async () => {
            vi.mocked(requireAdmin).mockResolvedValue([
                null,
                new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 }),
            ]);

            const response = await POST(
                new Request(`http://localhost:3000/api/agencies/${VALID_UUIDS.agency}/slots`, {
                    method: "POST",
                    body: JSON.stringify({
                        startDate: "2026-12-15",
                        endDate: "2026-12-20",
                    }),
                }),
                { params: Promise.resolve({ id: VALID_UUIDS.agency }) }
            );

            expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
        });

        it("should return 400 for invalid date range (end before start)", async () => {
            vi.mocked(requireAdmin).mockResolvedValue([mockAdminSession, null]);
            vi.mocked(prisma.agency.findUnique).mockResolvedValue(createMockAgency() as any);

            const response = await POST(
                new Request(`http://localhost:3000/api/agencies/${VALID_UUIDS.agency}/slots`, {
                    method: "POST",
                    body: JSON.stringify({
                        startDate: "2026-12-20",
                        endDate: "2026-12-15", // End before start
                    }),
                }),
                { params: Promise.resolve({ id: VALID_UUIDS.agency }) }
            );

            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });

        it("should create slots for date range", async () => {
            vi.mocked(requireAdmin).mockResolvedValue([mockAdminSession, null]);
            vi.mocked(prisma.agency.findUnique).mockResolvedValue(createMockAgency() as any);
            vi.mocked(prisma.timeSlot.createMany).mockResolvedValue({ count: 24 } as any);

            const response = await POST(
                new Request(`http://localhost:3000/api/agencies/${VALID_UUIDS.agency}/slots`, {
                    method: "POST",
                    body: JSON.stringify({
                        startDate: "2026-12-15",
                        endDate: "2026-12-17", // 3 days
                        startHour: 9,
                        endHour: 17, // 8 hours per day
                        maxCapacity: 4,
                    }),
                }),
                { params: Promise.resolve({ id: VALID_UUIDS.agency }) }
            );

            expect(response.status).toBe(HTTP_STATUS.CREATED);
            const json = await response.json();
            expect(json.data.created).toBe(24); // 3 days * 8 hours
        });
    });
});
