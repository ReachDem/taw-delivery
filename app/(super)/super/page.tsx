import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Package, TrendingUp } from "lucide-react";

export default function SuperAdminDashboard() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Vue d'ensemble de la plateforme TGVAIRWABO
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Agences
                        </CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">
                            +2 ce mois
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Personnel Actif
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">48</div>
                        <p className="text-xs text-muted-foreground">
                            Agents & Livreurs
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Commandes Totales
                        </CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,234</div>
                        <p className="text-xs text-muted-foreground">
                            +180 cette semaine
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Taux d'Acceptation
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">87%</div>
                        <p className="text-xs text-muted-foreground">
                            +5% vs mois dernier
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Activité Récente</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex h-2 w-2 rounded-full bg-green-500" />
                            <div className="flex-1">
                                <p className="font-medium">Nouvelle agence créée</p>
                                <p className="text-muted-foreground">Agence Dakar Centre</p>
                            </div>
                            <span className="text-muted-foreground">Il y a 2h</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex h-2 w-2 rounded-full bg-blue-500" />
                            <div className="flex-1">
                                <p className="font-medium">Nouvel administrateur invité</p>
                                <p className="text-muted-foreground">admin@example.com</p>
                            </div>
                            <span className="text-muted-foreground">Il y a 5h</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex h-2 w-2 rounded-full bg-yellow-500" />
                            <div className="flex-1">
                                <p className="font-medium">Pic de commandes détecté</p>
                                <p className="text-muted-foreground">Agence Plateau</p>
                            </div>
                            <span className="text-muted-foreground">Il y a 1j</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
