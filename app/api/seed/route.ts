/**
 * API Route: Seed Database with Test Users using Better-Auth
 * GET /api/seed - Creates test users using Better-Auth's native functions
 * 
 * SECURITY: Only available in development mode
 */
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiResponse, apiError } from "@/lib/api-helpers";

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

export async function GET() {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
        return apiError("Seed not allowed in production", 403);
    }

    const results: string[] = [];

    try {
        for (const user of TEST_USERS) {
            // Check if user already exists
            const existing = await prisma.user.findUnique({
                where: { email: user.email },
            });

            if (existing) {
                // Delete existing user and their accounts to recreate with proper hash
                await prisma.account.deleteMany({
                    where: { userId: existing.id },
                });
                await prisma.session.deleteMany({
                    where: { userId: existing.id },
                });
                await prisma.user.delete({
                    where: { id: existing.id },
                });
                results.push(`🗑️ Deleted existing user: ${user.email}`);
            }

            // Use Better-Auth's internal API to create user with proper password hash
            // Better-Auth exposes an internal API that we can call directly
            const ctx = await auth.api.signUpEmail({
                body: {
                    email: user.email,
                    name: user.name,
                    password: user.password,
                },
            });

            if (ctx.user) {
                // Update the role (Better-Auth creates with default role)
                await prisma.user.update({
                    where: { id: ctx.user.id },
                    data: { role: user.role as any },
                });

                // Get or create Test Agency
                let agency = await prisma.agency.findFirst({
                    where: { name: "Test Agency" },
                });

                if (!agency) {
                    agency = await prisma.agency.create({
                        data: {
                            name: "Test Agency",
                            city: "Dakar",
                            address: "123 Rue Test",
                            phone: "+221771234567",
                        },
                    });
                }

                // Create Agent profile for all test users so they can create orders
                await prisma.agent.create({
                    data: {
                        userId: ctx.user.id,
                        agencyId: agency.id,
                        firstName: user.name.split(" ")[0],
                        lastName: user.name.split(" ")[1] || "User",
                    },
                });

                results.push(`✅ Created user: ${user.email} (${user.role}) with Agent profile`);
            } else {
                results.push(`❌ Failed to create: ${user.email}`);
            }
        }

        // Create a test agency
        const existingAgency = await prisma.agency.findFirst({
            where: { name: "Test Agency" },
        });

        if (!existingAgency) {
            const agency = await prisma.agency.create({
                data: {
                    name: "Test Agency",
                    city: "Dakar",
                    address: "123 Rue Test",
                    phone: "+221771234567",
                },
            });
            results.push(`✅ Created Test Agency (ID: ${agency.id})`);
        } else {
            results.push(`⏭️ Test Agency already exists (ID: ${existingAgency.id})`);
        }

        return apiResponse({
            message: "Seed completed",
            results,
            credentials: {
                admin: { email: "testadmin@taw-delivery.com", password: "testpassword" },
                superAdmin: { email: "testsuperadmin@taw-delivery.com", password: "testpassword" },
                agent: { email: "testagent@taw-delivery.com", password: "testpassword" },
            }
        });
    } catch (error: any) {
        console.error("Seed error:", error);
        return apiError(`Seed failed: ${error.message}`, 500);
    }
}
