import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    plugins: [
        organizationClient(),
        inferAdditionalFields({
            user: {
                role: {
                    type: "string",
                    required: false,
                },
            },
        }),
    ],
});

export const {
    signIn,
    signUp,
    signOut,
    useSession,
    getSession,
    organization,
} = authClient;
