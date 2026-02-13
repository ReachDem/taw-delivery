import { z } from "zod";
import prisma from "@/lib/prisma";
import { OrderStatus, MessageChannel, MessageStatus } from "@/lib/generated/prisma/client";
import { apiResponse, apiError, validateBody } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-middleware";
import { generateUniqueCode } from "@/lib/code-generator";
import { upsertShortLink } from "@/lib/link-shortener";
import { sendSMS } from "@/lib/sms";
import { getProposalUrl } from "@/lib/url";

// ============================================
// Validation Schema
// ============================================

const createAndSendSchema = z.object({
    // Client Information
    clientName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    phone: z
        .string()
        .min(9, "Numéro de téléphone invalide")
        .regex(/^[\d\s+()-]+$/, "Format de téléphone invalide"),
    email: z.string().email("Email invalide").optional().or(z.literal("")),

    // Shipment Details
    refId: z.string().optional(),
    contents: z.string().min(3, "Description requise"),
    amount: z.string().optional(),

    // Options
    expiresInHours: z.number().min(1).max(168).default(48),
});

// ============================================
// POST /api/proposals/create-and-send
// Atomic endpoint: Create client, order, proposal + send SMS
// ============================================

export async function POST(request: Request) {
    const [session, authError] = await requireAuth();
    if (authError) return authError;

    const validation = await validateBody(request, createAndSendSchema);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // Get the agent associated with the current user
    const agent = await prisma.agent.findUnique({
        where: { userId: session.user.id },
        include: { agency: true },
    });

    if (!agent) {
        return apiError("Vous devez être un agent pour créer une proposition", 403);
    }

    // Parse client name
    const nameParts = data.clientName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "";

    // Parse amount
    const amount = data.amount ? parseFloat(data.amount) : 0;

    // Generate unique proposal code
    const code = await generateUniqueCode();

    // Calculate expiration
    const expiresAt = new Date(Date.now() + data.expiresInHours * 60 * 60 * 1000);

    try {
        // ============================================
        // TRANSACTION: Create all records atomically
        // ============================================
        const result = await prisma.$transaction(async (tx) => {
            // 1. Find or create client
            let client = await tx.client.findFirst({
                where: { phone: data.phone },
            });

            if (!client) {
                client = await tx.client.create({
                    data: {
                        firstName,
                        lastName,
                        phone: data.phone,
                        email: data.email || null,
                    },
                });
            } else {
                // Update client info if changed
                client = await tx.client.update({
                    where: { id: client.id },
                    data: {
                        firstName,
                        lastName,
                        email: data.email || client.email,
                    },
                });
            }

            // 2. Create order
            const order = await tx.order.create({
                data: {
                    clientId: client.id,
                    agencyId: agent.agencyId,
                    agentId: agent.id,
                    productDescription: data.contents,
                    amount,
                    specialInstructions: data.refId ? `REF: ${data.refId}` : null,
                    status: OrderStatus.PROPOSAL_SENT,
                },
            });

            // 3. Create proposal
            const proposal = await tx.deliveryProposal.create({
                data: {
                    orderId: order.id,
                    code,
                    expiresAt,
                },
                include: {
                    order: {
                        include: {
                            client: {
                                select: { id: true, firstName: true, lastName: true, phone: true },
                            },
                            agency: {
                                select: { id: true, name: true, city: true },
                            },
                        },
                    },
                },
            });

            return { client, order, proposal };
        });

        const { proposal } = result;

        // ============================================
        // AFTER TRANSACTION: Send SMS (external service)
        // ============================================

        // Generate proposal URL
        const proposalUrl = getProposalUrl(code);

        // Create short link
        let shortUrl: string = proposalUrl;
        try {
            const shortLink = await upsertShortLink(proposalUrl, code);
            shortUrl = shortLink.shortUrl;

            // Update proposal with short URL (outside transaction, non-critical)
            await prisma.deliveryProposal.update({
                where: { id: proposal.id },
                data: { shortUrl },
            });
        } catch (linkError) {
            console.error("Short link creation failed, using full URL:", linkError);
        }

        // Build SMS message
        const clientDisplayName = firstName;
        const agencyName = agent.agency?.name || "TGVAIRWABO";
        const message = `${clientDisplayName}, votre colis est arrivé chez ${agencyName}! Choisissez votre mode de livraison: ${shortUrl}`;

        // Send SMS
        let smsStatus: "sent" | "failed" = "sent";
        let smsError: string | null = null;

        try {
            await sendSMS("TGVAIRWABO", message, data.phone);

            // Log successful message
            await prisma.messageLog.create({
                data: {
                    orderId: proposal.orderId,
                    channel: MessageChannel.SMS,
                    recipient: data.phone,
                    content: message,
                    status: MessageStatus.SENT,
                },
            });

            // Update order status
            await prisma.order.update({
                where: { id: proposal.orderId },
                data: { status: OrderStatus.WAITING_RESPONSE },
            });
        } catch (err) {
            console.error("SMS send failed:", err);
            smsStatus = "failed";
            smsError = err instanceof Error ? err.message : "Unknown error";

            // Log failed message
            await prisma.messageLog.create({
                data: {
                    orderId: proposal.orderId,
                    channel: MessageChannel.SMS,
                    recipient: data.phone,
                    content: message,
                    status: MessageStatus.FAILED,
                },
            });
        }

        // Return response
        return apiResponse(
            {
                success: true,
                proposal: {
                    id: proposal.id,
                    code: proposal.code,
                    shortUrl,
                    proposalUrl,
                    expiresAt: proposal.expiresAt,
                },
                client: {
                    id: result.client.id,
                    name: `${firstName} ${lastName}`.trim(),
                    phone: data.phone,
                },
                sms: {
                    status: smsStatus,
                    error: smsError,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Transaction failed:", error);

        // Return appropriate error
        if (error instanceof Error) {
            return apiError(error.message, 500);
        }

        return apiError("Erreur lors de la création de la proposition", 500);
    }
}
