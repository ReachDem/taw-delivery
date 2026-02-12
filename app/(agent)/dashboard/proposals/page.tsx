"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Loader2,
  Plus,
  Search,
  RefreshCw,
  FileText,
  ExternalLink,
  Send,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ProposalModal } from "@/components/agent/proposal-modal";

interface Proposal {
  id: string;
  code: string;
  decision: string;
  shortUrl?: string;
  expiresAt: string;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    productDescription: string;
    amount: number;
    client: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
    };
    agency: {
      id: string;
      name: string;
      city: string;
    };
  };
  booking?: {
    slot: {
      slotDate: string;
      slotHour: number;
    };
  };
}

export default function ProposalsPage() {
  const { data: session, isPending } = useSession();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sendingId, setSendingId] = useState<string | null>(null);

  const fetchProposals = async () => {
    try {
      const res = await fetch("/api/proposals");
      if (res.ok) {
        const data = await res.json();
        setProposals(data.data || []);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des propositions");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isPending && session?.user) {
      fetchProposals();
    }
  }, [isPending, session]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProposals();
  };

  const handleResend = async (proposalId: string) => {
    setSendingId(proposalId);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/send`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("SMS renvoyé avec succès");
        fetchProposals();
      } else {
        const error = await res.json();
        toast.error(error.message || "Erreur lors de l'envoi");
      }
    } catch (error) {
      toast.error("Erreur lors de l'envoi du SMS");
    } finally {
      setSendingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            En attente
          </Badge>
        );
      case "ACCEPTED":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Acceptée
          </Badge>
        );
      case "REFUSED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Refusée
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Expirée
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter proposals
  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch =
      searchQuery === "" ||
      proposal.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.order.client.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.order.client.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.order.client.phone.includes(searchQuery);

    const matchesStatus =
      statusFilter === "all" || proposal.decision === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isPending || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Overview</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">
                  Propositions
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

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
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Propositions envoyées
                </CardTitle>
                <CardDescription>
                  Liste de toutes les propositions de livraison
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  Actualiser
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 mt-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par code, nom ou téléphone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="ACCEPTED">Acceptées</SelectItem>
                  <SelectItem value="REFUSED">Refusées</SelectItem>
                  <SelectItem value="EXPIRED">Expirées</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            {filteredProposals.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="hidden lg:table-cell">Date d'envoi</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProposals.map((proposal) => (
                      <TableRow key={proposal.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/proposals/${proposal.code}`}
                            className="font-mono text-sm font-semibold text-emerald-600 hover:underline"
                          >
                            {proposal.code}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {proposal.order.client.firstName}{" "}
                              {proposal.order.client.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground md:hidden">
                              {proposal.order.client.phone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {proposal.order.client.phone}
                        </TableCell>
                        <TableCell>{getStatusBadge(proposal.decision)}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                          {formatDate(proposal.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/proposals/${proposal.code}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Voir détails
                                </Link>
                              </DropdownMenuItem>
                              {proposal.shortUrl && (
                                <DropdownMenuItem asChild>
                                  <a
                                    href={proposal.shortUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Ouvrir le lien
                                  </a>
                                </DropdownMenuItem>
                              )}
                              {proposal.decision === "PENDING" && (
                                <DropdownMenuItem
                                  onClick={() => handleResend(proposal.id)}
                                  disabled={sendingId === proposal.id}
                                >
                                  {sendingId === proposal.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                  )}
                                  Renvoyer SMS
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-1">
                  {searchQuery || statusFilter !== "all"
                    ? "Aucune proposition trouvée"
                    : "Aucune proposition"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all"
                    ? "Essayez de modifier vos filtres"
                    : "Commencez par créer une nouvelle proposition"}
                </p>
                {!searchQuery && statusFilter === "all" && (
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une proposition
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
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
