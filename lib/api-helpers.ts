import { NextResponse } from "next/server";
import { z, ZodError, ZodSchema } from "zod";

// ============================================
// API Response Helpers
// ============================================

interface ApiResponseOptions {
    status?: number;
}

/**
 * Standard success response
 */
export function apiResponse<T>(data: T, options: ApiResponseOptions = {}) {
    const { status = 200 } = options;
    return NextResponse.json(
        { success: true, data },
        { status }
    );
}

/**
 * Standard error response
 */
export function apiError(
    message: string,
    status: number = 400,
    errors?: Record<string, string[]>
) {
    return NextResponse.json(
        {
            success: false,
            error: message,
            ...(errors && { errors }),
        },
        { status }
    );
}

/**
 * Validation error response (400)
 */
export function validationError(errors: Record<string, string[]>) {
    return apiError("Erreur de validation", 400, errors);
}

/**
 * Not found error response (404)
 */
export function notFoundError(resource: string = "Ressource") {
    return apiError(`${resource} non trouvé(e)`, 404);
}

/**
 * Unauthorized error response (401)
 */
export function unauthorizedError() {
    return apiError("Non authentifié", 401);
}

/**
 * Forbidden error response (403)
 */
export function forbiddenError() {
    return apiError("Accès interdit", 403);
}

/**
 * Conflict error response (409)
 */
export function conflictError(message: string = "Conflit") {
    return apiError(message, 409);
}

/**
 * Gone error response (410) - for expired resources
 */
export function goneError(message: string = "Ressource expirée") {
    return apiError(message, 410);
}

// ============================================
// Validation Helpers
// ============================================

type ValidationSuccess<T> = { success: true; data: T };
type ValidationError = { success: false; error: NextResponse };
type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

/**
 * Parse and validate request body with Zod schema
 * Returns a discriminated union for proper type narrowing
 */
export async function validateBody<T>(
    request: Request,
    schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
    try {
        const body = await request.json();
        const data = schema.parse(body);
        return { success: true, data };
    } catch (error) {
        if (error instanceof ZodError) {
            const errors: Record<string, string[]> = {};
            error.issues.forEach((err) => {
                const path = err.path.join(".");
                if (!errors[path]) {
                    errors[path] = [];
                }
                errors[path].push(err.message);
            });
            return { success: false, error: validationError(errors) };
        }
        return { success: false, error: apiError("Corps de requête invalide", 400) };
    }
}

/**
 * Parse URL search params to object
 */
export function parseSearchParams(request: Request): Record<string, string> {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
        params[key] = value;
    });
    return params;
}
