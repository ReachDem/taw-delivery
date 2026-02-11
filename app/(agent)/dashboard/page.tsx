"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, Building2, User } from "lucide-react";
import { toast } from "sonner";

export default function AgentDashboard() {
    const router = useRouter();
    const { data: session, isPending } = useSession();
    const [organization, setOrganization] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!session?.user) {
                router.push("/login");
                return;
            }

            try {
                // Get the full organization info
                const { data: org } = await authClient.organization.getFullOrganization();
                setOrganization(org);
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

    const handleLogout = async () => {
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
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
                        <p className="text-muted-foreground mt-1">
                            Bienvenue, {session.user.name} !
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogout}
                        className="gap-2"
                    >
                        <LogOut className="h-4 w-4" />
                        Déconnexion
                    </Button>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Profile Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Profil
                            </CardTitle>
                            <CardDescription>Vos informations personnelles</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Nom</p>
                                <p className="font-medium">{session.user.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{session.user.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Rôle</p>
                                <div className="mt-1">
                                    <Badge variant="secondary">Agent</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Organization Card */}
                    {organization ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Agence
                                </CardTitle>
                                <CardDescription>Informations de votre agence</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Nom de l'agence</p>
                                    <p className="font-medium">{organization.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Votre rôle dans l'agence</p>
                                    <div className="mt-1">
                                        <Badge variant="outline" className="capitalize">
                                            {organization.members?.find((m: any) => m.userId === session.user.id)?.role || "member"}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Nombre de membres</p>
                                    <p className="font-medium">{organization.members?.length || 0}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Agence
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Aucune agence trouvée
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Coming Soon Section */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>À venir</CardTitle>
                        <CardDescription>Fonctionnalités en développement</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center text-muted-foreground">
                                <span className="mr-3">•</span>
                                <span>Gestion des commandes</span>
                            </li>
                            <li className="flex items-center text-muted-foreground">
                                <span className="mr-3">•</span>
                                <span>Suivi des livraisons</span>
                            </li>
                            <li className="flex items-center text-muted-foreground">
                                <span className="mr-3">•</span>
                                <span>Historique des activités</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
