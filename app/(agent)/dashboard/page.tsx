"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { LOGIN_ROUTE } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Loader2,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  FileText,
  Package,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { ProposalModal } from "@/components/agent/proposal-modal";

interface ProposalStats {
  pending: number;
  accepted: number;
  refused: number;
  acceptanceRate: number;
}

interface RecentProposal {
  id: string;
  code: string;
  decision: string;
  createdAt: string;
  order: {
    client: {
      firstName: string;
      lastName: string;
    };
  };
}

interface UpcomingDelivery {
  id: string;
  orderNumber: string;
  status: string;
  client: {
    firstName: string;
    lastName: string;
  };
  proposal?: {
    booking?: {
      slot: {
        slotDate: string;
        slotHour: number;
      };
    };
  };
}

export default function AgentDashboard() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [stats, setStats] = useState<ProposalStats | null>(null);
  const [recentProposals, setRecentProposals] = useState<RecentProposal[]>([]);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<UpcomingDelivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) {
        router.push(LOGIN_ROUTE);
        return;
      }

      try {
        // Fetch stats, recent proposals, and deliveries in parallel
        const [statsRes, proposalsRes, ordersRes] = await Promise.all([
          fetch("/api/proposals/stats"),
          fetch("/api/proposals?limit=5"),
          fetch("/api/orders?status=SCHEDULED,IN_DELIVERY&limit=5"),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        }

        if (proposalsRes.ok) {
          const proposalsData = await proposalsRes.json();
          setRecentProposals(proposalsData.data || []);
        }

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setUpcomingDeliveries(ordersData.data || []);
        }
      } catch (error) {
        toast.error("Erreur lors du chargement des données");
      } finally {
        setIsLoading(false);
      }
    };

    if (!isPending) {
      fetchData();
    }
  }, [session, isPending, router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">En attente</Badge>;
      case "ACCEPTED":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Acceptée</Badge>;
      case "REFUSED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Refusée</Badge>;
      case "EXPIRED":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Expirée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Planifiée</Badge>;
      case "IN_DELIVERY":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">En cours</Badge>;
      case "DELIVERED":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Livrée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isPending || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div>
            <h1 className="text-lg font-semibold">Overview</h1>
          </div>
        </div>

        {/* CTA Button - Desktop */}
        <Button
          onClick={() => setIsModalOpen(true)}
          className="hidden md:flex bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvelle Proposition
        </Button>
      </header>

      {/* Main Content */}
      <div className="p-4 md:p-6 space-y-6">
        {/* Welcome Message */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Bonjour, {session.user.name?.split(" ")[0]} 👋
            </h2>
            <p className="text-muted-foreground">
              Voici un aperçu de votre activité
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En attente
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pending ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                propositions sans réponse
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Acceptées
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {stats?.accepted ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">ce mois-ci</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Refusées
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats?.refused ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">ce mois-ci</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taux d'acceptation
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats?.acceptanceRate ?? 0}%
              </div>
              <p className="text-xs text-muted-foreground">objectif: 85%</p>
            </CardContent>
          </Card>
        </div>

        {/* Tables Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Proposals Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Dernières propositions
                </CardTitle>
                <CardDescription>Les 5 dernières propositions envoyées</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/proposals" className="gap-1">
                  Voir tout <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentProposals.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentProposals.map((proposal) => (
                      <TableRow key={proposal.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/proposals/${proposal.code}`}
                            className="font-mono text-sm font-medium text-emerald-600 hover:underline"
                          >
                            {proposal.code}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {proposal.order?.client?.firstName}{" "}
                          {proposal.order?.client?.lastName}
                        </TableCell>
                        <TableCell>{getStatusBadge(proposal.decision)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune proposition récente</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deliveries Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Livraisons à venir
                </CardTitle>
                <CardDescription>Commandes planifiées ou en cours</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/orders" className="gap-1">
                  Voir tout <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingDeliveries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Commande</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingDeliveries.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell>
                          {order.client?.firstName} {order.client?.lastName}
                        </TableCell>
                        <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune livraison planifiée</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAB for mobile */}
      <Button
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700 z-50"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Proposal Modal */}
      <ProposalModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
