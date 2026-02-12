"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Loader2,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  LogOut,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

interface Organization {
  id: string;
  name: string;
  slug: string;
  metadata?: {
    city?: string;
    address?: string;
    phone?: string;
  };
  members?: Array<{
    userId: string;
    role: string;
  }>;
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) {
        router.push("/login");
        return;
      }

      try {
        const { data: org } = await authClient.organization.getFullOrganization();
        setOrganization(org);
        console.error("Error fetching organization:", error);
        toast.error("Erreur lors du chargement de l'agence.");
        setIsLoading(false);
      }
    };

    if (!isPending) {
      fetchData();
    }
  }, [session, isPending, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/");
          },
        },
      });
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
      setIsLoggingOut(false);
    }
  };

  const userInitials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "AG";

  const userRole = organization?.members?.find(
    (m) => m.userId === session?.user?.id
  )?.role;

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
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Overview</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">Paramètres</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 md:p-6 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground">
            Gérez votre profil et vos préférences
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Mon profil
            </CardTitle>
            <CardDescription>
              Vos informations personnelles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{session.user.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="capitalize">
                    {session.user.role?.toLowerCase() || "agent"}
                  </Badge>
                  {userRole && (
                    <Badge variant="outline" className="capitalize">
                      {userRole.toLowerCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{session.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rôle système</p>
                  <p className="font-medium capitalize">
                    {session.user.role?.toLowerCase() || "Agent"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agency Card */}
        {organization && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Mon agence
              </CardTitle>
              <CardDescription>
                Informations de votre agence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nom de l'agence</p>
                <p className="text-lg font-semibold">{organization.name}</p>
              </div>

              {organization.metadata?.city && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{organization.metadata.city}</span>
                </div>
              )}

              {organization.metadata?.address && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{organization.metadata.address}</span>
                </div>
              )}

              {organization.metadata?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{organization.metadata.phone}</span>
                </div>
              )}

              <div className="pt-2">
                <p className="text-sm text-muted-foreground">
                  Membres de l'agence
                </p>
                <p className="font-medium">
                  {organization.members?.length || 0} membre(s)
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logout Section */}
        <Card className="border-red-100">
          <CardHeader>
            <CardTitle className="text-red-600">Zone de danger</CardTitle>
            <CardDescription>
              Actions irréversibles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Déconnexion</p>
                <p className="text-sm text-muted-foreground">
                  Vous serez redirigé vers la page d'accueil
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                Déconnexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
