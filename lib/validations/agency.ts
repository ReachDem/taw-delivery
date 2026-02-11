import { z } from "zod";

// Agency validation schemas
export const createAgencySchema = z.object({
    name: z.string().min(1, "Le nom est requis").max(100, "Le nom est trop long"),
    address: z.string().min(1, "L'adresse est requise").max(200, "L'adresse est trop longue"),
    city: z.string().min(1, "La ville est requise").max(100, "La ville est trop longue"),
    phone: z.string().optional().nullable(),
});

export const updateAgencySchema = createAgencySchema.partial();

export type CreateAgencyInput = z.infer<typeof createAgencySchema>;
export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>;
