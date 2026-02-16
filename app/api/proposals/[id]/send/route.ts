import prisma from "@/lib/prisma";
import { OrderStatus, MessageChannel, MessageStatus } from "@/lib/generated/prisma/client";
import { apiResponse, apiError } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-middleware";
import { createShortLink } from "@/lib/link-shortener";
import { sendSMS } from "@/lib/sms";
import { getProposalUrl } from "@/lib/url";

// ============================================
// POST /api/proposals/[id]/send - Send proposal SMS
// ============================================

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const [session, authError] = await requireAuth();
    if (authError) return authError;

    const { id } = await params;

    try {
        // Get the proposal with related data
        const proposal = await prisma.deliveryProposal.findUnique({
            where: { id },
            include: {
                order: {
                    include: {
                        client: true,
                        agency: true,
                    },
                },
            },
        });

        if (!proposal) {
            return apiError("Proposition non trouvée", 404);
        }

        // Authorization: ensure the caller can act on this proposal's order
        const user = session?.user as { role?: string; agencyId?: string } | undefined;

        if (user?.role !== "SUPER_ADMIN") {
            // Try to derive the agency ID from the order or its agency relation
            const proposalAgencyId =
                proposal.order?.agencyId ??
                proposal.order?.agency?.id ?? null;

            if (!proposalAgencyId || proposalAgencyId !== user?.agencyId) {
                return apiError("Accès non autorisé à cette proposition", 403);
            }
        }
        if (!proposal.order.client.phone) {
            return apiError("Le client n'a pas de numéro de téléphone", 400);
        }

        // Build the proposal URL
        const proposalUrl = getProposalUrl(proposal.code);

        // Create/update short link
        let shortUrl: string;
        try {
            const shortLink = await createShortLink(proposalUrl, proposal.code);
            shortUrl = shortLink.shortUrl;

            // Update proposal with short URL
            await prisma.deliveryProposal.update({
                where: { id },
                data: { shortUrl },
            });
        } catch (error) {
            console.error("Short link creation failed, using full URL:", error);
            // Fallback to full URL if short link fails
            shortUrl = proposalUrl;
        }

        // Build SMS message (keep under 160 chars)
        const clientName = proposal.order.client.firstName || "Client";
        const agencyName = proposal.order.agency?.name || "TGVAIRWABO";
        
        const message = `${clientName}, votre colis est arrivé chez ${agencyName}! Choisissez votre mode de livraison: ${shortUrl}`;

        // Send SMS
        try {
            await sendSMS("TGVAIRWABO", message, proposal.order.client.phone);
            
            // Log the message
            await prisma.messageLog.create({
                data: {
                    orderId: proposal.orderId,
                    channel: MessageChannel.SMS,
                    recipient: proposal.order.client.phone,
                    content: message,
                    status: MessageStatus.SENT,
                },
            });

            // Update order status
            await prisma.order.update({
                where: { id: proposal.orderId },
                data: { status: OrderStatus.WAITING_RESPONSE },
            });

            return apiResponse({
                success: true,
                shortUrl,
                message: "SMS envoyé avec succès",
            });
        } catch (smsError) {
            console.error("SMS send failed:", smsError);

            // Log the failed message
            await prisma.messageLog.create({
                data: {
                    orderId: proposal.orderId,
                    channel: MessageChannel.SMS,
                    recipient: proposal.order.client.phone,
                    content: message,
                    status: MessageStatus.FAILED,
                },
            });

            return apiError("Échec de l'envoi du SMS", 500);
        }
    } catch (error) {
        console.error("Error sending proposal:", error);
        return apiError("Erreur lors de l'envoi de la proposition", 500);
    }
}
