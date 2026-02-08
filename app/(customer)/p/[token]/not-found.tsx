import Link from "next/link";

export default function ProposalNotFound() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
            <div className="space-y-4">
                <div className="text-6xl font-bold">Oups!</div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    Page introuvable.
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                    Ce lien n&apos;existe pas ou a expiré.
                </p>
                <p className="text-sm text-zinc-500">
                    Contactez votre agence pour plus d&apos;informations.
                </p>
            </div>
        </main>
    );
}
