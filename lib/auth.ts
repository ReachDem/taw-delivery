import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import {
    generateAdminInvitationEmail,
    generateAdminInvitationTextEmail,
} from "@/lib/email-templates";
import { getAppUrl } from "@/lib/url";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // Invitations auto-verify email
    },
    plugins: [
        organization({
            // Use Better-Auth default roles: owner, admin, member
            // owner: Full control over organization
            // admin: Full control except deleting org or changing owner
            // member: Read-only access
            async sendInvitationEmail(data) {
                // Use different invitation links based on the role
                // Admins accept at /admin/accept-invitation, members (agents) at /accept-invitation (route group (agent))
                const isAdmin = data.role === "admin";
                const basePath = isAdmin ? "/admin" : "";
                const inviteLink = `${getAppUrl()}${basePath}/accept-invitation/${data.id}`;

                const emailHtml = generateAdminInvitationEmail({
                    inviteeName: data.email,
                    inviterName: data.inviter.user.name,
                    role: data.role,
                    agencyName: data.organization.name,
                    invitationLink: inviteLink,
                    expiresInDays: 7,
                });

                const emailText = generateAdminInvitationTextEmail({
                    inviteeName: data.email,
                    inviterName: data.inviter.user.name,
                    role: data.role,
                    agencyName: data.organization.name,
                    invitationLink: inviteLink,
                    expiresInDays: 7,
                });

                await sendEmail({
                    to: data.email,
                    subject: "Invitation à rejoindre TGVAIRWABO",
                    html: emailHtml,
                    text: emailText,
                });
            },
        }),
    ],
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "AGENT",
                input: false, // Don't allow user to set their own role
            },
        },
    },
    session: {
        expiresIn: 60 * 60 * 24, // 1 day
        updateAge: 0, // Always fetch fresh user data (role may change after invitation)
    },
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.BETTER_AUTH_URL!,
});

export type Session = typeof auth.$Infer.Session;
