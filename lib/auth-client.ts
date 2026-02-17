import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { getAppUrl } from "@/lib/url";

export const authClient = createAuthClient({
    baseURL: getAppUrl(),
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
