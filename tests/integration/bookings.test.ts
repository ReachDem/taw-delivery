/**
 * Tests d'intégration pour l'API Bookings
 * /api/bookings
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    VALID_UUIDS,
    createMockProposal,
    createMockSlot,
    HTTP_STATUS,
} from "../fixtures";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
    default: {
        deliveryProposal: {
            findUnique: vi.fn(),
        },
        timeSlot: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        booking: {
            create: vi.fn(),
        },
        order: {
            update: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

import prisma from "@/lib/prisma";
import { POST } from "@/app/api/bookings/route";

describe("API /api/bookings (Public)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("POST /api/bookings - Create booking", () => {
        it("should return 404 if proposal not found", async () => {
            vi.mocked(prisma.deliveryProposal.findUnique).mockResolvedValue(null);

            const request = new Request("http://localhost:3000/api/bookings", {
                method: "POST",
                body: JSON.stringify({
                    proposalId: VALID_UUIDS.proposal,
                    slotId: VALID_UUIDS.slot,
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        });

        it("should return 400 if proposal not accepted", async () => {
            vi.mocked(prisma.deliveryProposal.findUnique).mockResolvedValue(
                createMockProposal({ decision: "PENDING", booking: null }) as any
            );

            const request = new Request("http://localhost:3000/api/bookings", {
                method: "POST",
                body: JSON.stringify({
                    proposalId: VALID_UUIDS.proposal,
                    slotId: VALID_UUIDS.slot,
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });

        it("should return 409 if proposal already has booking", async () => {
            vi.mocked(prisma.deliveryProposal.findUnique).mockResolvedValue(
                createMockProposal({
                    decision: "ACCEPTED",
                    booking: { id: "existing-booking" },
                }) as any
            );

            const request = new Request("http://localhost:3000/api/bookings", {
                method: "POST",
                body: JSON.stringify({
                    proposalId: VALID_UUIDS.proposal,
                    slotId: VALID_UUIDS.slot,
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(HTTP_STATUS.CONFLICT);
        });

        it("should return 404 if slot not found", async () => {
            vi.mocked(prisma.deliveryProposal.findUnique).mockResolvedValue(
                createMockProposal({
                    decision: "ACCEPTED",
                    booking: null,
                    order: { id: VALID_UUIDS.order },
                }) as any
            );
            vi.mocked(prisma.timeSlot.findUnique).mockResolvedValue(null);

            const request = new Request("http://localhost:3000/api/bookings", {
                method: "POST",
                body: JSON.stringify({
                    proposalId: VALID_UUIDS.proposal,
                    slotId: VALID_UUIDS.slot,
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        });

        it("should return 409 if slot is locked", async () => {
            vi.mocked(prisma.deliveryProposal.findUnique).mockResolvedValue(
                createMockProposal({
                    decision: "ACCEPTED",
                    booking: null,
                    order: { id: VALID_UUIDS.order },
                }) as any
            );
            vi.mocked(prisma.timeSlot.findUnique).mockResolvedValue(
                createMockSlot({ isLocked: true }) as any
            );

            const request = new Request("http://localhost:3000/api/bookings", {
                method: "POST",
                body: JSON.stringify({
                    proposalId: VALID_UUIDS.proposal,
                    slotId: VALID_UUIDS.slot,
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(HTTP_STATUS.CONFLICT);
        });

        it("should return 409 if slot is full", async () => {
            vi.mocked(prisma.deliveryProposal.findUnique).mockResolvedValue(
                createMockProposal({
                    decision: "ACCEPTED",
                    booking: null,
                    order: { id: VALID_UUIDS.order },
                }) as any
            );
            vi.mocked(prisma.timeSlot.findUnique).mockResolvedValue(
                createMockSlot({
                    maxCapacity: 4,
                    currentBookings: 4, // Full
                }) as any
            );

            const request = new Request("http://localhost:3000/api/bookings", {
                method: "POST",
                body: JSON.stringify({
                    proposalId: VALID_UUIDS.proposal,
                    slotId: VALID_UUIDS.slot,
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(HTTP_STATUS.CONFLICT);
        });

        it("should create booking successfully", async () => {
            vi.mocked(prisma.deliveryProposal.findUnique).mockResolvedValue(
                createMockProposal({
                    decision: "ACCEPTED",
                    booking: null,
                    orderId: VALID_UUIDS.order,
                    order: { id: VALID_UUIDS.order },
                }) as any
            );
            vi.mocked(prisma.timeSlot.findUnique).mockResolvedValue(
                createMockSlot({
                    maxCapacity: 4,
                    currentBookings: 2,
                    isLocked: false,
                }) as any
            );
            vi.mocked(prisma.$transaction).mockResolvedValue([
                {
                    id: VALID_UUIDS.booking,
                    position: 3,
                    slot: {
                        slotDate: new Date("2026-12-15"),
                        slotHour: 14,
                        agencyId: VALID_UUIDS.agency,
                    },
                },
                {},
                {},
            ] as any);

            const request = new Request("http://localhost:3000/api/bookings", {
                method: "POST",
                body: JSON.stringify({
                    proposalId: VALID_UUIDS.proposal,
                    slotId: VALID_UUIDS.slot,
                }),
            });

            const response = await POST(request);

            expect(response.status).toBe(HTTP_STATUS.CREATED);
            const json = await response.json();
            expect(json.data.position).toBe(3);
            expect(json.data.slot.hour).toBe(14);
        });
    });
});
