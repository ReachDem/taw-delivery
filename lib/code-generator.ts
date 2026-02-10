import prisma from "@/lib/prisma";

// Characters for code generation (uppercase letters + digits, excluding confusing ones like 0/O, 1/I)
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Generate a random 8-character alphanumeric code for better security
 * (increased from 4 to prevent brute force attacks)
 */
function generateRandomCode(): string {
    let code = "";
    for (let i = 0; i < 8; i++) {
        code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }
    return code;
}

/**
 * Generate a unique 8-character code for delivery proposals
 * Checks database for uniqueness and retries if collision
 */
export async function generateUniqueCode(maxRetries = 10): Promise<string> {
    for (let i = 0; i < maxRetries; i++) {
        const code = generateRandomCode();

        // Check if code already exists
        const existing = await prisma.deliveryProposal.findUnique({
            where: { code },
            select: { id: true },
        });

        if (!existing) {
            return code;
        }
    }

    // If we exhaust retries, throw an error
    throw new Error("Impossible de générer un code unique après plusieurs tentatives");
}
