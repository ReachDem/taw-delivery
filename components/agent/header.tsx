"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

interface AgentHeaderProps {
  onNewProposal?: () => void;
  showCTA?: boolean;
}

const routeLabels: Record<string, string> = {
  dashboard: "Overview",
  proposals: "Propositions",
  orders: "Commandes",
  settings: "Paramètres",
};

export function AgentHeader({ onNewProposal, showCTA = true }: AgentHeaderProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbs = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/");
    const label = routeLabels[segment] || segment.toUpperCase();
    const isLast = index === segments.length - 1;

    return { path, label, isLast, segment };
  });

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <BreadcrumbItem key={crumb.path}>
                {index > 0 && <BreadcrumbSeparator />}
                {crumb.isLast ? (
                  <BreadcrumbPage className="font-medium">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.path}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* CTA Button - Hidden on mobile, visible on md+ */}
      {showCTA && onNewProposal && (
        <Button
          onClick={onNewProposal}
          className="hidden md:flex bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvelle Proposition
        </Button>
      )}
    </header>
  );
}
