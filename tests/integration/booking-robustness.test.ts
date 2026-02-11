import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { POST as createBooking } from "@/app/api/bookings/route";
import { POST as createOrder } from "@/app/api/orders/route";
import { POST as createProposal } from "@/app/api/proposals/route";
import { POST as decideProposal } from "@/app/api/p/[token]/decide/route";
import prisma from "@/lib/prisma";
import { OrderStatus } from "@/lib/generated/prisma/client";

// Mocks for Auth and Helpers
// We need to bypass actual auth middleware or mock it globally, 
// but since we are integration testing route handlers, we might need to mock the context.
// However, the route handlers call `requireAuth()` which uses `better-auth`.
// A simpler approach for this specific test is to assume the API logic is correct 
// and test the *service* logic or mock the `requireAuth`.
// 
// Given the setup in other tests, let's see how `invitations.test.ts` does it.
// It seems `api-helpers.ts` and `auth-middleware` are used.
// I will just use the database directly for setup and check the API response for the booking part specifically, 
// or simpler: just test the logic by calling the handler if I can mock the request.

describe("Booking Robustness", () => {
    let agencyId: string;
    let clientId: string;
    let agentUserId: string;
    let orderIdA: string;
    let orderIdB: string;
    let proposalIdA: string;
    let proposalIdB: string;
    let slotId: string;
    let tokenA: string;
    let tokenB: string;

    beforeAll(async () => {
        // Cleanup
        await prisma.booking.deleteMany();
        await prisma.deliveryProposal.deleteMany();
        await prisma.order.deleteMany();
        await prisma.timeSlot.deleteMany();

        // Setup Agency & Client
        const agency = await prisma.agency.findFirst(); // Assume seed data exists or create
        if (!agency) throw new Error("No agency found");
        agencyId = agency.id;

        const client = await prisma.client.create({
            data: { firstName: "Rob", lastName: "Test", phone: "+221770009988" }
        });
        clientId = client.id;

        // Get Agent (created by seed)
        const agent = await prisma.agent.findFirst();
        if (!agent) throw new Error("No agent found");
        agentUserId = agent.userId;

        // Create Orders directly in DB to avoid Auth mocking for setup
        const orderA = await prisma.order.create({
            data: {
                clientId,
                agencyId,
                agentId: agent.id,
                productDescription: "Test Order A",
                amount: 5000,
                status: OrderStatus.PENDING
            }
        });
        orderIdA = orderA.id;

        const orderB = await prisma.order.create({
            data: {
                clientId,
                agencyId,
                agentId: agent.id,
                productDescription: "Test Order B",
                amount: 5000,
                status: OrderStatus.PENDING
            }
        });
        orderIdB = orderB.id;

        // Create Slot with Capacity 1
        const slot = await prisma.timeSlot.create({
            data: {
                agencyId,
                slotDate: new Date(Date.now() + 86400000), // Tomorrow
                slotHour: 10,
                maxCapacity: 1,
                currentBookings: 0,
                isLocked: false
            }
        });
        slotId = slot.id;

        // Create Proposals (with tokens)
        const propA = await prisma.deliveryProposal.create({
            data: {
                orderId: orderIdA,
                code: "CODEA",
                expiresAt: new Date(Date.now() + 86400000)
            }
        });
        proposalIdA = propA.id;
        tokenA = propA.code;

        const propB = await prisma.deliveryProposal.create({
            data: {
                orderId: orderIdB,
                code: "CODEB",
                expiresAt: new Date(Date.now() + 86400000)
            }
        });
        proposalIdB = propB.id;
        tokenB = propB.code;

        // Accept Proposals directly
        await prisma.deliveryProposal.update({
            where: { id: proposalIdA },
            data: { decision: "ACCEPTED", deliveryAddress: "Addr A", paymentChoice: "PAY_ON_DELIVERY" }
        });
        await prisma.deliveryProposal.update({
            where: { id: proposalIdB },
            data: { decision: "ACCEPTED", deliveryAddress: "Addr B", paymentChoice: "PAY_ON_DELIVERY" }
        });
    });

    it("should allow booking a valid slot", async () => {
        const req = new Request("http://localhost/api/bookings", {
            method: "POST",
            body: JSON.stringify({ proposalId: proposalIdA, slotId })
        });

        const response = await createBooking(req);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
    });

    it("should reject booking when slot is full (Capacity 1)", async () => {
        const req = new Request("http://localhost/api/bookings", {
            method: "POST",
            body: JSON.stringify({ proposalId: proposalIdB, slotId })
        });

        const response = await createBooking(req);
        const data = await response.json();

        expect(response.status).toBe(409); // Conflict
        expect(data.error).toContain("complet");
    });

    it("should reject double booking for the same proposal", async () => {
        const req = new Request("http://localhost/api/bookings", {
            method: "POST",
            body: JSON.stringify({ proposalId: proposalIdA, slotId }) // Already booked in test 1
        });

        const response = await createBooking(req);
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toContain("déjà un créneau");
    });
});
