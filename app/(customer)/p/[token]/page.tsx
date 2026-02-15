import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { ProposalView } from "@/components/customer/proposal-view";

interface ProposalPageProps {
  params: Promise<{ token: string }>;
}

export default async function ProposalPage({ params }: ProposalPageProps) {
  const { token } = await params;

  // Fetch proposal by code (8-char alphanumeric)
  const proposal = await prisma.deliveryProposal.findUnique({
    where: { code: token },
    include: {
      order: {
        include: {
          client: {
            select: { firstName: true, lastName: true },
          },
          agency: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!proposal) {
    notFound();
  }

  // Serialize the proposal for client component
  const serializedProposal = {
    id: proposal.id,
    code: proposal.code,
    decision: proposal.decision,
    expiresAt: proposal.expiresAt.toISOString(),
    deliveryAddress: proposal.deliveryAddress,
    paymentChoice: proposal.paymentChoice,
    order: {
      productDescription: proposal.order.productDescription,
      amount: Number(proposal.order.amount),
      locationKnown: proposal.order.locationKnown,
      client: proposal.order.client,
      agency: proposal.order.agency,
      pricing: {
        productAmount: Number(
          proposal.order.productAmount ?? proposal.order.amount,
        ),
        deliveryFee: proposal.order.deliveryFee
          ? Number(proposal.order.deliveryFee)
          : null,
        totalAmount: Number(proposal.order.amount),
      },
    },
  };

  return <ProposalView initialProposal={serializedProposal} />;
}
