"use client";

import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { signIn, signOut, useSession } from "@/lib/auth-client";

// ============================================
// Types
// ============================================

interface ApiResult {
    status: number;
    statusText: string;
    data: any;
    duration: number;
    timestamp: Date;
}

interface ApiEndpoint {
    name: string;
    method: "GET" | "POST" | "PATCH" | "DELETE";
    path: string;
    description: string;
    body?: Record<string, any>;
    requiresAuth?: boolean;
}

// ============================================
// API Endpoints Configuration
// ============================================

const API_ENDPOINTS: Record<string, ApiEndpoint[]> = {
    agencies: [
        { name: "List Agencies", method: "GET", path: "/api/agencies", description: "Liste toutes les agences", requiresAuth: true },
        { name: "Create Agency", method: "POST", path: "/api/agencies", description: "Créer une nouvelle agence", requiresAuth: true, body: { name: "Test Agency", city: "Dakar", address: "123 Rue", phone: "+221771234567" } },
        { name: "Get Agency", method: "GET", path: "/api/agencies/{id}", description: "Détails d'une agence", requiresAuth: true },
        { name: "Update Agency", method: "PATCH", path: "/api/agencies/{id}", description: "Modifier une agence", requiresAuth: true, body: { name: "Updated Agency" } },
        { name: "Delete Agency", method: "DELETE", path: "/api/agencies/{id}", description: "Supprimer une agence", requiresAuth: true },
    ],
    clients: [
        { name: "List Clients", method: "GET", path: "/api/clients", description: "Liste tous les clients", requiresAuth: true },
        { name: "Create/Find Client", method: "POST", path: "/api/clients", description: "Créer ou trouver un client par téléphone", requiresAuth: true, body: { firstName: "Marie", lastName: "Diallo", phone: "+221779876543" } },
        { name: "Get Client", method: "GET", path: "/api/clients/{id}", description: "Détails d'un client", requiresAuth: true },
        { name: "Update Client", method: "PATCH", path: "/api/clients/{id}", description: "Modifier un client", requiresAuth: true, body: { preferredLanguage: "wo" } },
    ],
    orders: [
        { name: "List Orders", method: "GET", path: "/api/orders", description: "Liste toutes les commandes", requiresAuth: true },
        { name: "Create Order", method: "POST", path: "/api/orders", description: "Créer une commande", requiresAuth: true, body: { clientId: "", agencyId: "", productDescription: "Test Product", amount: 15000 } },
        { name: "Get Order", method: "GET", path: "/api/orders/{id}", description: "Détails d'une commande", requiresAuth: true },
        { name: "Update Order", method: "PATCH", path: "/api/orders/{id}", description: "Modifier/Assigner livreur", requiresAuth: true, body: { status: "SCHEDULED" } },
    ],
    proposals: [
        { name: "List Proposals", method: "GET", path: "/api/proposals", description: "Liste toutes les propositions", requiresAuth: true },
        { name: "Create Proposal", method: "POST", path: "/api/proposals", description: "Créer une proposition", requiresAuth: true, body: { orderId: "", expiresInHours: 48 } },
        { name: "Get Proposal (Public)", method: "GET", path: "/api/p/{token}", description: "Voir proposition publique", requiresAuth: false },
        { name: "Decide Proposal", method: "POST", path: "/api/p/{token}/decide", description: "Accepter/Refuser", requiresAuth: false, body: { decision: "ACCEPTED", deliveryAddress: "123 Rue", paymentChoice: "PAY_ON_DELIVERY" } },
    ],
    slots: [
        { name: "List Slots", method: "GET", path: "/api/agencies/{id}/slots", description: "Créneaux d'une agence", requiresAuth: false },
        { name: "Generate Slots", method: "POST", path: "/api/agencies/{id}/slots", description: "Générer des créneaux", requiresAuth: true, body: { startDate: new Date().toISOString().split("T")[0], endDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0], startHour: 9, endHour: 17, maxCapacity: 4 } },
    ],
    bookings: [
        { name: "Create Booking", method: "POST", path: "/api/bookings", description: "Réserver un créneau", requiresAuth: false, body: { proposalId: "", slotId: "" } },
    ],
    invitations: [
        { name: "List Invitations", method: "GET", path: "/api/invitations", description: "Liste les invitations", requiresAuth: true },
        { name: "Create Invitation", method: "POST", path: "/api/invitations", description: "Inviter un utilisateur", requiresAuth: true, body: { email: "test@example.com", role: "AGENT" } },
    ],
};

// ============================================
// Main Component
// ============================================

