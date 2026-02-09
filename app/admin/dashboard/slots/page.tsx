"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function AdminSlotsPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Créneaux</h1>
                <p className="text-muted-foreground">
                    Gérer les créneaux de livraison de votre agence
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <Select>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Date" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Aujourd&apos;hui</SelectItem>
                                <SelectItem value="tomorrow">Demain</SelectItem>
                                <SelectItem value="week">Cette semaine</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Créneaux disponibles - 09/02/2026</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Heure</TableHead>
                                <TableHead>Capacité Max</TableHead>
                                <TableHead>Réservations</TableHead>
                                <TableHead>Disponibilité</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>09/02/2026</TableCell>
                                <TableCell>09:00 - 10:00</TableCell>
                                <TableCell>4</TableCell>
                                <TableCell>2</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-24 rounded-full bg-gray-200">
                                            <div className="h-2 w-1/2 rounded-full bg-green-500" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">50%</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                        Disponible
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                        Gérer
                                    </Button>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>09/02/2026</TableCell>
                                <TableCell>10:00 - 11:00</TableCell>
                                <TableCell>4</TableCell>
                                <TableCell>4</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-24 rounded-full bg-gray-200">
                                            <div className="h-2 w-full rounded-full bg-red-500" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">100%</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-red-50 text-red-700">
                                        Complet
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                        Gérer
                                    </Button>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>09/02/2026</TableCell>
                                <TableCell>14:00 - 15:00</TableCell>
                                <TableCell>4</TableCell>
                                <TableCell>1</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-24 rounded-full bg-gray-200">
                                            <div className="h-2 w-1/4 rounded-full bg-green-500" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">25%</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                        Disponible
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                        Gérer
                                    </Button>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>09/02/2026</TableCell>
                                <TableCell>16:00 - 17:00</TableCell>
                                <TableCell>4</TableCell>
                                <TableCell>3</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-24 rounded-full bg-gray-200">
                                            <div className="h-2 w-3/4 rounded-full bg-yellow-500" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">75%</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                        Presque complet
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                        Gérer
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
