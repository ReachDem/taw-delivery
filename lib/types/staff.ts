export interface SerializedMember {
    id: string;
    role: string;
    createdAt: string;
    userId: string;
    organizationId: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        role: string;
    };
    organization: {
        id: string;
        name: string;
    };
}

export interface SerializedInvitation {
    id: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    expiresAt: string;
    organizationId: string;
    organization: {
        id: string;
        name: string;
    };
}

export interface SerializedAgency {
    id: string;
    name: string;
    organizationId: string | null;
}
