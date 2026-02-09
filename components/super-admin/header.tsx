"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Route mapping for breadcrumb
const routeMap: Record<string, string> = {
    "/super": "Dashboard",
    "/super/agencies": "Agences",
    "/super/staff": "Staff",
    "/super/orders": "Commandes",
    "/super/slots": "Créneaux",
    "/super/settings": "Paramètres",
};

// Mock notifications
const notifications = [
    {
        id: 1,
        title: "Nouvelle agence créée",
        description: "Agence Dakar Centre",
        time: "Il y a 2h",
    },
    {
        id: 2,
        title: "Nouvel administrateur invité",
        description: "admin@example.com",
        time: "Il y a 5h",
    },
    {
        id: 3,
        title: "Pic de commandes détecté",
        description: "Agence Plateau",
        time: "Il y a 1j",
    },
];

export function SuperAdminHeader() {
    const pathname = usePathname();

    // Build breadcrumb items
    const getBreadcrumbItems = () => {
        const items = [
            { href: "/super", label: "Dashboard", isLast: pathname === "/super" },
        ];

        if (pathname !== "/super") {
            const currentPage = routeMap[pathname] || "Page";
            items.push({ href: pathname, label: currentPage, isLast: true });
        }

        return items;
    };

    const breadcrumbItems = getBreadcrumbItems();
    const unreadCount = notifications.length;

    return (
        <div className="flex flex-1 items-center justify-between gap-4">
            {/* Breadcrumb Navigation */}
            <Breadcrumb>
                <BreadcrumbList>
                    {breadcrumbItems.map((item, index) => (
                        <div key={item.href} className="flex items-center gap-2">
                            <BreadcrumbItem>
                                {item.isLast ? (
                                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink href={item.href}>
                                        {item.label}
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!item.isLast && <BreadcrumbSeparator />}
                        </div>
                    ))}
                </BreadcrumbList>
            </Breadcrumb>

            {/* Right Side: Search + Notifications */}
            <div className="flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Rechercher..."
                        className="w-64 pl-9"
                    />
                </div>

                {/* Notifications Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                                >
                                    {unreadCount}
                                </Badge>
                            )}
                            <span className="sr-only">Notifications</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {notifications.map((notification) => (
                            <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 p-3">
                                <div className="flex w-full items-start justify-between">
                                    <span className="font-medium">{notification.title}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {notification.time}
                                    </span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {notification.description}
                                </span>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="justify-center text-center">
                            Voir toutes les notifications
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
