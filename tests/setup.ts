import { vi } from "vitest";

// Mock environment variables
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.BETTER_AUTH_SECRET = "test-secret-key-for-testing-only";
process.env.BETTER_AUTH_URL = "http://localhost:3000";

// Mock Next.js headers for API routes
vi.mock("next/headers", () => ({
    cookies: () => ({
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
    }),
    headers: () => new Map(),
}));

// Mock better-auth/react
vi.mock("better-auth/react", () => ({
    createAuthClient: () => ({
        useSession: () => ({ data: null, isPending: false }),
        signIn: vi.fn(),
        signOut: vi.fn(),
    }),
}));
