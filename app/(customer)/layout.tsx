import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "TGVAIRWABO - Proposition de Livraison",
    description: "Confirmez votre livraison",
};

export default function CustomerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
            {children}
        </div>
    );
}
