/**
 * Tests d'intégration pour les APIs Invitations
 * /api/invitations
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

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
        invitation: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
        },
        agency: {
            findUnique: vi.fn(),
        },
    },
}));

// Mock code generator
vi.mock("@/lib/code-generator", () => ({
    generateInvitationToken: vi.fn().mockResolvedValue("test-invitation-token-123"),
}));

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-middleware";
import { GET, POST } from "@/app/api/invitations/route";

const mockSession = {
    user: {
        id: "admin-user-id",
        email: "admin@test.com",
        name: "Admin",
        role: "ADMIN",
    },
    session: { id: "session-id" },
};

describe("API /api/invitations", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: authenticated as admin
        vi.mocked(requireAdmin).mockResolvedValue([mockSession, null]);
    });

    describe("GET /api/invitations", () => {
        it("should return 401 if not authenticated", async () => {
            vi.mocked(requireAdmin).mockResolvedValue([
                null,
                new Response(JSON.stringify({ success: false, error: "Non authentifié" }), { status: 401 }),
            ]);

            const response = await GET();

            expect(response.status).toBe(401);
        });

        it("should return list of invitations", async () => {
            const mockInvitations = [
                {
                    id: "inv-1",
                    email: "user1@test.com",
                    role: "AGENT",
                    status: "PENDING",
                    token: "token-1",
                    expiresAt: new Date("2026-12-31"),
                    createdAt: new Date(),
                    invitedBy: "admin-user-id",
                    agency: { id: "agency-1", name: "Agency 1" },
                },
            ];

            vi.mocked(prisma.invitation.findMany).mockResolvedValue(mockInvitations as any);

            const response = await GET();

            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.success).toBe(true);
            expect(json.data).toHaveLength(1);
            expect(json.data[0].email).toBe("user1@test.com");
        });
    });

    describe("POST /api/invitations", () => {
        it("should return 401 if not authenticated", async () => {
            vi.mocked(requireAdmin).mockResolvedValue([
                null,
                new Response(JSON.stringify({ success: false, error: "Non authentifié" }), { status: 401 }),
            ]);

            const request = new Request("http://localhost:3000/api/invitations", {
                method: "POST",
                body: JSON.stringify({ email: "test@test.com", role: "AGENT" }),
            });

            const response = await POST(request);
            expect(response.status).toBe(401);
        });

        it("should return 400 for invalid email", async () => {
            const request = new Request("http://localhost:3000/api/invitations", {
                method: "POST",
                body: JSON.stringify({ email: "invalid-email", role: "AGENT" }),
            });

            const response = await POST(request);

            expect(response.status).toBe(400);
            const json = await response.json();
            expect(json.success).toBe(false);
        });

        it("should return 409 if user already exists", async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                id: "existing-user",
                email: "existing@test.com",
            } as any);

            const request = new Request("http://localhost:3000/api/invitations", {
                method: "POST",
                body: JSON.stringify({ email: "existing@test.com", role: "AGENT" }),
            });

            const response = await POST(request);

            expect(response.status).toBe(409);
            const json = await response.json();
            expect(json.error).toContain("existe déjà");
        });

        it("should return 409 if invitation already pending", async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
            vi.mocked(prisma.invitation.findFirst).mockResolvedValue({
                id: "existing-inv",
                status: "PENDING",
            } as any);

            const request = new Request("http://localhost:3000/api/invitations", {
                method: "POST",
                body: JSON.stringify({ email: "pending@test.com", role: "AGENT" }),
            });

            const response = await POST(request);

            expect(response.status).toBe(409);
        });

        it("should create invitation successfully", async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
            vi.mocked(prisma.invitation.findFirst).mockResolvedValue(null);
            vi.mocked(prisma.invitation.create).mockResolvedValue({
                id: "new-inv-id",
                email: "newuser@test.com",
                role: "AGENT",
                token: "test-invitation-token-123",
                status: "PENDING",
                expiresAt: new Date("2026-12-31"),
                createdAt: new Date(),
                invitedBy: "admin-user-id",
            } as any);

            const request = new Request("http://localhost:3000/api/invitations", {
                method: "POST",
                body: JSON.stringify({ email: "newuser@test.com", role: "AGENT" }),
            });

            const response = await POST(request);

            expect(response.status).toBe(201);
            const json = await response.json();
            expect(json.success).toBe(true);
            expect(json.data.email).toBe("newuser@test.com");
            expect(json.data.invitationLink).toContain("test-invitation-token-123");
        });

        it("should validate agency exists when provided", async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
            vi.mocked(prisma.invitation.findFirst).mockResolvedValue(null);
            vi.mocked(prisma.agency.findUnique).mockResolvedValue(null);

            // Using a valid UUID v4 format for agencyId
            const request = new Request("http://localhost:3000/api/invitations", {
                method: "POST",
                body: JSON.stringify({
                    email: "newuser@test.com",
                    role: "AGENT",
                    agencyId: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
                }),
            });

            const response = await POST(request);

            expect(response.status).toBe(404);
        });
    });
});
