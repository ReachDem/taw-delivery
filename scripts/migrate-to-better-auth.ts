/**
 * Migration Script: Convert Agencies to Better-Auth Organizations
 * 
 * This script creates Better-Auth organizations for each existing agency
 * and links them together.
 */

import "dotenv/config"; // Load env vars immediately
import prisma from "../lib/prisma";
import { generateId } from "better-auth";

async function migrateAgenciesToOrganizations() {
    console.log("🚀 Starting migration: Agencies → Organizations");

    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL is not set in environment!");
        process.exit(1);
    } else {
        console.log("✅ DATABASE_URL found");
    }

    try {
        // Get all agencies that don't have an organization yet
        const agencies = await prisma.agency.findMany({
            where: {
                organizationId: null,
            },
        });

        console.log(`📊 Found ${agencies.length} agencies to migrate`);

        for (const agency of agencies) {
            console.log(`\n📦 Processing agency: ${agency.name}`);

            // Create slug from agency name
            const slug = agency.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");

            // Check if slug already exists
            let finalSlug = slug;
            let counter = 1;
            while (
                await prisma.organization.findUnique({
                    where: { slug: finalSlug },
                })
            ) {
                finalSlug = `${slug}-${counter}`;
                counter++;
            }

            // Create Better-Auth organization
            const organization = await prisma.organization.create({
                data: {
                    id: generateId(),
                    name: agency.name,
                    slug: finalSlug,
                    createdAt: agency.createdAt,
                    metadata: JSON.stringify({
                        address: agency.address,
                        city: agency.city,
                        phone: agency.phone,
                    }),
                },
            });

            console.log(`  ✅ Created organization: ${organization.name} (${organization.slug})`);

            // Link agency to organization
            await prisma.agency.update({
                where: { id: agency.id },
                data: { organizationId: organization.id },
            });

            console.log(`  🔗 Linked agency to organization`);

            // Get all agents for this agency
            const agents = await prisma.agent.findMany({
                where: { agencyId: agency.id },
                include: { user: true },
            });

            console.log(`  👥 Found ${agents.length} agents to migrate`);

            // Create members for each agent
            for (const agent of agents) {
                const member = await prisma.member.create({
                    data: {
                        id: generateId(),
                        organizationId: organization.id,
                        userId: agent.userId,
                        role: agent.user.role === "SUPER_ADMIN" ? "owner" : agent.user.role === "ADMIN" ? "admin" : "member",
                        createdAt: agent.createdAt,
                    },
                });

                console.log(`    ✅ Created member: ${agent.user.name} (${member.role})`);
            }
        }

        console.log("\n✨ Migration completed successfully!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration
migrateAgenciesToOrganizations()
    .then(() => {
        console.log("\n🎉 All done!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n💥 Fatal error:", error);
        process.exit(1);
    });
