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
  Search,
  RefreshCw,
  Package,
  MoreHorizontal,
  Eye,
  Truck,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Order {
  id: string;
  orderNumber: string;
  productDescription: string;
  amount: number;
  status: string;
  createdAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  proposal?: {
    id: string;
    code: string;
    decision: string;
    paymentChoice?: string;
    booking?: {
      slot: {
        slotDate: string;
        slotHour: number;
      };
    };
  };
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function OrdersPage() {
  const { data: session, isPending } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.data || []);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des commandes");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isPending && session?.user) {
      fetchOrders();
    }
  }, [isPending, session]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchOrders();
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: "En attente", className: "bg-gray-50 text-gray-700 border-gray-200" },
      PROPOSAL_SENT: { label: "Proposition envoyée", className: "bg-blue-50 text-blue-700 border-blue-200" },
      WAITING_RESPONSE: { label: "En attente de réponse", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      ACCEPTED: { label: "Acceptée", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      REFUSED: { label: "Refusée", className: "bg-red-50 text-red-700 border-red-200" },
      SCHEDULED: { label: "Planifiée", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
      IN_DELIVERY: { label: "En livraison", className: "bg-purple-50 text-purple-700 border-purple-200" },
      DELIVERED: { label: "Livrée", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      CANCELLED: { label: "Annulée", className: "bg-red-50 text-red-700 border-red-200" },
    };

    const config = statusMap[status] || { label: status, className: "" };
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentBadge = (choice?: string) => {
    switch (choice) {
      case "PAY_ON_DELIVERY":
        return (
          <Badge variant="outline" className="border-orange-200 text-orange-600 text-xs">
            À payer
          </Badge>
        );
      case "ALREADY_PAID":
        return (
          <Badge variant="outline" className="border-emerald-200 text-emerald-600 text-xs">
            Payé
          </Badge>
        );
      case "EXEMPT":
        return (
          <Badge variant="outline" className="border-blue-200 text-blue-600 text-xs">
            Exempté
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatSlotTime = (hour: number) => {
    return `${hour}:00 - ${hour + 1}:00`;
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchQuery === "" ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.client.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.client.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.client.phone.includes(searchQuery);

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

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
                <BreadcrumbPage className="font-medium">Commandes</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Commandes
                </CardTitle>
                <CardDescription>
                  Suivi des commandes et de leurs livraisons
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
                  placeholder="Rechercher par n° commande, nom ou téléphone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="PROPOSAL_SENT">Proposition envoyée</SelectItem>
                  <SelectItem value="WAITING_RESPONSE">En attente de réponse</SelectItem>
                  <SelectItem value="SCHEDULED">Planifiée</SelectItem>
                  <SelectItem value="IN_DELIVERY">En livraison</SelectItem>
                  <SelectItem value="DELIVERED">Livrée</SelectItem>
                  <SelectItem value="REFUSED">Refusée</SelectItem>
                  <SelectItem value="CANCELLED">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            {filteredOrders.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Commande</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="hidden md:table-cell">Créneau</TableHead>
                      <TableHead className="hidden lg:table-cell">Paiement</TableHead>
                      <TableHead className="hidden lg:table-cell">Livreur</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div>
                            <p className="font-mono text-sm font-medium">
                              {order.orderNumber}
                            </p>
                            {order.proposal && (
                              <Link
                                href={`/dashboard/proposals/${order.proposal.code}`}
                                className="text-xs text-emerald-600 hover:underline"
                              >
                                {order.proposal.code}
                              </Link>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {order.client.firstName} {order.client.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.client.phone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {order.proposal?.booking ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span>
                                {formatDate(order.proposal.booking.slot.slotDate)}
                              </span>
                              <span className="text-muted-foreground">
                                {formatSlotTime(order.proposal.booking.slot.slotHour)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {getPaymentBadge(order.proposal?.paymentChoice)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {order.driver ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Truck className="h-3 w-3 text-muted-foreground" />
                              <span>
                                {order.driver.firstName} {order.driver.lastName.charAt(0)}.
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Non assigné</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {order.proposal && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/proposals/${order.proposal.code}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Voir proposition
                                  </Link>
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
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-1">
                  {searchQuery || statusFilter !== "all"
                    ? "Aucune commande trouvée"
                    : "Aucune commande"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== "all"
                    ? "Essayez de modifier vos filtres"
                    : "Les commandes apparaîtront ici une fois créées"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
