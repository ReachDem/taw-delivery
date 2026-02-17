import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getHomeByRole, LOGIN_ROUTE } from "@/lib/auth-redirect";

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
        redirect(LOGIN_ROUTE);
    }

    // Redirect non-agents to their respective dashboards
    if (session.user.role !== "AGENT") {
        redirect(getHomeByRole(session.user.role, LOGIN_ROUTE));
    }

    return <>{children}</>;
}
