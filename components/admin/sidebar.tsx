"use client";

import {
  Users,
  Package,
  Calendar,
  Settings,
  LayoutDashboard,
  Truck,
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
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Personnel",
    url: "/admin/dashboard/staff",
    icon: Users,
  },
  {
    title: "Commandes",
    url: "/admin/dashboard/orders",
    icon: Package,
  },
  {
    title: "Créneaux",
    url: "/admin/dashboard/slots",
    icon: Calendar,
  },
  {
    title: "Paramètres",
    url: "/admin/dashboard/settings",
    icon: Settings,
  },
];

export function AdminSidebar({
  agency,
}: {
  agency?: {
    name: string;
    city: string;
  } | null;
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex h-16 border-b px-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Truck className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">
              {agency?.name || "TGVAIRWABO"}
            </span>
            <span className="text-xs text-muted-foreground">
              {agency?.city || "Administration"}
            </span>
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
        <div className="text-xs text-muted-foreground">v1.0.0</div>
      </SidebarFooter>
    </Sidebar>
  );
}
