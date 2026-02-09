"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Shield, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

type InvitationData = {
    id: string;
    email: string;
    role: string;
    organizationName: string;
    inviterName: string;
    userExists: boolean;
};

type Step = "loading" | "invitation" | "create-account" | "login" | "done" | "rejected" | "error";

const ROLE_LABELS: Record<string, string> = {
    owner: "Propriétaire",
    admin: "Administrateur",
    member: "Membre",
};

export default function AcceptInvitationPage() {
    const params = useParams();
    const invitationId = params.id as string;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <InvitationFlow invitationId={invitationId} />
        </div>
    );
}

function InvitationFlow({ invitationId }: { invitationId: string }) {
    const router = useRouter();
    const [step, setStep] = useState<Step>("loading");
    const [invitation, setInvitation] = useState<InvitationData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Create account form
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Login form (existing user)
    const [loginPassword, setLoginPassword] = useState("");

    // Fetch invitation details via public API
    useEffect(() => {
        fetch(`/api/invitations/${invitationId}`)
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    setError(data.error || "Invitation introuvable");
                    setStep("error");
                    return;
                }
                setInvitation(data);
                setStep("invitation");
            })
            .catch(() => {
                setError("Impossible de charger l'invitation");
                setStep("error");
            });
    }, [invitationId]);

    async function handleAccept() {
        if (!invitation) return;

        if (invitation.userExists) {
            // Existing user → need to login first, then accept
            setStep("login");
        } else {
            // New user → create account
            setStep("create-account");
        }
    }

    async function handleReject() {
        setIsSubmitting(true);
        try {
            const { error: rejectError } = await authClient.organization.rejectInvitation({
                invitationId,
            });
            if (rejectError) throw rejectError;
            setStep("rejected");
        } catch {
            // If not authenticated, try rejecting via sign-up flow isn't possible.
            // For now, just show rejected state since the user doesn't want to join.
            setStep("rejected");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleCreateAccount(e: React.FormEvent) {
        e.preventDefault();
        if (!invitation) return;

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // 1. Create the account
            const { error: signUpError } = await authClient.signUp.email({
                email: invitation.email,
                password,
                name,
            });
            if (signUpError) throw signUpError;

            // 2. Accept the invitation (now authenticated after sign-up)
            const { error: acceptError } = await authClient.organization.acceptInvitation({
                invitationId,
            });
            if (acceptError) throw acceptError;

            // 3. Upgrade platform role to ADMIN (default is AGENT after sign-up)
            const upgradeRes = await fetch("/api/auth/upgrade-role", {
                method: "POST",
                credentials: "include",
            });
            if (!upgradeRes.ok) {
                console.warn("Role upgrade failed:", await upgradeRes.text());
            }

            setStep("done");
            toast.success("Compte créé et invitation acceptée !");

            // Hard reload to force fresh session in proxy
            setTimeout(() => { window.location.href = "/admin/dashboard"; }, 2000);
        } catch (err: any) {
            const message = err.message || "Une erreur est survenue";
            setError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        if (!invitation) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // 1. Sign in
            const { error: signInError } = await authClient.signIn.email({
                email: invitation.email,
                password: loginPassword,
            });
            if (signInError) throw signInError;

            // 2. Accept the invitation
            const { error: acceptError } = await authClient.organization.acceptInvitation({
                invitationId,
            });
            if (acceptError) throw acceptError;

            // 3. Upgrade platform role to ADMIN if needed
            const upgradeRes = await fetch("/api/auth/upgrade-role", {
                method: "POST",
                credentials: "include",
            });
            if (!upgradeRes.ok) {
                console.warn("Role upgrade failed:", await upgradeRes.text());
            }

            setStep("done");
            toast.success("Invitation acceptée !");

            // Hard reload to force fresh session in proxy
            setTimeout(() => { window.location.href = "/admin/dashboard"; }, 2000);
        } catch (err: any) {
            const message = err.message || "Une erreur est survenue";
            setError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    }

    // ─── Loading ───
    if (step === "loading") {
        return (
            <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // ─── Error State ───
    if (step === "error") {
        return (
            <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                    <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    // ─── Rejected ───
    if (step === "rejected") {
        return (
            <Card className="w-full max-w-md text-center">
                <CardContent className="pt-6 space-y-4">
                    <XCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">
                        Vous avez refusé l&apos;invitation.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // ─── Done ───
    if (step === "done") {
        return (
            <Card className="w-full max-w-md text-center">
                <CardContent className="pt-6 space-y-4">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                    <p className="font-medium">Bienvenue dans {invitation?.organizationName} !</p>
                    <p className="text-sm text-muted-foreground">
                        Redirection vers le tableau de bord...
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (!invitation) return null;

    const roleLabel = ROLE_LABELS[invitation.role] || invitation.role;

    // ─── Step 1: Invitation Card (Accept / Reject) ───
    if (step === "invitation") {
        return (
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Vous avez été invité !</CardTitle>
                    <CardDescription className="text-base">
                        <strong>{invitation.inviterName}</strong> vous invite à rejoindre{" "}
                        <strong>{invitation.organizationName}</strong> en tant que{" "}
                        <span className="inline-flex items-center gap-1">
                            <Shield className="h-4 w-4" />
                            <strong>{roleLabel}</strong>
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border p-3 bg-muted/50">
                        <p className="text-sm text-muted-foreground">Email d&apos;invitation</p>
                        <p className="font-medium">{invitation.email}</p>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleReject}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            "Refuser"
                        )}
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={handleAccept}
                        disabled={isSubmitting}
                    >
                        Accepter
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    // ─── Step 2a: Create Account (new user) ───
    if (step === "create-account") {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Créer votre compte</CardTitle>
                    <CardDescription>
                        Finalisez votre inscription pour rejoindre{" "}
                        <strong>{invitation.organizationName}</strong>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <form onSubmit={handleCreateAccount} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={invitation.email} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom complet</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Votre nom"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Minimum 8 caractères"
                                required
                                minLength={8}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Répétez le mot de passe"
                                required
                                minLength={8}
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setError(null);
                                    setStep("invitation");
                                }}
                            >
                                Retour
                            </Button>
                            <Button type="submit" className="flex-1" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Création...
                                    </>
                                ) : (
                                    "Créer mon compte"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        );
    }

    // ─── Step 2b: Login (existing user) ───
    if (step === "login") {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Connectez-vous</CardTitle>
                    <CardDescription>
                        Un compte existe déjà pour <strong>{invitation.email}</strong>.
                        Connectez-vous pour accepter l&apos;invitation.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={invitation.email} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="loginPassword">Mot de passe</Label>
                            <Input
                                id="loginPassword"
                                type="password"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setError(null);
                                    setStep("invitation");
                                }}
                            >
                                Retour
                            </Button>
                            <Button type="submit" className="flex-1" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Connexion...
                                    </>
                                ) : (
                                    "Se connecter"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        );
    }

    return null;
}
