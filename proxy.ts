import { betterFetch } from "@better-fetch/fetch";
import { type NextRequest, NextResponse } from "next/server";

type Session = {
    user: {
        id: string;
        email: string;
        emailVerified: boolean;
        name: string;
        image?: string;
        role?: string;
    };
    session: {
        id: string;
        expiresAt: Date;
        ipAddress?: string;
        userAgent?: string;
        userId: string;
    };
}

/**
 * Route protection rules:
 * - /super/*  → SUPER_ADMIN only
 * - /admin/*  → SUPER_ADMIN + ADMIN
 * - /dashboard/* → AGENT (future)
 * - /dlv/*    → DRIVER (future)
 * - /p/*      → Public (clients)
 *
 * Login: /admin/login (shared), post-login redirect by role.
 */
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ─── Protected zone: /super/* and /admin/* ───
    if (pathname.startsWith("/super") || pathname.startsWith("/admin")) {
        // Skip auth-related routes (login, accept-invitation)
        if (
            pathname.includes("/login") ||
            pathname.includes("/accept-invitation") ||
            pathname.startsWith("/api/auth")
        ) {
            return NextResponse.next();
        }

        // Fetch session via API (Edge runtime can't import Prisma)
        let session: Session | null = null;
        try {
            const result = await betterFetch<Session>(
                "/api/auth/get-session",
                {
                    baseURL: process.env.BETTER_AUTH_URL || request.nextUrl.origin,
                    headers: {
                        cookie: request.headers.get("cookie") || "",
                    },
                }
            );
            session = result.data;
        } catch {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }

        if (!session) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }

        const role = session.user.role;

        // /super/* → SUPER_ADMIN only
        if (pathname.startsWith("/super") && role !== "SUPER_ADMIN") {
            return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        }

        // /admin/* → SUPER_ADMIN or ADMIN only
        if (pathname.startsWith("/admin") && role !== "SUPER_ADMIN" && role !== "ADMIN") {
            // Redirect non-admin roles to their own domain
            const redirectUrl = getHomeByRole(role);
            return NextResponse.redirect(new URL(redirectUrl, request.url));
        }

        return NextResponse.next();
    }

    // ─── Future: /dashboard/* → AGENT only ───
    // ─── Future: /dlv/* → DRIVER only ───

    return NextResponse.next();
}

/**
 * Returns the home route for a given user role.
 * Used for post-login redirect and unauthorized access redirect.
 */
export function getHomeByRole(role?: string): string {
    switch (role) {
        case "SUPER_ADMIN":
            return "/super";
        case "ADMIN":
            return "/admin/dashboard";
        case "AGENT":
            return "/admin/dashboard"; // Future: "/dashboard"
        case "DRIVER":
            return "/admin/dashboard"; // Future: "/dlv"
        default:
            return "/admin/dashboard";
    }
}

export const config = {
    matcher: [
        "/super/:path*",
        "/admin/:path*",
    ],
};
