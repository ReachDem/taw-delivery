/**
 * Tests d'intégration pour les APIs Propositions
 * /api/proposals et /api/p/[token]
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth middleware
vi.mock("@/lib/auth-middleware", () => ({
    requireAdmin: vi.fn(),
    requireAuth: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
    default: {
        deliveryProposal: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        order: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        timeSlot: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        booking: {
            create: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

// Mock code generator
vi.mock("@/lib/code-generator", () => ({
    generateUniqueCode: vi.fn().mockResolvedValue("AB12"),
}));

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { GET, POST } from "@/app/api/proposals/route";
import { GET as GET_BY_TOKEN } from "@/app/api/p/[token]/route";
import { POST as DECIDE } from "@/app/api/p/[token]/decide/route";

const mockSession = {
    user: { id: "user-id", email: "user@test.com", role: "AGENT" },
    session: { id: "session-id" },
};

// Valid UUIDs for testing
const VALID_ORDER_ID = "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d";
const VALID_SLOT_ID = "b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e";

describe("API /api/proposals", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(requireAuth).mockResolvedValue([mockSession, null]);
    });

    describe("GET /api/proposals", () => {
        it("should return list of proposals", async () => {
            vi.mocked(prisma.deliveryProposal.findMany).mockResolvedValue([
                {
                    id: "prop-1",
                    orderId: "order-1",
                    code: "AB12",
                    decision: "PENDING",
                    expiresAt: new Date("2026-12-31"),
                    order: {
                        client: { firstName: "John", lastName: "Doe" },
                        agency: { name: "Agency 1" },
                    },
                },
            ] as any);

            const response = await GET();

            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.data).toHaveLength(1);
            expect(json.data[0].code).toBe("AB12");
        });
    });

    describe("POST /api/proposals", () => {
        it("should return 404 if order not found", async () => {
            vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

            const request = new Request("http://localhost:3000/api/proposals", {
                method: "POST",
                body: JSON.stringify({ orderId: VALID_ORDER_ID }),
            });

            const response = await POST(request);
            expect(response.status).toBe(404);
        });

        it("should return 409 if proposal already exists", async () => {
            vi.mocked(prisma.order.findUnique).mockResolvedValue({
                id: VALID_ORDER_ID,
                status: "PENDING",
                proposal: { id: "existing-proposal" },
            } as any);

            const request = new Request("http://localhost:3000/api/proposals", {
                method: "POST",
                body: JSON.stringify({ orderId: VALID_ORDER_ID }),
            });

            const response = await POST(request);
            expect(response.status).toBe(409);
        });

        it("should return 400 if order not in PENDING status", async () => {
            vi.mocked(prisma.order.findUnique).mockResolvedValue({
                id: VALID_ORDER_ID,
                status: "DELIVERED",
                proposal: null,
            } as any);

            const request = new Request("http://localhost:3000/api/proposals", {
                method: "POST",
                body: JSON.stringify({ orderId: VALID_ORDER_ID }),
            });

            const response = await POST(request);
            expect(response.status).toBe(400);
        });

        it("should create proposal with unique code", async () => {
            vi.mocked(prisma.order.findUnique).mockResolvedValue({
                id: VALID_ORDER_ID,
                status: "PENDING",
                proposal: null,
                client: { firstName: "John" },
                agency: { name: "Agency 1" },
            } as any);

            vi.mocked(prisma.$transaction).mockResolvedValue([
                {
                    id: "new-prop",
                    orderId: VALID_ORDER_ID,
                    code: "AB12",
                    expiresAt: new Date("2026-12-31"),
                    order: {
                        client: { firstName: "John" },
                        agency: { name: "Agency 1" },
                    },
                },
                {},
            ] as any);

            const request = new Request("http://localhost:3000/api/proposals", {
                method: "POST",
                body: JSON.stringify({ orderId: VALID_ORDER_ID, expiresInHours: 48 }),
            });

            const response = await POST(request);

            expect(response.status).toBe(201);
            const json = await response.json();
            expect(json.data.code).toBe("AB12");
            expect(json.data.proposalLink).toContain("/p/AB12");
        });
    });
});

describe("API /api/p/[token] (Public)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("GET /api/p/[token]", () => {
        it("should return 404 if proposal not found", async () => {
            vi.mocked(prisma.deliveryProposal.findUnique).mockResolvedValue(null);

            const response = await GET_BY_TOKEN(
                new Request("http://localhost:3000/api/p/XXXX"),
                { params: Promise.resolve({ token: "XXXX" }) }
            );

            expect(response.status).toBe(404);
        });

        it("should return 410 if proposal expired", async () => {
            vi.mocked(prisma.deliveryProposal.findUnique).mockResolvedValue({
                id: "prop-1",
                code: "AB12",
                decision: "PENDING",
                expiresAt: new Date("2020-01-01"), // Expired
                order: {
                    productDescription: "Test",
                    client: { firstName: "John" },
                    agency: { name: "Agency" },
                },
            } as any);
            vi.mocked(prisma.deliveryProposal.update).mockResolvedValue({} as any);

            const response = await GET_BY_TOKEN(
                new Request("http://localhost:3000/api/p/AB12"),
                { params: Promise.resolve({ token: "AB12" }) }
            );

            expect(response.status).toBe(410);
        });

        it("should return proposal data for valid code", async () => {
            vi.mocked(prisma.deliveryProposal.findUnique).mockResolvedValue({
                id: "prop-1",
                code: "AB12",
                decision: "PENDING",
                expiresAt: new Date("2030-12-31"),
                deliveryAddress: null,
                paymentChoice: null,
                order: {
                    productDescription: "Test Product",
                    amount: 5000,
                    status: "PROPOSAL_SENT",
                    client: { firstName: "John", lastName: "Doe" },
                    agency: { name: "Agency 1", address: "123 Rue", city: "Paris" },
                },
                booking: null,
            } as any);

            const response = await GET_BY_TOKEN(
                new Request("http://localhost:3000/api/p/AB12"),
                { params: Promise.resolve({ token: "AB12" }) }
            );

            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.data.code).toBe("AB12");
            expect(json.data.order.productDescription).toBe("Test Product");
            expect(json.data.order.amount).toBe(5000);
        });
    });

    describe("POST /api/p/[token]/decide", () => {
        it("should return 404 if proposal not found", async () => {
            vi.mocked(prisma.deliveryProposal.findUnique).mockResolvedValue(null);

            const response = await DECIDE(
                new Request("http://localhost:3000/api/p/XXXX/decide", {
                    method: "POST",
                    body: JSON.stringify({ decision: "ACCEPTED" }),
                }),
                { params: Promise.resolve({ token: "XXXX" }) }
            );

            expect(response.status).toBe(404);
        });

        it("should return 400 if already decided", async () => {
            vi.mocked(prisma.deliveryProposal.findUnique).mockResolvedValue({
                id: "prop-1",
                decision: "ACCEPTED",
                expiresAt: new Date("2030-12-31"),
            } as any);

            const response = await DECIDE(
                new Request("http://localhost:3000/api/p/AB12/decide", {
                    method: "POST",
                    body: JSON.stringify({ decision: "REFUSED" }),
                }),
                { params: Promise.resolve({ token: "AB12" }) }
            );

            expect(response.status).toBe(400);
        });

        it("should return 400 if accepting without address", async () => {
            vi.mocked(prisma.deliveryProposal.findUnique).mockResolvedValue({
                id: "prop-1",
                decision: "PENDING",
                expiresAt: new Date("2030-12-31"),
                order: { id: VALID_ORDER_ID },
            } as any);

            const response = await DECIDE(
                new Request("http://localhost:3000/api/p/AB12/decide", {
                    method: "POST",
                    body: JSON.stringify({
                        decision: "ACCEPTED",
                        // Missing deliveryAddress
                        paymentChoice: "PAY_ON_DELIVERY",
                    }),
                }),
                { params: Promise.resolve({ token: "AB12" }) }
            );

            expect(response.status).toBe(400);
        });

        it("should refuse proposal and update order status", async () => {
            vi.mocked(prisma.deliveryProposal.findUnique)
                .mockResolvedValueOnce({
                    id: "prop-1",
                    orderId: VALID_ORDER_ID,
                    decision: "PENDING",
                    expiresAt: new Date("2030-12-31"),
                    order: { id: VALID_ORDER_ID },
                } as any)
                .mockResolvedValueOnce({
                    id: "prop-1",
                    decision: "REFUSED",
                    order: { status: "REFUSED" },
                    booking: null,
                } as any);

            vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as any);

            const response = await DECIDE(
                new Request("http://localhost:3000/api/p/AB12/decide", {
                    method: "POST",
                    body: JSON.stringify({ decision: "REFUSED" }),
                }),
                { params: Promise.resolve({ token: "AB12" }) }
            );

            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.data.decision).toBe("REFUSED");
        });

        it("should accept proposal with slot booking", async () => {
            vi.mocked(prisma.deliveryProposal.findUnique)
                .mockResolvedValueOnce({
                    id: "prop-1",
                    orderId: VALID_ORDER_ID,
                    decision: "PENDING",
                    expiresAt: new Date("2030-12-31"),
                    order: { id: VALID_ORDER_ID },
                } as any)
                .mockResolvedValueOnce({
                    id: "prop-1",
                    decision: "ACCEPTED",
                    order: { status: "SCHEDULED" },
                    booking: {
                        slot: { slotDate: new Date("2026-12-15"), slotHour: 14 },
                    },
                } as any);

            vi.mocked(prisma.timeSlot.findUnique).mockResolvedValue({
                id: VALID_SLOT_ID,
                isLocked: false,
                currentBookings: 2,
                maxCapacity: 4,
            } as any);

            vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}, {}, {}] as any);

            const response = await DECIDE(
                new Request("http://localhost:3000/api/p/AB12/decide", {
                    method: "POST",
                    body: JSON.stringify({
                        decision: "ACCEPTED",
                        deliveryAddress: "123 Rue de Paris, 75001 Paris",
                        paymentChoice: "PAY_ON_DELIVERY",
                        slotId: VALID_SLOT_ID,
                    }),
                }),
                { params: Promise.resolve({ token: "AB12" }) }
            );

            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.data.decision).toBe("ACCEPTED");
            expect(json.data.booking).not.toBeNull();
        });
    });
});
