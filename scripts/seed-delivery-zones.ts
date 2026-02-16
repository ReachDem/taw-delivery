/**
 * Seed script for delivery zones
 * Run with: npx tsx scripts/seed-delivery-zones.ts
 * 
 * This script imports delivery zones from CSV files and assigns them to agencies.
 */

import 'dotenv/config';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

interface ZoneData {
    quartier: string;
    tarif: string;
    ville: string;
}

async function main() {
    // Dynamic imports for Prisma with Neon adapter
    const { PrismaClient } = await import("../lib/generated/prisma/client.js");
    const { PrismaNeon } = await import("@prisma/adapter-neon");
    const { neonConfig } = await import("@neondatabase/serverless");
    const ws = await import("ws");

    // Configure WebSocket for Node.js
    neonConfig.webSocketConstructor = ws.default;

    // Initialize Prisma with Neon adapter
    const connectionString = process.env.DATABASE_URL!;
    const adapter = new PrismaNeon({ connectionString });
    const prisma = new PrismaClient({ adapter });

    console.log("🌱 Seeding delivery zones...\n");

    try {
        // Find agencies to assign zones to (Douala agencies)
        const agencies = await prisma.agency.findMany({
            where: {
                city: {
                    equals: 'Douala',
                    mode: 'insensitive'
                }
            }
        });

        if (agencies.length === 0) {
            // Create a default Douala agency if none exists
            console.log("📍 No Douala agency found, creating one...");
            const newAgency = await prisma.agency.create({
                data: {
                    name: "TAW Douala",
                    city: "Douala",
                    address: "Akwa, Douala",
                    phone: "+237690000000"
                }
            });
            agencies = [newAgency];
            console.log(`✅ Created agency: ${newAgency.name}`);
        }

        // Read CSV file
        const scriptDir = dirname(fileURLToPath(import.meta.url));
        const csvPath = join(scriptDir, '../prisma/seed-data/delivery-zones-douala.csv');
        const csvContent = readFileSync(csvPath, 'utf-8');
        
        // Parse CSV
        const lines = csvContent.trim().split('\n');
        const headers = lines[0].split(',');
        
        const zones: ZoneData[] = lines.slice(1).map(line => {
            const values = line.split(',');
            return {
                quartier: values[0].trim(),
                tarif: values[1].trim(),
                ville: values[2].trim()
            };
        });

        console.log(`📊 Found ${zones.length} zones to import\n`);

        // Import zones for each Douala agency
        for (const agency of agencies) {
            console.log(`🏢 Processing agency: ${agency.name}`);
            
            let created = 0;
            let skipped = 0;

            for (let i = 0; i < zones.length; i++) {
                const zone = zones[i];
                
                try {
                    await prisma.deliveryZone.upsert({
                        where: {
                            agencyId_name: {
                                agencyId: agency.id,
                                name: zone.quartier
                            }
                        },
                        update: {
                            baseFee: parseFloat(zone.tarif),
                            city: zone.ville,
                            isActive: true
                        },
                        create: {
                            agencyId: agency.id,
                            name: zone.quartier,
                            city: zone.ville,
                            baseFee: parseFloat(zone.tarif),
                            sortOrder: i,
                            isActive: true
                        }
                    });
                    created++;
                } catch (error) {
                    console.error(`   ⚠️ Error with zone ${zone.quartier}:`, error);
                    skipped++;
                }
            }

            console.log(`   ✅ Imported ${created} zones, skipped ${skipped}`);
        }

        console.log("\n🎉 Delivery zones seed completed!");
        await prisma.$disconnect();

    } catch (error) {
        console.error("❌ Seed failed:", error);
        throw error;
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
