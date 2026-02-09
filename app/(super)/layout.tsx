import { SidebarProvider } from "@/components/ui/sidebar";
import { SuperAdminSidebar } from "@/components/super-admin/sidebar";

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <SuperAdminSidebar />
                <main className="flex-1 overflow-y-auto bg-background">
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
}
