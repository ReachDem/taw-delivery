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

                // Get or create Test Agency & Organization
                let agency = await prisma.agency.findFirst({
                    where: { name: "Test Agency" },
                    include: { organization: true }
                });

                let organizationId = agency?.organizationId;

                if (!agency) {
                    // Create Organization first
                    const org = await prisma.organization.create({
                        data: {
                            id: "test-agency-org",
                            name: "Test Agency",
                            slug: "test-agency",
                            createdAt: new Date(),
                        }
                    });
                    organizationId = org.id;

                    agency = await prisma.agency.create({
                        data: {
                            name: "Test Agency",
                            city: "Dakar",
                            address: "123 Rue Test",
                            phone: "+221771234567",
                            organizationId: org.id
                        },
                        include: { organization: true }
                    });
                } else if (!agency.organizationId) {
                    // Link existing agency to new org if missing
                    const org = await prisma.organization.create({
                        data: {
                            id: "test-agency-org",
                            name: "Test Agency",
                            slug: "test-agency",
                            createdAt: new Date(),
                        }
                    });
                    organizationId = org.id;
                    await prisma.agency.update({
                        where: { id: agency.id },
                        data: { organizationId: org.id }
                    });
                }

                // Add as Member to Organization
                if (organizationId) {
                    await prisma.member.create({
                        data: {
                            id: `member-${ctx.user.id}`,
                            organizationId: organizationId,
                            userId: ctx.user.id,
                            role: user.role === "SUPER_ADMIN" ? "owner" : user.role === "ADMIN" ? "admin" : "member",
                            createdAt: new Date(),
                        }
                    });
                }

                // Keep legacy Agent profile for now
                await prisma.agent.create({
                    data: {
                        userId: ctx.user.id,
                        agencyId: agency!.id,
                        firstName: user.name.split(" ")[0],
                        lastName: user.name.split(" ")[1] || "User",
                    },
                });

                results.push(`✅ Created user: ${user.email} (${user.role}) with Member & Agent profile`);
            } else {
                results.push(`❌ Failed to create: ${user.email}`);
            }
        }

        return apiResponse({
            message: "Seed completed with Better-Auth Organizations",
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
