"use client";

import { useEffect, useState } from "react";
import { UserPlus, Loader2, RefreshCcw } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getStaffMembers, getPendingInvitations, getAgencies, inviteStaffMember, revokeInvitation } from "@/app/actions/staff";

interface Member {
    id: string;
    role: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    organization: {
        id: string;
        name: string;
    };
}

interface Invitation {
    id: string;
    createdAt: string;
    expiresAt: string;
    email: string;
    role: string;
    status: string;
    organization: {
        id: string;
        name: string;
    };
}

interface Agency {
    id: string;
    name: string;
    organizationId: string | null;
}

export default function StaffPage() {
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [members, setMembers] = useState<Member[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [agencies, setAgencies] = useState<Agency[]>([]);

    // Form data
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("admin");
    const [organizationId, setOrganizationId] = useState("");

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [membersData, invitationsData, agenciesData] = await Promise.all([
                getStaffMembers(),
                getPendingInvitations(),
                getAgencies()
            ]);

            // Combine members and super admins for display?
            // For now just show organization members
            setMembers(membersData.members);
            setInvitations(invitationsData);
            setAgencies(agenciesData);
        } catch (error) {
            toast.error("Erreur lors du chargement des données");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInvite = async () => {
        if (!email || !organizationId) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        setIsSubmitting(true);
        try {
            await inviteStaffMember({
                email,
                role,
                organizationId
            });
            toast.success("Invitation envoyée avec succès");
            setIsInviteDialogOpen(false);
            setEmail("");
            fetchData(); // Refresh list
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'envoi de l'invitation");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRevoke = async (id: string) => {
        if (!confirm("Voulez-vous vraiment révoquer cette invitation ?")) return;

        try {
            await revokeInvitation(id);
            toast.success("Invitation révoquée");
            fetchData();
        } catch (error) {
            toast.error("Erreur lors de la révocation");
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Staff</h1>
                    <p className="text-muted-foreground">
                        Gérer les administrateurs et le personnel
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading}>
                        <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Inviter un membre
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Inviter un membre</DialogTitle>
                                <DialogDescription>
                                    Envoyez une invitation par email pour rejoindre une organisation
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="nom@exemple.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="role">Rôle</Label>
                                    <Select value={role} onValueChange={setRole}>
                                        <SelectTrigger id="role">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Administrateur d&apos;agence</SelectItem>
                                            <SelectItem value="member">Agent / Membre</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="agency">Agence / Organisation</Label>
                                    <Select value={organizationId} onValueChange={setOrganizationId}>
                                        <SelectTrigger id="agency">
                                            <SelectValue placeholder="Sélectionner une agence" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {agencies.filter(agency => agency.organizationId).map((agency) => (
                                                <SelectItem key={agency.id} value={agency.organizationId!}>
                                                    {agency.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                                    Annuler
                                </Button>
                                <Button onClick={handleInvite} disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Envoyer l'invitation
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Membres des Organisations</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <TableSkeleton columns={6} rows={4} />
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Organisation</TableHead>
                                <TableHead>Ajouté le</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        Aucun membre trouvé
                                    </TableCell>
                                </TableRow>
                            ) : (
                                members.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-medium">{member.user.name}</TableCell>
                                        <TableCell>{member.user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{member.role}</Badge>
                                        </TableCell>
                                        <TableCell>{member.organization.name}</TableCell>
                                        <TableCell>
                                            {new Date(member.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">
                                                Modifier
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Invitations en attente</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <TableSkeleton columns={6} rows={3} />
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Organisation</TableHead>
                                <TableHead>Envoyée le</TableHead>
                                <TableHead>Expire le</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invitations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        Aucune invitation en attente
                                    </TableCell>
                                </TableRow>
                            ) : (
                                invitations.map((invitation) => (
                                    <TableRow key={invitation.id}>
                                        <TableCell className="font-medium">{invitation.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{invitation.role}</Badge>
                                        </TableCell>
                                        <TableCell>{invitation.organization.name}</TableCell>
                                        <TableCell>{new Date(invitation.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>{new Date(invitation.expiresAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRevoke(invitation.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                Révoquer
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
