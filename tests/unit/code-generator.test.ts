/**
 * Tests unitaires pour lib/code-generator.ts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateUniqueCode } from "@/lib/code-generator";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
    default: {
        deliveryProposal: {
            findUnique: vi.fn(),
        },
    },
}));

import prisma from "@/lib/prisma";

describe("Code Generator", () => {
    describe("generateUniqueCode", () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it("should return a unique 4-char code when not found in DB", async () => {
            vi.mocked(prisma.deliveryProposal.findUnique).mockResolvedValue(null);

            const code = await generateUniqueCode();

            expect(code).toHaveLength(4);
            expect(prisma.deliveryProposal.findUnique).toHaveBeenCalled();
        });

        it("should only contain valid characters (no O, I, L, 0, 1)", async () => {
            vi.mocked(prisma.deliveryProposal.findUnique).mockResolvedValue(null);

            // Generate multiple codes to check character set
            for (let i = 0; i < 20; i++) {
                const code = await generateUniqueCode();
                expect(code).toMatch(/^[A-HJ-NP-Z2-9]+$/);
            }
        });

        it("should retry if code already exists", async () => {
            // First call returns existing, second returns null
            vi.mocked(prisma.deliveryProposal.findUnique)
                .mockResolvedValueOnce({ id: "existing" } as any)
                .mockResolvedValueOnce(null);

            const code = await generateUniqueCode();

            expect(code).toHaveLength(4);
            expect(prisma.deliveryProposal.findUnique).toHaveBeenCalledTimes(2);
        });

        it("should throw error after max retries", async () => {
            vi.mocked(prisma.deliveryProposal.findUnique).mockResolvedValue({ id: "existing" } as any);

            await expect(generateUniqueCode(3)).rejects.toThrow("Impossible de générer un code unique");
            expect(prisma.deliveryProposal.findUnique).toHaveBeenCalledTimes(3);
        });
    });
});
