import { cn } from "@/lib/utils";
import Link from "next/link";
import { Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ─── Dashed Line ────────────────────────────────────────────────

interface DashedLineProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

function DashedLine({
  orientation = "horizontal",
  className,
}: DashedLineProps) {
  const isHorizontal = orientation === "horizontal";
  return (
    <div
      className={cn(
        "text-muted-foreground relative",
        isHorizontal ? "h-px w-full" : "h-full w-px",
        className
      )}
    >
      <div
        className={cn(
          isHorizontal
            ? [
                "h-px w-full",
                "bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,currentColor_4px,currentColor_10px)]",
                "[mask-image:linear-gradient(90deg,transparent,black_25%,black_75%,transparent)]",
              ]
            : [
                "h-full w-px",
                "bg-[repeating-linear-gradient(180deg,transparent,transparent_4px,currentColor_4px,currentColor_10px)]",
                "[mask-image:linear-gradient(180deg,transparent,black_25%,black_75%,transparent)]",
              ]
        )}
      />
    </div>
  );
}

// ─── Navbar ─────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Truck className="h-5 w-5" />
          TGVAIRWABO
        </Link>
        <div className="flex items-center gap-8 text-sm text-muted-foreground">
          <Link href="#fonctionnement" className="transition-colors hover:text-foreground">
            Fonctionnement
          </Link>
          <Link href="#chiffres" className="transition-colors hover:text-foreground">
            Chiffres
          </Link>
          <Link href="/admin/login" className="transition-colors hover:text-foreground">
            Connexion
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Stats ──────────────────────────────────────────────────────

const stats = [
  { value: "24h", label: "Délai moyen de livraison" },
  { value: "8+", label: "Agences opérationnelles" },
  { value: "6", label: "Créneaux par heure max" },
  { value: "99%", label: "Propositions délivrées" },
];

// ─── Page ───────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-28 pb-20 lg:pt-36 lg:pb-32">
        <div className="container mx-auto flex max-w-5xl flex-col justify-between gap-8 px-6 md:gap-20 lg:flex-row lg:items-center lg:gap-24">
          {/* Left: copy */}
          <div className="flex-[1.5]">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              La livraison, simplifiée pour vos agences
            </h1>

            <p className="text-muted-foreground mt-5 text-xl md:text-2xl lg:text-3xl text-balance">
              Gérez créneaux, propositions et suivis depuis une seule plateforme.
            </p>

            <div className="text-muted-foreground mt-8 hidden max-w-lg space-y-6 text-lg text-balance md:block lg:mt-12">
              <p>
                TAW-Delivery permet à chaque agence de configurer ses tarifs, ses
                horaires de livraison et sa capacité. Les agents créent des
                propositions en quelques clics, les clients confirment via un
                lien sécurisé.
              </p>
              <p>
                Plus de feuilles volantes, plus d&apos;appels interminables.
                Chaque colis est suivi, chaque créneau est optimisé, chaque
                livraison est tracée du début à la fin.
              </p>
            </div>
          </div>

          {/* Right: stats */}
          <div className="relative flex flex-1 flex-col justify-center gap-3 pt-10 lg:pt-0 lg:pl-10">
            <DashedLine
              orientation="vertical"
              className="absolute top-0 left-0 max-lg:hidden"
            />
            <DashedLine
              orientation="horizontal"
              className="absolute top-0 lg:hidden"
            />
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <div className="text-4xl font-semibold tracking-wide md:text-5xl">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Built with love by <Badge variant="outline">ReachDem</Badge>
      </footer>
    </div>
  );
}
