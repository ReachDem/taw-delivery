"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
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
import { useAgencies, useCreateAgency, useUpdateAgency } from "@/lib/hooks/use-agencies";
import { toast } from "sonner";
import type { Agency } from "@/lib/hooks/use-agencies";

export default function AgenciesPage() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        city: "",
        phone: "",
    });

    // Fetch agencies
    const { data, isLoading, error } = useAgencies();

    // Mutations
    const createMutation = useCreateAgency();
    const updateMutation = useUpdateAgency();

    const handleCreate = async () => {
        try {
            await createMutation.mutateAsync(formData);
            toast.success("Agence créée avec succès");
            setIsCreateDialogOpen(false);
            setFormData({ name: "", address: "", city: "", phone: "" });
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la création");
        }
    };

    const handleEdit = (agency: Agency) => {
        setEditingAgency(agency);
        setFormData({
            name: agency.name,
            address: agency.address,
            city: agency.city,
            phone: agency.phone || "",
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingAgency) return;

        try {
            await updateMutation.mutateAsync({
                id: editingAgency.id,
                data: formData,
            });
            toast.success("Agence modifiée avec succès");
            setIsEditDialogOpen(false);
            setEditingAgency(null);
            setFormData({ name: "", address: "", city: "", phone: "" });
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la modification");
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Agences</h1>
                    <p className="text-muted-foreground">
                        Gérer toutes les agences de la plateforme
                    </p>
                </div>

                {/* Create Dialog */}
                <Dialog open={isCreateDialogOpen} onOpenChange={(isOpen) => {
                    setIsCreateDialogOpen(isOpen);
                    if (isOpen) {
                        setFormData({ name: "", address: "", city: "", phone: "" });
                    }
                }}>
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
                                <Label htmlFor="create-name">Nom de l'agence</Label>
                                <Input
                                    id="create-name"
                                    placeholder="Agence Dakar Centre"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="create-address">Adresse</Label>
                                <Input
                                    id="create-address"
                                    placeholder="123 Rue de la République"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="create-city">Ville</Label>
                                <Input
                                    id="create-city"
                                    placeholder="Dakar"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="create-phone">Téléphone</Label>
                                <Input
                                    id="create-phone"
                                    placeholder="+221 33 123 45 67"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                Annuler
                            </Button>
                            <Button onClick={handleCreate} disabled={createMutation.isPending}>
                                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Créer
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Modifier l'agence</DialogTitle>
                            <DialogDescription>
                                Modifiez les informations de l'agence
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Nom de l'agence</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-address">Adresse</Label>
                                <Input
                                    id="edit-address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-city">Ville</Label>
                                <Input
                                    id="edit-city"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-phone">Téléphone</Label>
                                <Input
                                    id="edit-phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Annuler
                            </Button>
                            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Modifier
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
                    {isLoading ? (
                        <TableSkeleton columns={7} rows={4} />
                    ) : error ? (
                        <div className="flex items-center justify-center py-8 text-destructive">
                            Erreur lors du chargement des agences
                        </div>
                    ) : !data?.agencies || data.agencies.length === 0 ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            Aucune agence trouvée
                        </div>
                    ) : (
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
                                {data.agencies.map((agency) => (
                                    <TableRow key={agency.id}>
                                        <TableCell className="font-medium">{agency.name}</TableCell>
                                        <TableCell>{agency.city}</TableCell>
                                        <TableCell>{agency.address}</TableCell>
                                        <TableCell>{agency.phone || "-"}</TableCell>
                                        <TableCell>{agency._count?.agents || 0}</TableCell>
                                        <TableCell>{agency._count?.drivers || 0}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(agency)}
                                            >
                                                Modifier
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
