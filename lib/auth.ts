import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        // Disable public signup - only admins can create accounts via invitations
        signUp: {
            enabled: false,
        },
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "AGENT",
                input: false, // Ne pas permettre à l'utilisateur de définir son rôle
            },
        },
    },
    session: {
        expiresIn: 60 * 60 * 24, // 1 jour (24 heures)
        updateAge: 60 * 60, // Mettre à jour toutes les heures
    },
});

export type Session = typeof auth.$Infer.Session;

