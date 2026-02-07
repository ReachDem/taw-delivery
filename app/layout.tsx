import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TAW Delivery - Gestion de Colis",
  description: "Système de notification et retrait de colis pour agences multi-pays",
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
