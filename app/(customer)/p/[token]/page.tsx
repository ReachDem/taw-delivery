import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

interface ProposalPageProps {
    params: { token: string };
}

export default async function ProposalPage({ params }: ProposalPageProps) {
    const { token } = params;

    // Fetch proposal by code (4-char alphanumeric)
    const proposal = await prisma.deliveryProposal.findUnique({
        where: { code: token },
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
        notFound();
    }

    // Check if expired
    const isExpired = new Date() > proposal.expiresAt;

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        Votre Livraison
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        {proposal.order.agency.name}
                    </p>
                </div>

                {/* Order Details Card */}
                <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-zinc-800">
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-zinc-500">Client</p>
                            <p className="font-medium">
                                {proposal.order.client.firstName} {proposal.order.client.lastName}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500">Commande</p>
                            <p className="font-medium">{proposal.order.productDescription}</p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500">Montant</p>
                            <p className="text-xl font-bold text-emerald-600">
                                {proposal.order.amount.toString()} FCFA
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status / Actions */}
                {isExpired ? (
                    <div className="rounded-lg bg-red-50 p-4 text-center text-red-600 dark:bg-red-900/20">
                        Cette proposition a expiré
                    </div>
                ) : proposal.decision === "PENDING" ? (
                    <div className="space-y-3">
                        <button className="w-full rounded-lg bg-emerald-600 py-4 text-lg font-semibold text-white transition hover:bg-emerald-700">
                            ✓ Accepter la Livraison
                        </button>
                        <button className="w-full rounded-lg border border-zinc-300 py-4 text-lg font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300">
                            ✗ Refuser (Retrait en agence)
                        </button>
                    </div>
                ) : (
                    <div className="rounded-lg bg-emerald-50 p-4 text-center text-emerald-600 dark:bg-emerald-900/20">
                        {proposal.decision === "ACCEPTED"
                            ? "Livraison confirmée ✓"
                            : "Retrait en agence confirmé"}
                    </div>
                )}
            </div>
        </main>
    );
}
