import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateAgencyInput, UpdateAgencyInput } from "@/lib/validations/agency";

// Types
export interface Agency {
    id: string;
    name: string;
    address: string;
    city: string;
    phone: string | null;
    createdAt: string;
    updatedAt: string;
    _count?: {
        agents: number;
        drivers: number;
        orders: number;
    };
}

interface AgenciesResponse {
    agencies: Agency[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// API functions
async function fetchAgencies(search?: string): Promise<AgenciesResponse> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);

    const res = await fetch(`/api/agencies?${params}`);
    if (!res.ok) throw new Error("Failed to fetch agencies");
    const response = await res.json();
    // API returns { success: true, data: { agencies, total, ... } }
    return response.data || response;
}

async function createAgency(data: CreateAgencyInput): Promise<Agency> {
    const res = await fetch("/api/agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create agency");
    }
    const response = await res.json();
    // API returns { success: true, data: agency }
    return response.data || response;
}

async function updateAgency({ id, data }: { id: string; data: UpdateAgencyInput }): Promise<Agency> {
    const res = await fetch(`/api/agencies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update agency");
    }
    const response = await res.json();
    // API returns { success: true, data: agency }
    return response.data || response;
}

async function deleteAgency(id: string): Promise<void> {
    const res = await fetch(`/api/agencies/${id}`, {
        method: "DELETE",
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete agency");
    }
}

// Hooks
export function useAgencies(search?: string) {
    return useQuery({
        queryKey: ["agencies", search],
        queryFn: () => fetchAgencies(search),
    });
}

export function useCreateAgency() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createAgency,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agencies"] });
        },
    });
}

export function useUpdateAgency() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateAgency,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agencies"] });
        },
    });
}

export function useDeleteAgency() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteAgency,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agencies"] });
        },
    });
}
