import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, TrendingUp, Calendar } from "lucide-react";

export default function AdminDashboard() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Vue d&apos;ensemble de votre agence
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Personnel Actif
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">8</div>
                        <p className="text-xs text-muted-foreground">
                            Agents &amp; Livreurs
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Commandes du jour
                        </CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">23</div>
                        <p className="text-xs text-muted-foreground">
                            +5 depuis ce matin
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Créneaux disponibles
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">6</div>
                        <p className="text-xs text-muted-foreground">
                            Sur 10 créneaux aujourd&apos;hui
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Taux de livraison
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">92%</div>
                        <p className="text-xs text-muted-foreground">
                            +3% vs semaine dernière
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
                                <p className="font-medium">Commande livrée</p>
                                <p className="text-muted-foreground">CMD-042 - Mamadou Diop</p>
                            </div>
                            <span className="text-muted-foreground">Il y a 30min</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex h-2 w-2 rounded-full bg-blue-500" />
                            <div className="flex-1">
                                <p className="font-medium">Nouvel agent ajouté</p>
                                <p className="text-muted-foreground">Fatou Sow</p>
                            </div>
                            <span className="text-muted-foreground">Il y a 2h</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex h-2 w-2 rounded-full bg-yellow-500" />
                            <div className="flex-1">
                                <p className="font-medium">Créneau complet</p>
                                <p className="text-muted-foreground">10:00 - 11:00 demain</p>
                            </div>
                            <span className="text-muted-foreground">Il y a 4h</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex h-2 w-2 rounded-full bg-green-500" />
                            <div className="flex-1">
                                <p className="font-medium">Commande acceptée</p>
                                <p className="text-muted-foreground">CMD-041 - Awa Ndiaye</p>
                            </div>
                            <span className="text-muted-foreground">Il y a 6h</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
