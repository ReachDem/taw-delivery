import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "happy-dom",
        globals: true,
        setupFiles: ["./tests/setup.ts"],
        include: [
            "tests/**/*.test.ts",
            "tests/**/*.test.tsx",
        ],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            include: ["lib/**/*.ts", "app/api/**/*.ts"],
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./"),
        },
    },
});
