import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                <p className="text-muted-foreground">
                    Configuration globale de la plateforme
                </p>
            </div>

            <div className="grid gap-6">
                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Paramètres généraux</CardTitle>
                        <CardDescription>
                            Configuration de base de la plateforme
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="platform-name">Nom de la plateforme</Label>
                            <Input id="platform-name" defaultValue="TGVAIRWABO" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="support-email">Email de support</Label>
                            <Input
                                id="support-email"
                                type="email"
                                defaultValue="support@taw.sn"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="support-phone">Téléphone de support</Label>
                            <Input
                                id="support-phone"
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

                {/* Messaging Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Paramètres de messagerie</CardTitle>
                        <CardDescription>
                            Configuration SMS et Email
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Notifications SMS</Label>
                                <p className="text-sm text-muted-foreground">
                                    Activer l'envoi de SMS aux clients
                                </p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Notifications Email</Label>
                                <p className="text-sm text-muted-foreground">
                                    Activer l'envoi d'emails aux clients
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

                {/* Security Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sécurité</CardTitle>
                        <CardDescription>
                            Paramètres de sécurité et authentification
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="session-duration">
                                Durée de session (minutes)
                            </Label>
                            <Input id="session-duration" type="number" defaultValue="60" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Authentification à deux facteurs</Label>
                                <p className="text-sm text-muted-foreground">
                                    Exiger 2FA pour les super admins
                                </p>
                            </div>
                            <Switch />
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
