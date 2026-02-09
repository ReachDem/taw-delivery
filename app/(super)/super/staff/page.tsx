"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function StaffPage() {
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Staff</h1>
                    <p className="text-muted-foreground">
                        Gérer les administrateurs et le personnel
                    </p>
                </div>
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Inviter un administrateur
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Inviter un administrateur</DialogTitle>
                            <DialogDescription>
                                Envoyez une invitation par email pour créer un compte administrateur
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@example.com"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role">Rôle</Label>
                                <Select defaultValue="ADMIN">
                                    <SelectTrigger id="role">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ADMIN">Administrateur d'Agence</SelectItem>
                                        <SelectItem value="SUPER_ADMIN">Super Administrateur</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="agency">Agence (optionnel)</Label>
                                <Select>
                                    <SelectTrigger id="agency">
                                        <SelectValue placeholder="Sélectionner une agence" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="plateau">Agence Plateau</SelectItem>
                                        <SelectItem value="parcelles">Agence Parcelles</SelectItem>
                                        <SelectItem value="almadies">Agence Almadies</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                                Annuler
                            </Button>
                            <Button onClick={() => setIsInviteDialogOpen(false)}>
                                Envoyer l'invitation
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Administrateurs</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Agence</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">Amadou Diallo</TableCell>
                                <TableCell>amadou@taw.sn</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">Admin</Badge>
                                </TableCell>
                                <TableCell>Agence Plateau</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                        Actif
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                        Modifier
                                    </Button>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Fatou Sall</TableCell>
                                <TableCell>fatou@taw.sn</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">Admin</Badge>
                                </TableCell>
                                <TableCell>Agence Parcelles</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                        Actif
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                        Modifier
                                    </Button>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Moussa Ndiaye</TableCell>
                                <TableCell>moussa@taw.sn</TableCell>
                                <TableCell>
                                    <Badge>Super Admin</Badge>
                                </TableCell>
                                <TableCell>—</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                        Actif
                                    </Badge>
                                </TableCell>
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

            <Card>
                <CardHeader>
                    <CardTitle>Invitations en attente</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Agence</TableHead>
                                <TableHead>Envoyée le</TableHead>
                                <TableHead>Expire le</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">nouvel.admin@taw.sn</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">Admin</Badge>
                                </TableCell>
                                <TableCell>Agence Almadies</TableCell>
                                <TableCell>08/02/2026</TableCell>
                                <TableCell>15/02/2026</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                        Révoquer
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
