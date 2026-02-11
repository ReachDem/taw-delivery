/**
 * Tests d'intégration pour les APIs Clients
 * /api/clients et /api/clients/[id]
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth middleware
vi.mock("@/lib/auth-middleware", () => ({
    requireAuth: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
    default: {
        client: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
    },
}));

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { GET, POST } from "@/app/api/clients/route";
import { GET as GET_BY_ID, PATCH } from "@/app/api/clients/[id]/route";

const mockSession = {
    user: { id: "user-id", email: "user@test.com", role: "AGENT" },
    session: { id: "session-id" },
};

describe("API /api/clients", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(requireAuth).mockResolvedValue([mockSession, null]);
    });

    describe("GET /api/clients", () => {
        it("should return 401 if not authenticated", async () => {
            vi.mocked(requireAuth).mockResolvedValue([
                null,
                new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 }),
            ]);

            const request = new Request("http://localhost:3000/api/clients");
            const response = await GET(request);

            expect(response.status).toBe(401);
        });

        it("should return list of clients", async () => {
            vi.mocked(prisma.client.findMany).mockResolvedValue([
                {
                    id: "client-1",
                    firstName: "Marie",
                    lastName: "Diallo",
                    phone: "+221771234567",
                    email: null,
                    preferredLanguage: "fr",
                },
            ] as any);

            const request = new Request("http://localhost:3000/api/clients");
            const response = await GET(request);

            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.data).toHaveLength(1);
            expect(json.data[0].firstName).toBe("Marie");
        });
    });

    describe("POST /api/clients", () => {
        it("should return 400 for invalid phone", async () => {
            const request = new Request("http://localhost:3000/api/clients", {
                method: "POST",
                body: JSON.stringify({
                    firstName: "Test",
                    lastName: "User",
                    phone: "123", // Too short
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(400);
        });

        it("should return existing client if phone exists (200)", async () => {
            vi.mocked(prisma.client.findUnique).mockResolvedValue({
                id: "existing-client",
                firstName: "Existing",
                lastName: "Client",
                phone: "+221771234567",
            } as any);

            const request = new Request("http://localhost:3000/api/clients", {
                method: "POST",
                body: JSON.stringify({
                    firstName: "New",
                    lastName: "Client",
                    phone: "+221771234567",
                }),
            });

            const response = await POST(request);

            expect(response.status).toBe(200); // Not 201
            const json = await response.json();
            expect(json.data.firstName).toBe("Existing");
        });

        it("should create new client", async () => {
            vi.mocked(prisma.client.findUnique).mockResolvedValue(null);
            vi.mocked(prisma.client.create).mockResolvedValue({
                id: "new-client-id",
                firstName: "Amadou",
                lastName: "Ndiaye",
                phone: "+221779876543",
                email: null,
                preferredLanguage: "wo",
            } as any);

            const request = new Request("http://localhost:3000/api/clients", {
                method: "POST",
                body: JSON.stringify({
                    firstName: "Amadou",
                    lastName: "Ndiaye",
                    phone: "+221779876543",
                    preferredLanguage: "wo",
                }),
            });

            const response = await POST(request);

            expect(response.status).toBe(201);
            const json = await response.json();
            expect(json.data.firstName).toBe("Amadou");
            expect(json.data.preferredLanguage).toBe("wo");
        });
    });
});

describe("API /api/clients/[id]", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(requireAuth).mockResolvedValue([mockSession, null]);
    });

    describe("GET /api/clients/[id]", () => {
        it("should return 404 if client not found", async () => {
            vi.mocked(prisma.client.findUnique).mockResolvedValue(null);

            const response = await GET_BY_ID(
                new Request("http://localhost:3000/api/clients/non-existent"),
                { params: Promise.resolve({ id: "non-existent" }) }
            );

            expect(response.status).toBe(404);
        });

        it("should return client with recent orders", async () => {
            vi.mocked(prisma.client.findUnique).mockResolvedValue({
                id: "client-1",
                firstName: "Marie",
                lastName: "Diallo",
                phone: "+221771234567",
                orders: [
                    { id: "order-1", orderNumber: "ORD-001", status: "DELIVERED" },
                ],
            } as any);

            const response = await GET_BY_ID(
                new Request("http://localhost:3000/api/clients/client-1"),
                { params: Promise.resolve({ id: "client-1" }) }
            );

            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.data.orders).toHaveLength(1);
        });
    });

    describe("PATCH /api/clients/[id]", () => {
        it("should update client fields", async () => {
            vi.mocked(prisma.client.findUnique).mockResolvedValue({
                id: "client-1",
                firstName: "Marie",
            } as any);
            vi.mocked(prisma.client.update).mockResolvedValue({
                id: "client-1",
                firstName: "Marie",
                lastName: "Diallo-Ndiaye",
                email: "marie@example.com",
            } as any);

            const response = await PATCH(
                new Request("http://localhost:3000/api/clients/client-1", {
                    method: "PATCH",
                    body: JSON.stringify({
                        lastName: "Diallo-Ndiaye",
                        email: "marie@example.com",
                    }),
                }),
                { params: Promise.resolve({ id: "client-1" }) }
            );

            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.data.email).toBe("marie@example.com");
        });

        it("should allow changing preferred language", async () => {
            vi.mocked(prisma.client.findUnique).mockResolvedValue({
                id: "client-1",
                preferredLanguage: "fr",
            } as any);
            vi.mocked(prisma.client.update).mockResolvedValue({
                id: "client-1",
                preferredLanguage: "wo",
            } as any);

            const response = await PATCH(
                new Request("http://localhost:3000/api/clients/client-1", {
                    method: "PATCH",
                    body: JSON.stringify({ preferredLanguage: "wo" }),
                }),
                { params: Promise.resolve({ id: "client-1" }) }
            );

            expect(response.status).toBe(200);
        });
    });
});
