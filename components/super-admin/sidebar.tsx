"use client";

import {
    Building2,
    Users,
    Package,
    Calendar,
    Settings,
    LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
} from "@/components/ui/sidebar";

const menuItems = [
    {
        title: "Home",
        url: "/super",
        icon: LayoutDashboard,
    },
    {
        title: "Agences",
        url: "/super/agencies",
        icon: Building2,
    },
    {
        title: "Staff",
        url: "/super/staff",
        icon: Users,
    },
    {
        title: "Commandes",
        url: "/super/orders",
        icon: Package,
    },
    {
        title: "Créneaux",
        url: "/super/slots",
        icon: Calendar,
    },
    {
        title: "Paramètres",
        url: "/super/settings",
        icon: Settings,
    },
];

export function SuperAdminSidebar() {
    const pathname = usePathname();

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="flex h-16 border-b px-2">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Building2 className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-semibold">TAW Delivery</span>
                        <span className="text-xs text-muted-foreground">Super Admin</span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.url}
                                        tooltip={item.title}
                                    >
                                        <Link href={item.url}>
                                            <item.icon className="!h-5 !w-5" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="border-t p-4">
                <div className="text-xs text-muted-foreground">
                    v1.0.0
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
