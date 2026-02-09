"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AgenciesPage() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Agences</h1>
                    <p className="text-muted-foreground">
                        Gérer toutes les agences de la plateforme
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Créer une agence
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Créer une nouvelle agence</DialogTitle>
                            <DialogDescription>
                                Remplissez les informations de la nouvelle agence
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nom de l'agence</Label>
                                <Input id="name" placeholder="Agence Dakar Centre" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Adresse</Label>
                                <Input id="address" placeholder="123 Rue de la République" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="city">Ville</Label>
                                <Input id="city" placeholder="Dakar" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Téléphone</Label>
                                <Input id="phone" placeholder="+221 33 123 45 67" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                Annuler
                            </Button>
                            <Button onClick={() => setIsCreateDialogOpen(false)}>
                                Créer
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Liste des agences</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Ville</TableHead>
                                <TableHead>Adresse</TableHead>
                                <TableHead>Téléphone</TableHead>
                                <TableHead>Agents</TableHead>
                                <TableHead>Livreurs</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">Agence Plateau</TableCell>
                                <TableCell>Dakar</TableCell>
                                <TableCell>Avenue Léopold Sédar Senghor</TableCell>
                                <TableCell>+221 33 123 45 67</TableCell>
                                <TableCell>8</TableCell>
                                <TableCell>5</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                        Modifier
                                    </Button>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Agence Parcelles</TableCell>
                                <TableCell>Dakar</TableCell>
                                <TableCell>Rue 10, Parcelles Assainies</TableCell>
                                <TableCell>+221 33 234 56 78</TableCell>
                                <TableCell>6</TableCell>
                                <TableCell>4</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                        Modifier
                                    </Button>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Agence Almadies</TableCell>
                                <TableCell>Dakar</TableCell>
                                <TableCell>Route des Almadies</TableCell>
                                <TableCell>+221 33 345 67 89</TableCell>
                                <TableCell>5</TableCell>
                                <TableCell>3</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                        Modifier
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
