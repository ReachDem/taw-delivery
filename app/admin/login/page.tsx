"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const searchParams = useSearchParams();
    const created = searchParams.get("created");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await authClient.signIn.email({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            // Redirect based on user role
            const role = (data?.user as any)?.role;
            let redirectTo = "/admin/dashboard";
            if (role === "SUPER_ADMIN") {
                redirectTo = "/super";
            } else if (role === "ADMIN") {
                redirectTo = "/admin/dashboard";
            } else if (role === "AGENT") {
                redirectTo = "/admin/dashboard"; // Future: "/dashboard"
            } else if (role === "DRIVER") {
                redirectTo = "/admin/dashboard"; // Future: "/dlv"
            }

            // Upgrade role if user is member of an org but still has AGENT role
            if (role === "AGENT") {
                await fetch("/api/auth/upgrade-role", {
                    method: "POST",
                    credentials: "include",
                });
                redirectTo = "/admin/dashboard";
            }

            // Hard reload to ensure proxy sees fresh session
            window.location.href = redirectTo;
            toast.success("Connexion réussie");

        } catch (err: any) {
            setError(err.message || "Email ou mot de passe incorrect");
            toast.error("Erreur de connexion");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Administration</CardTitle>
                    <CardDescription className="text-center">
                        Connectez-vous pour accéder à votre espace
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {created && (
                        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                            <AlertDescription>
                                Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.
                            </AlertDescription>
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nom@exemple.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Mot de passe</Label>
                                <Link
                                    href="/admin/forgot-password"
                                    className="text-sm text-primary hover:underline"
                                >
                                    Mot de passe oublié ?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connexion...
                                </>
                            ) : (
                                "Se connecter"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="text-center text-sm text-muted-foreground justify-center">
                    TGVAIRWABO Admin
                </CardFooter>
            </Card>
        </div>
    );
}
