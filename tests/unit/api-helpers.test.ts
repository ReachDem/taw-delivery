/**
 * Tests unitaires pour lib/api-helpers.ts
 */
import { describe, it, expect, vi } from "vitest";
import {
    apiResponse,
    apiError,
    validationError,
    notFoundError,
    unauthorizedError,
    forbiddenError,
    conflictError,
    goneError,
    parseSearchParams,
} from "@/lib/api-helpers";

describe("API Helpers", () => {
    describe("apiResponse", () => {
        it("should return success response with data", async () => {
            const data = { id: "123", name: "Test" };
            const response = apiResponse(data);

            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.success).toBe(true);
            expect(json.data).toEqual(data);
        });

        it("should allow custom status code", async () => {
            const response = apiResponse({ created: true }, { status: 201 });
            expect(response.status).toBe(201);
        });
    });

    describe("apiError", () => {
        it("should return error response", async () => {
            const response = apiError("Something went wrong", 400);

            expect(response.status).toBe(400);
            const json = await response.json();
            expect(json.success).toBe(false);
            expect(json.error).toBe("Something went wrong");
        });

        it("should include validation errors when provided", async () => {
            const errors = { email: ["Invalid email format"] };
            const response = apiError("Validation failed", 400, errors);

            const json = await response.json();
            expect(json.errors).toEqual(errors);
        });
    });

    describe("Error helpers", () => {
        it("validationError should return 400", async () => {
            const response = validationError({ field: ["Error message"] });
            expect(response.status).toBe(400);
        });

        it("notFoundError should return 404", async () => {
            const response = notFoundError("User");
            expect(response.status).toBe(404);

            const json = await response.json();
            expect(json.error).toContain("User");
        });

        it("unauthorizedError should return 401", async () => {
            const response = unauthorizedError();
            expect(response.status).toBe(401);
        });

        it("forbiddenError should return 403", async () => {
            const response = forbiddenError();
            expect(response.status).toBe(403);
        });

        it("conflictError should return 409", async () => {
            const response = conflictError("Already exists");
            expect(response.status).toBe(409);
        });

        it("goneError should return 410", async () => {
            const response = goneError("Expired");
            expect(response.status).toBe(410);
        });
    });

    describe("parseSearchParams", () => {
        it("should parse URL search params to object", () => {
            const request = new Request("http://localhost:3000/api?city=Paris&status=active");
            const params = parseSearchParams(request);

            expect(params.city).toBe("Paris");
            expect(params.status).toBe("active");
        });

        it("should return empty object for no params", () => {
            const request = new Request("http://localhost:3000/api");
            const params = parseSearchParams(request);

            expect(params).toEqual({});
        });
    });
});
