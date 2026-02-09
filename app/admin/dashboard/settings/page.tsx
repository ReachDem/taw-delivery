"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function AdminSettingsPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                <p className="text-muted-foreground">
                    Configuration de votre agence
                </p>
            </div>

            <div className="grid gap-6">
                {/* Agency Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informations de l&apos;agence</CardTitle>
                        <CardDescription>
                            Détails de votre agence
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="agency-name">Nom de l&apos;agence</Label>
                            <Input id="agency-name" defaultValue="Agence Plateau" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="agency-address">Adresse</Label>
                            <Input id="agency-address" defaultValue="12 Rue du Plateau, Dakar" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="agency-phone">Téléphone</Label>
                            <Input
                                id="agency-phone"
                                type="tel"
                                defaultValue="+221 33 123 45 67"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Delivery Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Paramètres de livraison</CardTitle>
                        <CardDescription>
                            Configuration des créneaux et délais
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="slot-duration">Durée des créneaux (heures)</Label>
                            <Input id="slot-duration" type="number" defaultValue="1" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="max-capacity">Capacité maximale par créneau</Label>
                            <Input id="max-capacity" type="number" defaultValue="4" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="proposal-expiry">
                                Expiration des propositions (heures)
                            </Label>
                            <Input id="proposal-expiry" type="number" defaultValue="48" />
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>
                            Configuration des notifications de votre agence
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Notifications SMS</Label>
                                <p className="text-sm text-muted-foreground">
                                    Notifier les clients par SMS
                                </p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Notifications Email</Label>
                                <p className="text-sm text-muted-foreground">
                                    Notifier les clients par email
                                </p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Relances automatiques</Label>
                                <p className="text-sm text-muted-foreground">
                                    Relancer les clients après 24h sans réponse
                                </p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button variant="outline">Annuler</Button>
                    <Button>Enregistrer les modifications</Button>
                </div>
            </div>
        </div>
    );
}
