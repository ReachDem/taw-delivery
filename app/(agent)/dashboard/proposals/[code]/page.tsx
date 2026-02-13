"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ArrowLeft,
  Send,
  ExternalLink,
  User,
  Package,
  Clock,
  MapPin,
  CreditCard,
  Calendar,
  Link as LinkIcon,
  Phone,
  Mail,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { getProposalUrl } from "@/lib/url";

interface ProposalDetail {
  id: string;
  code: string;
  decision: string;
  shortUrl?: string;
  expiresAt: string;
  createdAt: string;
  deliveryAddress?: string;
  paymentChoice?: string;
  decidedAt?: string;
  order: {
    id: string;
    orderNumber: string;
    productDescription: string;
    amount: number;
    specialInstructions?: string;
    status: string;
    client: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
    };
    agency: {
      id: string;
      name: string;
      city: string;
    };
  };
  booking?: {
    position: number;
    slot: {
      slotDate: string;
      slotHour: number;
    };
  };
}

export default function ProposalDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        // Fetch from the public API using code
        const res = await fetch(`/api/p/${code}`);
        if (res.ok) {
          const data = await res.json();
          setProposal(data.data);
        } else {
          toast.error("Proposition non trouvée");
          router.push("/dashboard/proposals");
        }
      } catch (error) {
        toast.error("Erreur lors du chargement");
      } finally {
        setIsLoading(false);
      }
    };

    if (!isPending && session?.user) {
      fetchProposal();
    }
  }, [isPending, session, code, router]);

  const handleResend = async () => {
    if (!proposal) return;
    setIsSending(true);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/send`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("SMS renvoyé avec succès");
        // Refresh proposal data
        const refreshRes = await fetch(`/api/p/${code}`);
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setProposal(data.data);
        }
      } else {
        const error = await res.json();
        toast.error(error.message || "Erreur lors de l'envoi");
      }
    } catch (error) {
      toast.error("Erreur lors de l'envoi du SMS");
    } finally {
      setIsSending(false);
    }
  };

  const copyLink = () => {
    const link = proposal?.shortUrl || `${window.location.origin}/p/${code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Lien copié!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            En attente
          </Badge>
        );
      case "ACCEPTED":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            Acceptée
          </Badge>
        );
      case "REFUSED":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Refusée
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Expirée
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentBadge = (choice?: string) => {
    switch (choice) {
      case "PAY_ON_DELIVERY":
        return (
          <Badge variant="outline" className="border-orange-200 text-orange-700">
            Paiement à la livraison
          </Badge>
        );
      case "ALREADY_PAID":
        return (
          <Badge variant="outline" className="border-emerald-200 text-emerald-700">
            Déjà payé
          </Badge>
        );
      case "EXEMPT":
        return (
          <Badge variant="outline" className="border-blue-200 text-blue-700">
            Exempté
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-gray-200 text-gray-500">
            Non défini
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSlotTime = (hour: number) => {
    return `${hour}:00 - ${hour + 1}:00`;
  };

  if (isPending || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!proposal) {
    return null;
  }

  const isExpired = new Date(proposal.expiresAt) < new Date();

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
                <BreadcrumbLink asChild>
                  <Link href="/dashboard/proposals">Propositions</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-mono font-semibold">
                  {code}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          {proposal.decision === "PENDING" && !isExpired && (
            <Button
              onClick={handleResend}
              disabled={isSending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Renvoyer SMS
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 md:p-6 space-y-6">
        {/* Back button on mobile */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden -ml-2 mb-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        {/* Status Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-600 font-mono">
                    {code.slice(0, 2)}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold font-mono">{code}</h1>
                  <p className="text-muted-foreground">
                    Créée le {formatDate(proposal.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {getStatusBadge(proposal.decision)}
                {isExpired && proposal.decision === "PENDING" && (
                  <Badge variant="destructive">Expirée</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nom complet</p>
                <p className="font-medium">
                  {proposal.order.client.firstName}{" "}
                  {proposal.order.client.lastName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{proposal.order.client.phone}</span>
              </div>
              {proposal.order.client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{proposal.order.client.email}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Détails du colis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">N° Commande</p>
                <p className="font-mono font-medium">
                  {proposal.order.orderNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p>{proposal.order.productDescription}</p>
              </div>
              {proposal.order.amount > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Montant</p>
                  <p className="font-semibold text-lg">
                    {proposal.order.amount.toLocaleString()} FCFA
                  </p>
                </div>
              )}
              {proposal.order.specialInstructions && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Instructions spéciales
                  </p>
                  <p className="text-sm">{proposal.order.specialInstructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Link Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Lien de proposition
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm truncate">
                  {proposal.shortUrl || `${window.location.origin}/p/${code}`}
                </div>
                <Button variant="outline" size="icon" onClick={copyLink}>
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" size="icon" asChild>
                  <a
                    href={proposal.shortUrl || `/p/${code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Expire le{" "}
                  {new Date(proposal.expiresAt).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Decision Details (if decided) */}
          {proposal.decision !== "PENDING" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {proposal.decision === "ACCEPTED" ? (
                    <Calendar className="h-5 w-5" />
                  ) : (
                    <Clock className="h-5 w-5" />
                  )}
                  Décision client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Décision prise le</p>
                  <p>{proposal.decidedAt ? formatDate(proposal.decidedAt) : "—"}</p>
                </div>

                {proposal.decision === "ACCEPTED" && (
                  <>
                    {proposal.booking && (
                      <div>
                        <p className="text-sm text-muted-foreground">Créneau choisi</p>
                        <p className="font-medium">
                          {new Date(proposal.booking.slot.slotDate).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "2-digit",
                            month: "long",
                          })}{" "}
                          - {formatSlotTime(proposal.booking.slot.slotHour)}
                        </p>
                      </div>
                    )}

                    {proposal.deliveryAddress && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{proposal.deliveryAddress}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      {getPaymentBadge(proposal.paymentChoice)}
                    </div>
                  </>
                )}

                {proposal.decision === "REFUSED" && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-sm text-red-700">
                      Le client a refusé la livraison. Le colis est disponible au
                      retrait en agence.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
