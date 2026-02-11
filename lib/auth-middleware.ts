import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/generated/prisma/client";
import { forbiddenError, unauthorizedError } from "@/lib/api-helpers";
import { NextResponse } from "next/server";

// ============================================
// Auth Middleware
// ============================================
// 
// Role architecture:
// - user.role (Prisma enum): SUPER_ADMIN, ADMIN, AGENT, DRIVER
//   → Platform-level role (what the user IS)
//   → Controls route access: /super (SUPER_ADMIN), /admin (ADMIN), etc.
//
// - member.role (Better-Auth org): owner, admin, member
//   → Organization-level role (permissions WITHIN an agency)
//   → Controls what they can do inside their assigned agency
//
// SUPER_ADMIN: Can do everything. Routes /admin/* and /super/*.
// ADMIN: Manages one agency. Routes /admin/*. Can invite agents/drivers.
// AGENT: Booking agent. Routes /dashboard/* (future).
// DRIVER: Delivery driver. Routes /dlv/* (future).
// ============================================

export type AuthSession = {
    user: {
        id: string;
        email: string;
        name: string;
        role: Role;
    };
    session: {
        id: string;
        token: string;
        expiresAt: Date;
    };
};

/**
 * Get the current session from the request
 * Returns null if not authenticated
 */
export async function getSession(): Promise<AuthSession | null> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return null;
    }

    return {
        user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: (session.user.role as Role) || Role.AGENT,
        },
        session: {
            id: session.session.id,
            token: session.session.token,
            expiresAt: session.session.expiresAt,
        },
    };
}

/**
 * Require authentication - returns session or error response
 */
export async function requireAuth(): Promise<
    [AuthSession, null] | [null, NextResponse]
> {
    const session = await getSession();

    if (!session) {
        return [null, unauthorizedError()];
    }

    return [session, null];
}

/**
 * Require specific roles - returns session or error response
 */
export async function requireRole(
    allowedRoles: Role[]
): Promise<[AuthSession, null] | [null, NextResponse]> {
    const [session, error] = await requireAuth();

    if (error) {
        return [null, error];
    }

    if (!allowedRoles.includes(session.user.role)) {
        return [null, forbiddenError()];
    }

    return [session, null];
}

/**
 * Check if user is admin (ADMIN or SUPER_ADMIN)
 */
export async function requireAdmin(): Promise<
    [AuthSession, null] | [null, NextResponse]
> {
    return requireRole([Role.ADMIN, Role.SUPER_ADMIN]);
}

/**
 * Check if user is super admin
 */
export async function requireSuperAdmin(): Promise<
    [AuthSession, null] | [null, NextResponse]
> {
    return requireRole([Role.SUPER_ADMIN]);
}
