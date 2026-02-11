import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function AgentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    // Redirect to login if not authenticated
    if (!session?.user) {
        redirect("/login");
    }

    // Redirect non-agents to their respective dashboards
    if (session.user.role === "ADMIN") {
        redirect("/admin/dashboard");
    }
    if (session.user.role === "SUPER_ADMIN") {
        redirect("/(super)/super");
    }

    return <>{children}</>;
}