export default function ApiTestPage() {
    const [results, setResults] = useState<ApiResult[]>([]);
    const [loading, setLoading] = useState<string | null>(null);
    const [customBody, setCustomBody] = useState<string>("");
    const [pathParams, setPathParams] = useState<Record<string, string>>({});
    const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);

    // Auth state
    const { data: session, isPending: isSessionLoading } = useSession();
    const [email, setEmail] = useState("testadmin@taw-delivery.com");
    const [password, setPassword] = useState("testpassword");
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    // Handle login
    const handleLogin = async () => {
        setAuthLoading(true);
        setAuthError(null);
        try {
            const result = await signIn.email({
                email,
                password,
            });
            if (result.error) {
                setAuthError(result.error.message || "Erreur de connexion");
            }
        } catch (error: any) {
            setAuthError(error.message || "Erreur de connexion");
        } finally {
            setAuthLoading(false);
        }
    };

    // Handle logout
    const handleLogout = async () => {
        setAuthLoading(true);
        try {
            await signOut();
        } finally {
            setAuthLoading(false);
        }
    };

    // Execute API call
    const executeApi = useCallback(async (endpoint: ApiEndpoint) => {
        setLoading(endpoint.name);
        const start = Date.now();

        try {
            // Replace path parameters
            let path = endpoint.path;
            Object.entries(pathParams).forEach(([key, value]) => {
                path = path.replace(`{${key}}`, value);
            });

            // Parse body
            let body: any = null;
            if (endpoint.method !== "GET" && endpoint.method !== "DELETE") {
                try {
                    body = customBody ? JSON.parse(customBody) : endpoint.body;
                } catch {
                    body = endpoint.body;
                }
            }

            const response = await fetch(path, {
                method: endpoint.method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: body ? JSON.stringify(body) : undefined,
            });

            const data = await response.json().catch(() => ({}));
            const duration = Date.now() - start;

            const result: ApiResult = {
                status: response.status,
                statusText: response.statusText,
                data,
                duration,
                timestamp: new Date(),
            };

            setResults((prev) => [result, ...prev.slice(0, 19)]);
        } catch (error: any) {
            setResults((prev) => [
                {
                    status: 0,
                    statusText: "Network Error",
                    data: { error: error.message },
                    duration: Date.now() - start,
                    timestamp: new Date(),
                },
                ...prev.slice(0, 19),
            ]);
        } finally {
            setLoading(null);
        }
    }, [customBody, pathParams]);

    // Select endpoint
    const handleSelectEndpoint = (endpoint: ApiEndpoint) => {
        setSelectedEndpoint(endpoint);
        setCustomBody(endpoint.body ? JSON.stringify(endpoint.body, null, 2) : "");

        // Extract path params
        const params: Record<string, string> = {};
        const matches = endpoint.path.match(/\{(\w+)\}/g);
        matches?.forEach((match) => {
            const key = match.slice(1, -1);
            params[key] = pathParams[key] || "";
        });
        setPathParams(params);
    };

    // Get status color
    const getStatusColor = (status: number) => {
        if (status >= 200 && status < 300) return "bg-emerald-500";
        if (status >= 400 && status < 500) return "bg-amber-500";
        if (status >= 500) return "bg-red-500";
        return "bg-gray-500";
    };

    const getStatusBadge = (status: number) => {
        if (status >= 200 && status < 300) return "default";
        if (status >= 400 && status < 500) return "secondary";
        return "destructive";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                            API Testing Console
                        </h1>
                        <p className="text-slate-400 mt-1">Test les APIs TAW-Delivery en temps réel</p>
                    </div>
                    <Button variant="outline" onClick={() => setResults([])}>
                        Clear History
                    </Button>
                </div>

                {/* Auth Section */}
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-white text-lg">🔐 Authentification</CardTitle>
                            {session?.user ? (
                                <Badge variant="default" className="bg-emerald-500">
                                    ✓ Connecté: {session.user.email}
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-amber-500/50">
                                    Non connecté
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="py-3">
                        {isSessionLoading ? (
                            <div className="text-slate-400 text-sm">Chargement...</div>
                        ) : session?.user ? (
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-slate-300">
                                    <span className="text-slate-400">Role:</span>{" "}
                                    <Badge variant="outline" className="ml-1">{(session.user as any).role || "N/A"}</Badge>
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleLogout}
                                    disabled={authLoading}
                                >
                                    {authLoading ? "Déconnexion..." : "Se déconnecter"}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-end gap-4">
                                <div className="space-y-1">
                                    <Label className="text-slate-300 text-xs">Email</Label>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="testadmin@taw-delivery.com"
                                        className="bg-slate-700 border-slate-600 text-white w-60"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-slate-300 text-xs">Password</Label>
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="testpassword"
                                        className="bg-slate-700 border-slate-600 text-white w-40"
                                    />
                                </div>
                                <Button
                                    onClick={handleLogin}
                                    disabled={authLoading}
                                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                                >
                                    {authLoading ? "Connexion..." : "Se connecter"}
                                </Button>
                                {authError && (
                                    <span className="text-red-400 text-sm">{authError}</span>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Endpoints */}
                    <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white">Endpoints</CardTitle>
                            <CardDescription>Sélectionne une API à tester</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="agencies" className="w-full">
                                <TabsList className="grid grid-cols-4 gap-1 bg-slate-700/50 w-full">
                                    <TabsTrigger value="agencies" className="text-xs">Agencies</TabsTrigger>
                                    <TabsTrigger value="clients" className="text-xs">Clients</TabsTrigger>
                                    <TabsTrigger value="orders" className="text-xs">Orders</TabsTrigger>
                                    <TabsTrigger value="proposals" className="text-xs">Props</TabsTrigger>
                                </TabsList>
                                <TabsList className="grid grid-cols-3 gap-1 bg-slate-700/50 w-full mt-2">
                                    <TabsTrigger value="slots" className="text-xs">Slots</TabsTrigger>
                                    <TabsTrigger value="bookings" className="text-xs">Book</TabsTrigger>
                                    <TabsTrigger value="invitations" className="text-xs">Invites</TabsTrigger>
                                </TabsList>

                                {Object.entries(API_ENDPOINTS).map(([category, endpoints]) => (
                                    <TabsContent key={category} value={category} className="mt-4 space-y-2">
                                        {endpoints.map((endpoint) => (
                                            <button
                                                key={endpoint.name}
                                                onClick={() => handleSelectEndpoint(endpoint)}
                                                className={`w-full p-3 rounded-lg text-left transition-all ${selectedEndpoint?.name === endpoint.name
                                                    ? "bg-emerald-600/30 border border-emerald-500"
                                                    : "bg-slate-700/50 hover:bg-slate-700 border border-transparent"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant={endpoint.method === "GET" ? "default" : endpoint.method === "POST" ? "default" : "secondary"}
                                                        className={
                                                            endpoint.method === "GET" ? "bg-blue-500" :
                                                                endpoint.method === "POST" ? "bg-emerald-500" :
                                                                    endpoint.method === "PATCH" ? "bg-amber-500" :
                                                                        "bg-red-500"
                                                        }
                                                    >
                                                        {endpoint.method}
                                                    </Badge>
                                                    <span className="text-sm font-medium text-white">{endpoint.name}</span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">{endpoint.description}</p>
                                            </button>
                                        ))}
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Center: Request Builder */}
                    <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white">Request Builder</CardTitle>
                            <CardDescription>Configure ta requête</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {selectedEndpoint ? (
                                <>
                                    <div className="p-3 rounded-lg bg-slate-700/50">
                                        <div className="flex items-center gap-2">
                                            <Badge className={
                                                selectedEndpoint.method === "GET" ? "bg-blue-500" :
                                                    selectedEndpoint.method === "POST" ? "bg-emerald-500" :
                                                        selectedEndpoint.method === "PATCH" ? "bg-amber-500" :
                                                            "bg-red-500"
                                            }>
                                                {selectedEndpoint.method}
                                            </Badge>
                                            <code className="text-emerald-400 text-sm">{selectedEndpoint.path}</code>
                                        </div>
                                    </div>

                                    {/* Path Parameters */}
                                    {Object.keys(pathParams).length > 0 && (
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Path Parameters</Label>
                                            {Object.entries(pathParams).map(([key, value]) => (
                                                <div key={key} className="flex items-center gap-2">
                                                    <Label className="w-16 text-xs text-slate-400">{`{${key}}`}</Label>
                                                    <Input
                                                        value={value}
                                                        onChange={(e) => setPathParams((prev) => ({ ...prev, [key]: e.target.value }))}
                                                        placeholder={`Enter ${key}`}
                                                        className="bg-slate-700 border-slate-600 text-white"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Request Body */}
                                    {selectedEndpoint.method !== "GET" && selectedEndpoint.method !== "DELETE" && (
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Request Body (JSON)</Label>
                                            <textarea
                                                value={customBody}
                                                onChange={(e) => setCustomBody(e.target.value)}
                                                className="w-full h-40 p-3 rounded-lg bg-slate-700 border border-slate-600 text-emerald-400 font-mono text-sm resize-none"
                                                placeholder="{ }"
                                            />
                                        </div>
                                    )}

                                    <Button
                                        onClick={() => executeApi(selectedEndpoint)}
                                        disabled={loading !== null}
                                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                                    >
                                        {loading === selectedEndpoint.name ? "Sending..." : "Send Request"}
                                    </Button>
                                </>
                            ) : (
                                <div className="text-center py-8 text-slate-400">
                                    Sélectionne un endpoint à gauche
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right: Results */}
                    <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white">Response History</CardTitle>
                            <CardDescription>{results.length} résultats</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px]">
                                <div className="space-y-3">
                                    {results.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400">
                                            Aucun résultat pour l&apos;instant
                                        </div>
                                    ) : (
                                        results.map((result, index) => (
                                            <div
                                                key={index}
                                                className="p-3 rounded-lg bg-slate-700/50 border border-slate-600"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <Badge variant={getStatusBadge(result.status)}>
                                                        {result.status} {result.statusText}
                                                    </Badge>
                                                    <span className="text-xs text-slate-400">{result.duration}ms</span>
                                                </div>
                                                <pre className="text-xs text-slate-300 overflow-x-auto max-h-32 overflow-y-auto">
                                                    {JSON.stringify(result.data, null, 2)}
                                                </pre>
                                                <div className="text-xs text-slate-500 mt-2">
                                                    {result.timestamp.toLocaleTimeString()}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
