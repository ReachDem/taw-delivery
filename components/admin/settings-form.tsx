"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save, RotateCcw } from "lucide-react";

interface AgencySettingsData {
    agencyId: string;
    tariffLabel1: string;
    tariffAmount1: number;
    tariffLabel2: string;
    tariffAmount2: number;
    tariffLabel3: string;
    tariffAmount3: number;
    currency: string;
    slotStartHour: number;
    slotEndHour: number;
    slotMaxCapacity: number;
    proposalExpiryHours: number;
}

const CURRENCIES = ["FCFA", "XAF", "EUR", "USD"];

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6h-21h

export default function AdminSettingsForm() {
    const [settings, setSettings] = useState<AgencySettingsData | null>(null);
    const [original, setOriginal] = useState<AgencySettingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch("/api/agency-settings");
            const json = await res.json();
            if (json.success) {
                setSettings(json.data);
                setOriginal(json.data);
            } else {
                toast.error("Impossible de charger les paramètres");
            }
        } catch {
            toast.error("Erreur de connexion");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);

        try {
            const res = await fetch("/api/agency-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tariffLabel1: settings.tariffLabel1,
                    tariffAmount1: settings.tariffAmount1,
                    tariffLabel2: settings.tariffLabel2,
                    tariffAmount2: settings.tariffAmount2,
                    tariffLabel3: settings.tariffLabel3,
                    tariffAmount3: settings.tariffAmount3,
                    currency: settings.currency,
                    slotStartHour: settings.slotStartHour,
                    slotEndHour: settings.slotEndHour,
                    slotMaxCapacity: settings.slotMaxCapacity,
                    proposalExpiryHours: settings.proposalExpiryHours,
                }),
            });

            const json = await res.json();
            if (json.success) {
                setSettings(json.data);
                setOriginal(json.data);
                toast.success("Paramètres enregistrés");
            } else {
                toast.error(json.error || "Erreur lors de la sauvegarde");
            }
        } catch {
            toast.error("Erreur de connexion");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (original) {
            setSettings({ ...original });
        }
    };

    const update = (field: keyof AgencySettingsData, value: string | number) => {
        if (!settings) return;
        setSettings({ ...settings, [field]: value });
    };

    const hasChanges =
        settings && original && JSON.stringify(settings) !== JSON.stringify(original);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <p className="text-muted-foreground">Impossible de charger les paramètres</p>
                <Button variant="outline" onClick={fetchSettings}>
                    Réessayer
                </Button>
            </div>
        );
    }

    return (
        <div className="grid gap-6">
            {/* Tariffs */}
            <Card>
                <CardHeader>
                    <CardTitle>Tarification</CardTitle>
                    <CardDescription>
                        Configurez vos 3 niveaux de tarifs de livraison
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Currency */}
                    <div className="grid gap-2 max-w-[200px]">
                        <Label>Devise</Label>
                        <Select
                            value={settings.currency}
                            onValueChange={(v) => update("currency", v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CURRENCIES.map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 3 Tariff levels */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        {([1, 2, 3] as const).map((level) => {
                            const labelKey = `tariffLabel${level}` as keyof AgencySettingsData;
                            const amountKey = `tariffAmount${level}` as keyof AgencySettingsData;
                            return (
                                <div
                                    key={level}
                                    className="rounded-md border p-4 space-y-3"
                                >
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Niveau {level}
                                    </p>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor={`tariff-label-${level}`}>
                                            Libellé
                                        </Label>
                                        <Input
                                            id={`tariff-label-${level}`}
                                            value={settings[labelKey] as string}
                                            onChange={(e) =>
                                                update(labelKey, e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor={`tariff-amount-${level}`}>
                                            Montant ({settings.currency})
                                        </Label>
                                        <Input
                                            id={`tariff-amount-${level}`}
                                            type="number"
                                            min={0}
                                            value={settings[amountKey] as number}
                                            onChange={(e) =>
                                                update(
                                                    amountKey,
                                                    parseFloat(e.target.value) || 0
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Slot Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Créneaux de livraison</CardTitle>
                    <CardDescription>
                        Définissez les horaires et la capacité des créneaux
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="slot-start">Heure de début</Label>
                            <Select
                                value={String(settings.slotStartHour)}
                                onValueChange={(v) =>
                                    update("slotStartHour", parseInt(v))
                                }
                            >
                                <SelectTrigger id="slot-start">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {HOURS.filter(
                                        (h) => h < settings.slotEndHour
                                    ).map((h) => (
                                        <SelectItem key={h} value={String(h)}>
                                            {String(h).padStart(2, "0")}:00
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slot-end">Heure de fin</Label>
                            <Select
                                value={String(settings.slotEndHour)}
                                onValueChange={(v) =>
                                    update("slotEndHour", parseInt(v))
                                }
                            >
                                <SelectTrigger id="slot-end">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {HOURS.filter(
                                        (h) => h > settings.slotStartHour
                                    ).map((h) => (
                                        <SelectItem key={h} value={String(h)}>
                                            {String(h).padStart(2, "0")}:00
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-2 max-w-[200px]">
                        <Label htmlFor="slot-capacity">
                            Capacité par créneau
                        </Label>
                        <Select
                            value={String(settings.slotMaxCapacity)}
                            onValueChange={(v) =>
                                update("slotMaxCapacity", parseInt(v))
                            }
                        >
                            <SelectTrigger id="slot-capacity">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[3, 4, 5, 6].map((n) => (
                                    <SelectItem key={n} value={String(n)}>
                                        {n} livraisons
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Proposal Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Propositions</CardTitle>
                    <CardDescription>
                        Paramètres relatifs aux propositions de livraison
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2 max-w-[200px]">
                        <Label htmlFor="proposal-expiry">
                            Expiration (heures)
                        </Label>
                        <Input
                            id="proposal-expiry"
                            type="number"
                            min={1}
                            max={168}
                            value={settings.proposalExpiryHours}
                            onChange={(e) =>
                                update(
                                    "proposalExpiryHours",
                                    parseInt(e.target.value) || 48
                                )
                            }
                        />
                        <p className="text-xs text-muted-foreground">
                            Durée avant expiration automatique d&apos;une proposition non confirmée
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={!hasChanges || saving}
                >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Annuler
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                >
                    {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Enregistrer
                </Button>
            </div>
        </div>
    );
}
