/**
 * Seed script to create test admin user
 * Run with: npx tsx prisma/seed.ts
 */

// Use dynamic import to load the generated Prisma client
async function main() {
    // Dynamic import of Prisma client
    const { PrismaClient } = await import("../lib/generated/prisma/client.js");
    const { scrypt, randomBytes } = await import("node:crypto");
    const { promisify } = await import("node:util");

    const prisma = new PrismaClient();
    const scryptAsync = promisify(scrypt);

    const TEST_USERS = [
        {
            email: "testadmin@taw-delivery.com",
            name: "Test Admin",
            password: "testpassword",
            role: "ADMIN",
        },
        {
            email: "testsuperadmin@taw-delivery.com",
            name: "Test Super Admin",
            password: "testpassword",
            role: "SUPER_ADMIN",
        },
        {
            email: "testagent@taw-delivery.com",
            name: "Test Agent",
            password: "testpassword",
            role: "AGENT",
        },
    ];

    // Hash password compatible with Better-Auth scrypt
    async function hashPassword(password: string): Promise<string> {
        const salt = randomBytes(16).toString("hex");
        const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
        return `${salt}:${derivedKey.toString("hex")}`;
    }

    console.log("🌱 Seeding database with test users...\n");

    try {
        for (const user of TEST_USERS) {
            // Check if user already exists
            const existing = await prisma.user.findUnique({
                where: { email: user.email },
            });

            if (existing) {
                console.log(`⏭️  User ${user.email} already exists, skipping`);
                continue;
            }

            // Hash password
            const hashedPassword = await hashPassword(user.password);

            // Create user
            await prisma.user.create({
                data: {
                    email: user.email,
                    name: user.name,
                    role: user.role as any,
                    emailVerified: true,
                    accounts: {
                        create: {
                            accountId: user.email,
                            providerId: "credential",
                            password: hashedPassword,
                        },
                    },
                },
            });

            console.log(`✅ Created user: ${user.email} (${user.role})`);
        }

        // Create a test agency
        const existingAgency = await prisma.agency.findFirst({
            where: { name: "Test Agency" },
        });

        if (!existingAgency) {
            await prisma.agency.create({
                data: {
                    name: "Test Agency",
                    city: "Dakar",
                    address: "123 Rue Test",
                    phone: "+221771234567",
                },
            });
            console.log("✅ Created test agency: Test Agency");
        } else {
            console.log("⏭️  Test Agency already exists, skipping");
        }

        console.log("\n🎉 Seed completed!");
    } catch (e) {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
