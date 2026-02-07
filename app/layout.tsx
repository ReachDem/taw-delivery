import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TAW Delivery - Système de Notification & Retrait de Colis",
  description: "Application multi-agences pour gérer l'arrivée des colis, notifier les destinataires par SMS, et tracker le processus jusqu'au retrait/livraison.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
