export const LOGIN_ROUTE = "/admin/login";

type Role = "SUPER_ADMIN" | "ADMIN" | "AGENT" | "DRIVER" | string | undefined;

/**
 * Returns the default home route for an authenticated user role.
 */
export function getHomeByRole(
    role?: Role,
    defaultPath: string = "/dashboard"
): string {
    switch (role) {
        case "SUPER_ADMIN":
            return "/super";
        case "ADMIN":
            return "/admin/dashboard";
        case "AGENT":
            return "/dashboard";
        case "DRIVER":
            return "/admin/dashboard"; // Future: "/dlv/dashboard"
        default:
            return defaultPath;
    }
}
