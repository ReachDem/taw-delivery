"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, LogOut } from "lucide-react";
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
import { authClient, useSession } from "@/lib/auth-client";

// Route mapping for breadcrumb
const routeMap: Record<string, string> = {
    "/admin/dashboard": "Dashboard",
    "/admin/dashboard/staff": "Personnel",
    "/admin/dashboard/orders": "Commandes",
    "/admin/dashboard/slots": "Créneaux",
    "/admin/dashboard/settings": "Paramètres",
};

// Mock notifications
const notifications = [
    {
        id: 1,
        title: "Nouvelle commande reçue",
        description: "Commande #CMD-042",
        time: "Il y a 30min",
    },
    {
        id: 2,
        title: "Livreur assigné",
        description: "Moussa Ba - Commande #CMD-039",
        time: "Il y a 2h",
    },
    {
        id: 3,
        title: "Créneau complet",
        description: "10:00 - 11:00 demain",
        time: "Il y a 4h",
    },
];

export function AdminHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();

    // Build breadcrumb items
    const getBreadcrumbItems = () => {
        const items = [
            { href: "/admin/dashboard", label: "Dashboard", isLast: pathname === "/admin/dashboard" },
        ];

        if (pathname !== "/admin/dashboard") {
            const currentPage = routeMap[pathname] || "Page";
            items.push({ href: pathname, label: currentPage, isLast: true });
        }

        return items;
    };

    const handleSignOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/admin/login");
                },
            },
        });
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

            {/* Right Side: Search + Notifications + Sign Out */}
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

                {/* User info + Sign out */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                                {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "A"}
                            </div>
                            <span className="hidden md:inline text-sm">
                                {session?.user?.name || session?.user?.email || "Admin"}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                            {session?.user?.email}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                            <LogOut className="mr-2 h-4 w-4" />
                            Se déconnecter
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
