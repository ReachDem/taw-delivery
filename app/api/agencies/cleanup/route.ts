import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// DELETE /api/agencies/cleanup - Delete all test agencies with cascade
export async function DELETE(request: NextRequest) {    if (process.env.NODE_ENV === "production") {        return NextResponse.json({ error: "This endpoint is not available in production" }, { status: 403 });    }
    try {
        // List all agencies first
        const agencies = await prisma.agency.findMany({
            include: {
                _count: {
                    select: {
                        agents: true,
                        drivers: true,
                        orders: true,
                        timeSlots: true,
                    },
                },
            },
        });

        console.log(`Found ${agencies.length} agencies to delete`);

        let deletedAgents = 0;
        let deletedDrivers = 0;
        let deletedOrders = 0;
        let deletedSlots = 0;

        // Delete related records for each agency
        for (const agency of agencies) {
            console.log(`Cleaning agency: ${agency.name}`);

            // IMPORTANT: Delete in correct order to respect foreign key constraints
            // Orders reference agents, so delete orders FIRST
            const orders = await prisma.order.deleteMany({
                where: { agencyId: agency.id },
            });
            deletedOrders += orders.count;

            // Now we can safely delete agents
            const agents = await prisma.agent.deleteMany({
                where: { agencyId: agency.id },
            });
            deletedAgents += agents.count;

            // Delete drivers
            const drivers = await prisma.driver.deleteMany({
                where: { agencyId: agency.id },
            });
            deletedDrivers += drivers.count;

            // Delete time slots
            const slots = await prisma.timeSlot.deleteMany({
                where: { agencyId: agency.id },
            });
            deletedSlots += slots.count;
        }

        // Now delete all agencies
        const deleted = await prisma.agency.deleteMany({});

        return NextResponse.json({
            success: true,
            message: `Nettoyage terminé`,
            summary: {
                agencies: deleted.count,
                agents: deletedAgents,
                drivers: deletedDrivers,
                orders: deletedOrders,
                timeSlots: deletedSlots,
            },
            deletedAgencies: agencies.map(a => ({
                name: a.name,
                city: a.city,
                agents: a._count.agents,
                drivers: a._count.drivers,
                orders: a._count.orders,
                timeSlots: a._count.timeSlots,
            })),
        });
    } catch (error) {
        console.error("Error deleting agencies:", error);
        return NextResponse.json(
            { error: "Erreur lors de la suppression des agences", details: String(error) },
            { status: 500 }
        );
    }
}
