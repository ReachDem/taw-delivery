"use client";

import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const [activeOrg, setActiveOrg] = useState<any>(null);
    const [memberRole, setMemberRole] = useState<string | null>(null);

    // We check for active organization
    useEffect(() => {
        if (session?.session?.activeOrganizationId) {
            authClient.organization.getFullOrganization().then(({ data }) => {
                if (data) {
                    setActiveOrg(data);
                    // Find the current user's role within the organization
                    const currentMember = data.members?.find(
                        (m: any) => m.userId === session.user.id
                    );
                    if (currentMember) {
                        setMemberRole(currentMember.role);
                    }
                }
            });
        }
    }, [session]);

    const handleSignOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/admin/login");
                },
            },
        });
    };

    if (isPending) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!session) {
        // Should result in unauthorized redirect by middleware, but handled here too.
        router.push("/admin/login");
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-xl">Taw Delivery Admin</span>
                    <Badge variant="outline">
                        {session.user.role === "SUPER_ADMIN"
                            ? "Super Admin"
                            : session.user.role === "ADMIN"
                                ? `Admin${memberRole ? ` (${memberRole})` : ""}`
                                : memberRole || session.user.role || "Member"}
                    </Badge>
                </div>
                <div className="flex items-center gap-4">
                    <span>{session.user.email}</span>
                    <Button variant="outline" onClick={handleSignOut}>
                        Se déconnecter
                    </Button>
                </div>
            </header>

            <main className="flex-1 p-8 grid gap-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Organisation Active</CardTitle>
                            <CardDescription>
                                Gérée via Better-Auth Organization Plugin
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {activeOrg ? (
                                <div className="space-y-2">
                                    <div className="text-2xl font-bold">{activeOrg.name}</div>
                                    <div className="text-sm text-muted-foreground">{activeOrg.slug}</div>
                                    {session.user.role === "SUPER_ADMIN" && (
                                        <div className="mt-4 pt-4 border-t">
                                            <Link href="/super/staff" className="text-primary hover:underline">
                                                Gérer le personnel (Super Admin) &rarr;
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-muted-foreground">
                                    Aucune organisation active sélectionnée.
                                    <div className="mt-2 text-sm italic">
                                        (Utilisez le sélecteur d'organisation si disponible)
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Actions Rapides</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {session.user.role === "SUPER_ADMIN" && (
                                <Link href="/super/staff">
                                    <Button variant="ghost" className="w-full justify-start">
                                        Gérer tout le personnel
                                    </Button>
                                </Link>
                            )}
                            {(session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN") && (
                                <>
                                    <Button variant="ghost" className="w-full justify-start" disabled>
                                        Inviter un agent / livreur
                                    </Button>
                                    <Button variant="ghost" className="w-full justify-start" disabled>
                                        Gérer les commandes
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
