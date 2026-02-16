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
import { authClient, useSession } from "@/lib/auth-client";

export default function AdminStaffPage() {
  useSession();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

  // Form data — admin can only invite agents or drivers within their own agency
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Get the full organization to list members
      const { data: org } = await authClient.organization.getFullOrganization();
      console.log("Fetched Organization:", org);
      if (org) {
        // Filter out super admins — they belong to all agencies by default
        const filteredMembers = (org.members || []).filter(
          (m: any) => m.user?.role !== "SUPER_ADMIN",
        );
        setMembers(filteredMembers);
        setInvitations(org.invitations || []);
        // Save current organization ID for invitations
        setCurrentOrgId(org.id);
      } else {
        // Fallback: List organizations and use the first one if available
        const { data: orgs } = await authClient.organization.list();
        console.log("Fallback Organizations List:", orgs);
        if (orgs && orgs.length > 0) {
          const firstOrgId = orgs[0].id;
          setCurrentOrgId(firstOrgId);
          // Set it as active then re-fetch members
          await authClient.organization.setActive({
            organizationId: firstOrgId,
          });
          const { data: org } = await authClient.organization.getFullOrganization();
          if (org) {
            const filteredMembers = (org.members || []).filter(
              (m: any) => m.user?.role !== "SUPER_ADMIN",
            );
            setMembers(filteredMembers);
            setInvitations(org.invitations || []);
          }
        }
      }
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
    if (!email) {
      toast.error("Veuillez saisir un email");
      return;
    }

    if (!currentOrgId) {
      toast.error("Impossible de déterminer l'organisation active");
      return;
    }

    setIsSubmitting(true);
    try {
      const { inviteStaffMember } = await import("@/app/actions/staff");
      await inviteStaffMember({
        email,
        role: role as "member" | "admin",
        organizationId: currentOrgId,
      });
      toast.success("Invitation envoyée avec succès");
      setIsInviteDialogOpen(false);
      setEmail("");
      setRole("member");
      fetchData();
    } catch (error: any) {
      console.error("Invitation error:", error);
      toast.error(error.message || "Erreur lors de l'envoi de l'invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Voulez-vous vraiment révoquer cette invitation ?")) return;

    try {
      await authClient.organization.cancelInvitation({ invitationId: id });
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
          <h1 className="text-3xl font-bold tracking-tight">Personnel</h1>
          <p className="text-muted-foreground">
            Gérer les agents et livreurs de votre agence
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={isLoading}
          >
            <RefreshCcw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
          <Dialog
            open={isInviteDialogOpen}
            onOpenChange={setIsInviteDialogOpen}
          >
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
                  Envoyez une invitation par email pour rejoindre votre agence
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
                      <SelectItem value="member">Agent</SelectItem>
                      <SelectItem value="admin">Livreur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsInviteDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button onClick={handleInvite} disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Envoyer l&apos;invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Membres de l&apos;agence</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columns={5} rows={4} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Ajouté le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      Aucun membre trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member: any) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.user?.name || "—"}
                      </TableCell>
                      <TableCell>{member.user?.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{member.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(member.createdAt).toLocaleDateString("fr-FR")}
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

      {/* Pending Invitations */}
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
                <TableHead>Envoyée le</TableHead>
                <TableHead>Expire le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    Aucune invitation en attente
                  </TableCell>
                </TableRow>
              ) : (
                invitations
                  .filter((inv: any) => inv.status === "pending")
                  .map((invitation: any) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">
                        {invitation.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{invitation.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(invitation.createdAt).toLocaleDateString(
                          "fr-FR",
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(invitation.expiresAt).toLocaleDateString(
                          "fr-FR",
                        )}
                      </TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}
