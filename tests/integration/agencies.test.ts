/**
 * Tests d'intégration pour les APIs Agences
 * /api/agencies et /api/agencies/[id]
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth middleware
vi.mock("@/lib/auth-middleware", () => ({
    requireAdmin: vi.fn(),
    requireSuperAdmin: vi.fn(),
    requireAuth: vi.fn(),
    requireRole: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
    default: {
        agency: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

import prisma from "@/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth-middleware";
import { GET, POST } from "@/app/api/agencies/route";
import { GET as GET_BY_ID, PATCH, DELETE } from "@/app/api/agencies/[id]/route";

const mockAdminSession = {
    user: { id: "admin-id", email: "admin@test.com", role: "ADMIN" },
    session: { id: "session-id" },
};

const mockSuperAdminSession = {
    user: { id: "super-id", email: "super@test.com", role: "SUPER_ADMIN" },
    session: { id: "session-id" },
};

describe("API /api/agencies", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("GET /api/agencies", () => {
        it("should return 401 if not authenticated", async () => {
            vi.mocked(requireAdmin).mockResolvedValue([
                null,
                new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 }),
            ]);

            const request = new Request("http://localhost:3000/api/agencies");
            const response = await GET(request);

            expect(response.status).toBe(401);
        });

        it("should return list of agencies", async () => {
            vi.mocked(requireAdmin).mockResolvedValue([mockAdminSession, null]);
            vi.mocked(prisma.agency.findMany).mockResolvedValue([
                {
                    id: "agency-1",
                    name: "Agence Paris",
                    address: "123 Rue de Paris",
                    city: "Paris",
                    phone: "0123456789",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    _count: { agents: 5, drivers: 3, orders: 100 },
                },
            ] as any);

            const request = new Request("http://localhost:3000/api/agencies");
            const response = await GET(request);

            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.success).toBe(true);
            expect(json.data).toHaveLength(1);
            expect(json.data[0].name).toBe("Agence Paris");
        });

        it("should filter agencies by city", async () => {
            vi.mocked(requireAdmin).mockResolvedValue([mockAdminSession, null]);
            vi.mocked(prisma.agency.findMany).mockResolvedValue([]);

            const request = new Request("http://localhost:3000/api/agencies?city=Lyon");
            await GET(request);

            expect(prisma.agency.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { city: expect.objectContaining({ contains: "Lyon" }) },
                })
            );
        });
    });

    describe("POST /api/agencies", () => {
        it("should return 401 if not super admin", async () => {
            vi.mocked(requireSuperAdmin).mockResolvedValue([
                null,
                new Response(JSON.stringify({ error: "Accès interdit" }), { status: 403 }),
            ]);

            const request = new Request("http://localhost:3000/api/agencies", {
                method: "POST",
                body: JSON.stringify({
                    name: "New Agency",
                    address: "123 Street",
                    city: "City",
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(403);
        });

        it("should return 400 for invalid data", async () => {
            vi.mocked(requireSuperAdmin).mockResolvedValue([mockSuperAdminSession, null]);

            const request = new Request("http://localhost:3000/api/agencies", {
                method: "POST",
                body: JSON.stringify({ name: "A" }), // Too short
            });

            const response = await POST(request);
            expect(response.status).toBe(400);
        });

        it("should return 409 if agency exists in same city", async () => {
            vi.mocked(requireSuperAdmin).mockResolvedValue([mockSuperAdminSession, null]);
            vi.mocked(prisma.agency.findFirst).mockResolvedValue({
                id: "existing",
                name: "Agence Test",
                city: "Paris",
            } as any);

            const request = new Request("http://localhost:3000/api/agencies", {
                method: "POST",
                body: JSON.stringify({
                    name: "Agence Test",
                    address: "123 Rue de Paris",
                    city: "Paris",
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(409);
        });

        it("should create agency successfully", async () => {
            vi.mocked(requireSuperAdmin).mockResolvedValue([mockSuperAdminSession, null]);
            vi.mocked(prisma.agency.findFirst).mockResolvedValue(null);
            vi.mocked(prisma.agency.create).mockResolvedValue({
                id: "new-agency-id",
                name: "Nouvelle Agence",
                address: "456 Avenue",
                city: "Lyon",
                phone: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

            const request = new Request("http://localhost:3000/api/agencies", {
                method: "POST",
                body: JSON.stringify({
                    name: "Nouvelle Agence",
                    address: "456 Avenue",
                    city: "Lyon",
                }),
            });

            const response = await POST(request);

            expect(response.status).toBe(201);
            const json = await response.json();
            expect(json.data.name).toBe("Nouvelle Agence");
        });
    });
});

describe("API /api/agencies/[id]", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("GET /api/agencies/[id]", () => {
        it("should return 404 if agency not found", async () => {
            vi.mocked(requireAdmin).mockResolvedValue([mockAdminSession, null]);
            vi.mocked(prisma.agency.findUnique).mockResolvedValue(null);

            const response = await GET_BY_ID(
                new Request("http://localhost:3000/api/agencies/non-existent"),
                { params: Promise.resolve({ id: "non-existent" }) }
            );

            expect(response.status).toBe(404);
        });

        it("should return agency details with agents and drivers", async () => {
            vi.mocked(requireAdmin).mockResolvedValue([mockAdminSession, null]);
            vi.mocked(prisma.agency.findUnique).mockResolvedValue({
                id: "agency-1",
                name: "Agence Test",
                address: "123 Rue",
                city: "Paris",
                phone: "0123456789",
                agents: [{ id: "agent-1", user: { name: "Agent 1" } }],
                drivers: [{ id: "driver-1", user: { name: "Driver 1" } }],
                _count: { orders: 50, timeSlots: 100 },
            } as any);

            const response = await GET_BY_ID(
                new Request("http://localhost:3000/api/agencies/agency-1"),
                { params: Promise.resolve({ id: "agency-1" }) }
            );

            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.data.agents).toHaveLength(1);
            expect(json.data.drivers).toHaveLength(1);
        });
    });

    describe("PATCH /api/agencies/[id]", () => {
        it("should update agency fields", async () => {
            vi.mocked(requireSuperAdmin).mockResolvedValue([mockSuperAdminSession, null]);
            vi.mocked(prisma.agency.findUnique).mockResolvedValue({
                id: "agency-1",
                name: "Old Name",
                city: "Paris",
            } as any);
            vi.mocked(prisma.agency.findFirst).mockResolvedValue(null);
            vi.mocked(prisma.agency.update).mockResolvedValue({
                id: "agency-1",
                name: "New Name",
                address: "123 Rue",
                city: "Paris",
            } as any);

            const response = await PATCH(
                new Request("http://localhost:3000/api/agencies/agency-1", {
                    method: "PATCH",
                    body: JSON.stringify({ name: "New Name" }),
                }),
                { params: Promise.resolve({ id: "agency-1" }) }
            );

            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.data.name).toBe("New Name");
        });
    });

    describe("DELETE /api/agencies/[id]", () => {
        it("should return 409 if agency has orders", async () => {
            vi.mocked(requireSuperAdmin).mockResolvedValue([mockSuperAdminSession, null]);
            vi.mocked(prisma.agency.findUnique).mockResolvedValue({
                id: "agency-1",
                _count: { orders: 10, agents: 0, drivers: 0 },
            } as any);

            const response = await DELETE(
                new Request("http://localhost:3000/api/agencies/agency-1", { method: "DELETE" }),
                { params: Promise.resolve({ id: "agency-1" }) }
            );

            expect(response.status).toBe(409);
        });

        it("should delete agency successfully", async () => {
            vi.mocked(requireSuperAdmin).mockResolvedValue([mockSuperAdminSession, null]);
            vi.mocked(prisma.agency.findUnique).mockResolvedValue({
                id: "agency-1",
                _count: { orders: 0, agents: 0, drivers: 0 },
            } as any);
            vi.mocked(prisma.agency.delete).mockResolvedValue({} as any);

            const response = await DELETE(
                new Request("http://localhost:3000/api/agencies/agency-1", { method: "DELETE" }),
                { params: Promise.resolve({ id: "agency-1" }) }
            );

            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.data.deleted).toBe(true);
        });
    });
});
