import { betterFetch } from "@better-fetch/fetch";
import { type NextRequest, NextResponse } from "next/server";
import { getHomeByRole, LOGIN_ROUTE } from "@/lib/auth-redirect";

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
            return NextResponse.redirect(new URL(LOGIN_ROUTE, request.url));
        }

        if (!session) {
            return NextResponse.redirect(new URL(LOGIN_ROUTE, request.url));
        }

        const role = session.user.role;

        // /super/* → SUPER_ADMIN only
        if (pathname.startsWith("/super") && role !== "SUPER_ADMIN") {
            return NextResponse.redirect(new URL(getHomeByRole(role, LOGIN_ROUTE), request.url));
        }

        // /admin/* → SUPER_ADMIN or ADMIN only
        if (pathname.startsWith("/admin") && role !== "SUPER_ADMIN" && role !== "ADMIN") {
            // Non-admin users → send to login (safe: excluded from proxy)
            return NextResponse.redirect(new URL(LOGIN_ROUTE, request.url));
        }

        return NextResponse.next();
    }

    // ─── Future: /dashboard/* → AGENT only ───
    // ─── Future: /dlv/* → DRIVER only ───

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/super/:path*",
        "/admin/:path*",
    ],
};
