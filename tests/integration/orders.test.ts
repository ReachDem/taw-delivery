/**
 * Tests d'intégration pour les APIs Commandes
 * /api/orders et /api/orders/[id]
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth middleware
vi.mock("@/lib/auth-middleware", () => ({
    requireAuth: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
    default: {
        order: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        client: {
            findUnique: vi.fn(),
        },
        agency: {
            findUnique: vi.fn(),
        },
        agent: {
            findUnique: vi.fn(),
        },
        driver: {
            findUnique: vi.fn(),
        },
    },
}));

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { GET, POST } from "@/app/api/orders/route";
import { GET as GET_BY_ID, PATCH } from "@/app/api/orders/[id]/route";

const mockSession = {
    user: { id: "agent-user-id", email: "agent@test.com", role: "AGENT" },
    session: { id: "session-id" },
};

// Valid UUIDs for testing (UUID v4 format)
const VALID_CLIENT_ID = "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d";
const VALID_AGENCY_ID = "b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e";
const VALID_ORDER_ID = "c3d4e5f6-a7b8-4c7d-9e1f-2a3b4c5d6e7f";
const VALID_DRIVER_ID = "d4e5f6a7-b8c9-4d8e-8f2a-3b4c5d6e7f8a";

describe("API /api/orders", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(requireAuth).mockResolvedValue([mockSession, null]);
    });

    describe("GET /api/orders", () => {
        it("should return list of orders", async () => {
            vi.mocked(prisma.order.findMany).mockResolvedValue([
                {
                    id: "order-1",
                    productDescription: "Colis électronique",
                    amount: 15000,
                    status: "PENDING",
                    client: { firstName: "Marie", lastName: "Diallo" },
                    agency: { name: "Agence Dakar" },
                    agent: { firstName: "Amadou" },
                    proposal: null,
                },
            ] as any);

            const request = new Request("http://localhost:3000/api/orders");
            const response = await GET(request);

            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.data).toHaveLength(1);
            expect(json.data[0].amount).toBe(15000);
        });

        it("should filter orders by agencyId", async () => {
            vi.mocked(prisma.order.findMany).mockResolvedValue([]);

            const request = new Request(`http://localhost:3000/api/orders?agencyId=${VALID_AGENCY_ID}`);
            await GET(request);

            expect(prisma.order.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ agencyId: VALID_AGENCY_ID }),
                })
            );
        });

        it("should filter orders by status", async () => {
            vi.mocked(prisma.order.findMany).mockResolvedValue([]);

            const request = new Request("http://localhost:3000/api/orders?status=DELIVERED");
            await GET(request);

            expect(prisma.order.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ status: "DELIVERED" }),
                })
            );
        });
    });

    describe("POST /api/orders", () => {
        it("should return 404 if client not found", async () => {
            vi.mocked(prisma.client.findUnique).mockResolvedValue(null);

            const request = new Request("http://localhost:3000/api/orders", {
                method: "POST",
                body: JSON.stringify({
                    clientId: VALID_CLIENT_ID,
                    agencyId: VALID_AGENCY_ID,
                    productDescription: "Test product",
                    amount: 10000,
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(404);
        });

        it("should return 404 if agency not found", async () => {
            vi.mocked(prisma.client.findUnique).mockResolvedValue({ id: VALID_CLIENT_ID } as any);
            vi.mocked(prisma.agency.findUnique).mockResolvedValue(null);

            const request = new Request("http://localhost:3000/api/orders", {
                method: "POST",
                body: JSON.stringify({
                    clientId: VALID_CLIENT_ID,
                    agencyId: VALID_AGENCY_ID,
                    productDescription: "Test product",
                    amount: 10000,
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(404);
        });

        it("should return 403 if user is not an agent", async () => {
            vi.mocked(prisma.client.findUnique).mockResolvedValue({ id: VALID_CLIENT_ID } as any);
            vi.mocked(prisma.agency.findUnique).mockResolvedValue({ id: VALID_AGENCY_ID } as any);
            vi.mocked(prisma.agent.findUnique).mockResolvedValue(null);

            const request = new Request("http://localhost:3000/api/orders", {
                method: "POST",
                body: JSON.stringify({
                    clientId: VALID_CLIENT_ID,
                    agencyId: VALID_AGENCY_ID,
                    productDescription: "Test product",
                    amount: 10000,
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(403);
        });

        it("should return 403 if agent from different agency", async () => {
            vi.mocked(prisma.client.findUnique).mockResolvedValue({ id: VALID_CLIENT_ID } as any);
            vi.mocked(prisma.agency.findUnique).mockResolvedValue({ id: VALID_AGENCY_ID } as any);
            vi.mocked(prisma.agent.findUnique).mockResolvedValue({
                id: "agent-1",
                agencyId: "different-agency-id",
            } as any);

            const request = new Request("http://localhost:3000/api/orders", {
                method: "POST",
                body: JSON.stringify({
                    clientId: VALID_CLIENT_ID,
                    agencyId: VALID_AGENCY_ID,
                    productDescription: "Test product",
                    amount: 10000,
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(403);
        });

        it("should create order successfully", async () => {
            vi.mocked(prisma.client.findUnique).mockResolvedValue({ id: VALID_CLIENT_ID } as any);
            vi.mocked(prisma.agency.findUnique).mockResolvedValue({ id: VALID_AGENCY_ID } as any);
            vi.mocked(prisma.agent.findUnique).mockResolvedValue({
                id: "agent-1",
                agencyId: VALID_AGENCY_ID,
            } as any);
            vi.mocked(prisma.order.create).mockResolvedValue({
                id: VALID_ORDER_ID,
                productDescription: "Smartphone Samsung",
                amount: 250000,
                status: "PENDING",
                client: { firstName: "Marie", lastName: "Diallo" },
                agency: { name: "Agence Dakar" },
                agent: { firstName: "Amadou" },
            } as any);

            const request = new Request("http://localhost:3000/api/orders", {
                method: "POST",
                body: JSON.stringify({
                    clientId: VALID_CLIENT_ID,
                    agencyId: VALID_AGENCY_ID,
                    productDescription: "Smartphone Samsung",
                    amount: 250000,
                }),
            });

            const response = await POST(request);

            expect(response.status).toBe(201);
            const json = await response.json();
            expect(json.data.productDescription).toBe("Smartphone Samsung");
            expect(json.data.amount).toBe(250000);
        });
    });
});

describe("API /api/orders/[id]", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(requireAuth).mockResolvedValue([mockSession, null]);
    });

    describe("GET /api/orders/[id]", () => {
        it("should return 404 if order not found", async () => {
            vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

            const response = await GET_BY_ID(
                new Request(`http://localhost:3000/api/orders/${VALID_ORDER_ID}`),
                { params: Promise.resolve({ id: VALID_ORDER_ID }) }
            );

            expect(response.status).toBe(404);
        });

        it("should return order with full details", async () => {
            vi.mocked(prisma.order.findUnique).mockResolvedValue({
                id: VALID_ORDER_ID,
                productDescription: "Colis",
                amount: 15000,
                status: "SCHEDULED",
                client: { firstName: "Marie" },
                agency: { name: "Agence Dakar" },
                agent: { user: { name: "Amadou" } },
                driver: { user: { name: "Ibrahima" } },
                proposal: {
                    decision: "ACCEPTED",
                    booking: { slot: { slotDate: new Date(), slotHour: 14 } },
                },
                messages: [],
            } as any);

            const response = await GET_BY_ID(
                new Request(`http://localhost:3000/api/orders/${VALID_ORDER_ID}`),
                { params: Promise.resolve({ id: VALID_ORDER_ID }) }
            );

            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.data.proposal.decision).toBe("ACCEPTED");
        });
    });

    describe("PATCH /api/orders/[id]", () => {
        it("should update order status", async () => {
            vi.mocked(prisma.order.findUnique).mockResolvedValue({
                id: VALID_ORDER_ID,
                status: "SCHEDULED",
            } as any);
            vi.mocked(prisma.order.update).mockResolvedValue({
                id: VALID_ORDER_ID,
                status: "IN_DELIVERY",
            } as any);

            const response = await PATCH(
                new Request(`http://localhost:3000/api/orders/${VALID_ORDER_ID}`, {
                    method: "PATCH",
                    body: JSON.stringify({ status: "IN_DELIVERY" }),
                }),
                { params: Promise.resolve({ id: VALID_ORDER_ID }) }
            );

            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.data.status).toBe("IN_DELIVERY");
        });

        it("should assign driver to order", async () => {
            vi.mocked(prisma.order.findUnique).mockResolvedValue({
                id: VALID_ORDER_ID,
                driverId: null,
            } as any);
            vi.mocked(prisma.driver.findUnique).mockResolvedValue({
                id: VALID_DRIVER_ID,
            } as any);
            vi.mocked(prisma.order.update).mockResolvedValue({
                id: VALID_ORDER_ID,
                driverId: VALID_DRIVER_ID,
            } as any);

            const response = await PATCH(
                new Request(`http://localhost:3000/api/orders/${VALID_ORDER_ID}`, {
                    method: "PATCH",
                    body: JSON.stringify({ driverId: VALID_DRIVER_ID }),
                }),
                { params: Promise.resolve({ id: VALID_ORDER_ID }) }
            );

            expect(response.status).toBe(200);
        });
    });
});
