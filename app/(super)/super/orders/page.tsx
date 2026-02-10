import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function OrdersPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Commandes</h1>
                <p className="text-muted-foreground">
                    Vue globale de toutes les commandes
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <Input placeholder="Rechercher par numéro, client..." className="max-w-sm" />
                        <Select>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous</SelectItem>
                                <SelectItem value="pending">En attente</SelectItem>
                                <SelectItem value="accepted">Accepté</SelectItem>
                                <SelectItem value="delivered">Livré</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Agence" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toutes</SelectItem>
                                <SelectItem value="plateau">Agence Plateau</SelectItem>
                                <SelectItem value="parcelles">Agence Parcelles</SelectItem>
                                <SelectItem value="almadies">Agence Almadies</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Liste des commandes</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>N° Commande</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Agence</TableHead>
                                <TableHead>Produit</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-mono text-sm">CMD-001</TableCell>
                                <TableCell>Mamadou Diop</TableCell>
                                <TableCell>Plateau</TableCell>
                                <TableCell>Colis Standard</TableCell>
                                <TableCell>15,000 FCFA</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                        Livré
                                    </Badge>
                                </TableCell>
                                <TableCell>08/02/2026</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                        Détails
                                    </Button>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-mono text-sm">CMD-002</TableCell>
                                <TableCell>Aïssatou Ba</TableCell>
                                <TableCell>Parcelles</TableCell>
                                <TableCell>Document</TableCell>
                                <TableCell>5,000 FCFA</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                        En livraison
                                    </Badge>
                                </TableCell>
                                <TableCell>09/02/2026</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                        Détails
                                    </Button>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-mono text-sm">CMD-003</TableCell>
                                <TableCell>Ibrahima Sarr</TableCell>
                                <TableCell>Almadies</TableCell>
                                <TableCell>Colis Express</TableCell>
                                <TableCell>25,000 FCFA</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                        En attente
                                    </Badge>
                                </TableCell>
                                <TableCell>09/02/2026</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                        Détails
                                    </Button>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-mono text-sm">CMD-004</TableCell>
                                <TableCell>Khady Ndiaye</TableCell>
                                <TableCell>Plateau</TableCell>
                                <TableCell>Colis Standard</TableCell>
                                <TableCell>12,000 FCFA</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                        Accepté
                                    </Badge>
                                </TableCell>
                                <TableCell>09/02/2026</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                        Détails
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
