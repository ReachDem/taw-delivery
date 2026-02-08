/**
 * Test fixtures and helpers for integration tests
 * Provides mock data and test utilities
 */
import { vi } from "vitest";

// ============================================
// Test User Credentials
// ============================================

export const TEST_ADMIN = {
    id: "test-admin-id-12345678901234567890",
    email: "testadmin@taw-delivery.com",
    name: "Test Admin",
    role: "ADMIN" as const,
    password: "testpassword",
};

export const TEST_SUPER_ADMIN = {
    id: "test-super-admin-id-123456789012",
    email: "testsuperadmin@taw-delivery.com",
    name: "Test Super Admin",
    role: "SUPER_ADMIN" as const,
    password: "testpassword",
};

export const TEST_AGENT = {
    id: "test-agent-id-1234567890123456",
    email: "testagent@taw-delivery.com",
    name: "Test Agent",
    role: "AGENT" as const,
    password: "testpassword",
};

export const TEST_DRIVER = {
    id: "test-driver-id-12345678901234567",
    email: "testdriver@taw-delivery.com",
    name: "Test Driver",
    role: "DRIVER" as const,
    password: "testpassword",
};

// ============================================
// Valid UUIDs for Testing (UUID v4 format)
// ============================================

export const VALID_UUIDS = {
    agency: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    client: "b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e",
    order: "c3d4e5f6-a7b8-4c7d-9e1f-2a3b4c5d6e7f",
    proposal: "d4e5f6a7-b8c9-4d8e-8f2a-3b4c5d6e7f8a",
    slot: "e5f6a7b8-c9d0-4e9f-9a3b-4c5d6e7f8a9b",
    booking: "f6a7b8c9-d0e1-4f0a-ab4c-5d6e7f8a9b0c",
    agent: "a7b8c9d0-e1f2-4a1b-8c5d-6e7f8a9b0c1d",
    driver: "b8c9d0e1-f2a3-4b2c-9d6e-7f8a9b0c1d2e",
    invitation: "c9d0e1f2-a3b4-4c3d-ae7f-8a9b0c1d2e3f",
};

// ============================================
// Mock Session Factories
// ============================================

export function createMockSession(user: typeof TEST_ADMIN) {
    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
        session: {
            id: `session-${user.id}`,
            userId: user.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
    };
}

export const mockAdminSession = createMockSession(TEST_ADMIN);
export const mockSuperAdminSession = createMockSession(TEST_SUPER_ADMIN);
export const mockAgentSession = createMockSession(TEST_AGENT);
export const mockDriverSession = createMockSession(TEST_DRIVER);

// ============================================
// Mock Data Factories
// ============================================

export function createMockAgency(overrides = {}) {
    return {
        id: VALID_UUIDS.agency,
        name: "Agence Test Dakar",
        address: "123 Avenue Bourguiba",
        city: "Dakar",
        phone: "+221771234567",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}

export function createMockClient(overrides = {}) {
    return {
        id: VALID_UUIDS.client,
        firstName: "Marie",
        lastName: "Diallo",
        phone: "+221779876543",
        email: "marie@example.com",
        preferredLanguage: "fr",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}

export function createMockOrder(overrides = {}) {
    return {
        id: VALID_UUIDS.order,
        clientId: VALID_UUIDS.client,
        agencyId: VALID_UUIDS.agency,
        agentId: VALID_UUIDS.agent,
        productDescription: "Colis électronique",
        amount: 15000,
        status: "PENDING",
        specialInstructions: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}

export function createMockProposal(overrides = {}) {
    return {
        id: VALID_UUIDS.proposal,
        orderId: VALID_UUIDS.order,
        code: "AB12",
        decision: "PENDING",
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        deliveryAddress: null,
        paymentChoice: null,
        createdAt: new Date(),
        ...overrides,
    };
}

export function createMockSlot(overrides = {}) {
    return {
        id: VALID_UUIDS.slot,
        agencyId: VALID_UUIDS.agency,
        slotDate: new Date("2026-12-15"),
        slotHour: 14,
        maxCapacity: 4,
        currentBookings: 2,
        isLocked: false,
        ...overrides,
    };
}

export function createMockBooking(overrides = {}) {
    return {
        id: VALID_UUIDS.booking,
        slotId: VALID_UUIDS.slot,
        proposalId: VALID_UUIDS.proposal,
        position: 1,
        createdAt: new Date(),
        ...overrides,
    };
}

// ============================================
// Common Error Response Codes
// ============================================

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    GONE: 410,
    INTERNAL_ERROR: 500,
};

// ============================================
// Test Utilities
// ============================================

/**
 * Creates a mock Request object for testing
 */
export function createMockRequest(
    url: string,
    options: {
        method?: string;
        body?: object;
        headers?: Record<string, string>;
    } = {}
) {
    return new Request(url, {
        method: options.method || "GET",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });
}

/**
 * Helper to setup auth middleware mocks
 */
export function mockAuthMiddleware(
    requireAuth: any,
    requireAdmin?: any,
    requireSuperAdmin?: any
) {
    return {
        asUnauthorized: () => {
            const errorResponse = new Response(
                JSON.stringify({ success: false, error: "Non authentifié" }),
                { status: 401 }
            );
            if (requireAuth) vi.mocked(requireAuth).mockResolvedValue([null, errorResponse]);
            if (requireAdmin) vi.mocked(requireAdmin).mockResolvedValue([null, errorResponse]);
            if (requireSuperAdmin) vi.mocked(requireSuperAdmin).mockResolvedValue([null, errorResponse]);
        },
        asForbidden: () => {
            const errorResponse = new Response(
                JSON.stringify({ success: false, error: "Accès interdit" }),
                { status: 403 }
            );
            if (requireAuth) vi.mocked(requireAuth).mockResolvedValue([null, errorResponse]);
            if (requireAdmin) vi.mocked(requireAdmin).mockResolvedValue([null, errorResponse]);
            if (requireSuperAdmin) vi.mocked(requireSuperAdmin).mockResolvedValue([null, errorResponse]);
        },
        asAdmin: () => {
            if (requireAuth) vi.mocked(requireAuth).mockResolvedValue([mockAdminSession, null]);
            if (requireAdmin) vi.mocked(requireAdmin).mockResolvedValue([mockAdminSession, null]);
        },
        asSuperAdmin: () => {
            if (requireAuth) vi.mocked(requireAuth).mockResolvedValue([mockSuperAdminSession, null]);
            if (requireAdmin) vi.mocked(requireAdmin).mockResolvedValue([mockSuperAdminSession, null]);
            if (requireSuperAdmin) vi.mocked(requireSuperAdmin).mockResolvedValue([mockSuperAdminSession, null]);
        },
        asAgent: () => {
            if (requireAuth) vi.mocked(requireAuth).mockResolvedValue([mockAgentSession, null]);
        },
    };
}
