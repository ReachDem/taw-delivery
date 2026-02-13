import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AgentSidebar } from "@/components/agent/sidebar";

export default async function AgentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch agency details server-side
  const { getAgencyDetails } = await import("@/app/actions/agency");
  const agency = await getAgencyDetails();

  return (
    <SidebarProvider>
      <AgentSidebar agency={agency} />
      <SidebarInset>
        <main className="flex-1 overflow-y-auto min-h-screen bg-gray-50/50">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
