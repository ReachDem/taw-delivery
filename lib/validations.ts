// ============================================
// TAW DELIVERY - Validation Schemas (Zod)
// ============================================

import { z } from 'zod';

// ============================================
// PARCEL SCHEMAS
// ============================================

export const createParcelSchema = z.object({
  code: z.string().min(1, 'Le code est requis').max(100),
  description: z.string().optional(),
  weight: z.number().positive().optional(),
  recipient_name: z.string().min(1, 'Le nom du destinataire est requis'),
  recipient_phone: z.string().min(8, 'Numéro de téléphone invalide'),
  recipient_email: z.string().email().optional().or(z.literal('')),
  recipient_address: z.string().optional(),
  sender_name: z.string().optional(),
  sender_phone: z.string().optional(),
});

export const updateParcelStatusSchema = z.object({
  status: z.enum(['ARRIVÉ', 'EN_ATTENTE', 'EN_LIVRAISON', 'RETIRÉ', 'LIVRÉ']),
  notes: z.string().optional(),
});

export const parcelQuerySchema = z.object({
  status: z.enum(['ARRIVÉ', 'EN_ATTENTE', 'EN_LIVRAISON', 'RETIRÉ', 'LIVRÉ']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ============================================
// CONFIRMATION SCHEMAS
// ============================================

export const createConfirmationSchema = z.object({
  choice: z.enum(['retrait', 'livraison']),
  delivery_address: z.string().optional(),
  zone_id: z.string().uuid().optional(),
  slot_id: z.string().uuid().optional(),
  preferred_date: z.string().optional(), // YYYY-MM-DD
  notes: z.string().optional(),
}).refine(
  (data) => {
    // Si livraison, l'adresse est requise
    if (data.choice === 'livraison') {
      return !!data.delivery_address;
    }
    return true;
  },
  {
    message: "L'adresse de livraison est requise pour une livraison",
    path: ['delivery_address'],
  }
);

// ============================================
// DELIVERY SCHEMAS
// ============================================

export const createDeliverySchema = z.object({
  parcel_id: z.string().uuid(),
  driver_id: z.string().uuid().optional(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
  slot_id: z.string().uuid().optional(),
  delivery_address: z.string().optional(),
  delivery_fee: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const updateDeliverySchema = z.object({
  driver_id: z.string().uuid().optional(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  slot_id: z.string().uuid().optional(),
  status: z.enum(['programmée', 'en_cours', 'terminée', 'annulée']).optional(),
  notes: z.string().optional(),
});

// ============================================
// DELIVERY ZONE SCHEMAS
// ============================================

export const createDeliveryZoneSchema = z.object({
  zone_name: z.string().min(1, 'Le nom de la zone est requis'),
  description: z.string().optional(),
  delivery_fee: z.number().min(0),
});

// ============================================
// DELIVERY SLOT SCHEMAS
// ============================================

export const createDeliverySlotSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format d\'heure invalide (HH:MM)'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format d\'heure invalide (HH:MM)'),
  max_deliveries: z.number().int().positive().default(10),
});

// ============================================
// IMPORT SCHEMAS
// ============================================

export const importParcelRowSchema = z.object({
  code: z.string().min(1),
  recipient_name: z.string().min(1),
  recipient_phone: z.string().min(8),
  description: z.string().optional(),
  weight: z.coerce.number().positive().optional(),
  sender_name: z.string().optional(),
  sender_phone: z.string().optional(),
});

// ============================================
// USER SCHEMAS
// ============================================

export const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  full_name: z.string().min(1, 'Le nom est requis'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'agent', 'livreur']),
  agency_id: z.string().uuid('Agence invalide'),
});

export const updateUserSchema = z.object({
  full_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.enum(['admin', 'agent', 'livreur']).optional(),
  agency_id: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
});

// ============================================
// AGENCY SCHEMAS
// ============================================

export const createAgencySchema = z.object({
  name: z.string().min(1, "Le nom de l'agence est requis"),
  country: z.string().min(1, 'Le pays est requis'),
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

export const updateAgencySchema = z.object({
  name: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  is_active: z.boolean().optional(),
});

// ============================================
// TYPES INFÉRÉS
// ============================================

export type CreateParcelInput = z.infer<typeof createParcelSchema>;
export type UpdateParcelStatusInput = z.infer<typeof updateParcelStatusSchema>;
export type ParcelQuery = z.infer<typeof parcelQuerySchema>;
export type CreateConfirmationInput = z.infer<typeof createConfirmationSchema>;
export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
export type UpdateDeliveryInput = z.infer<typeof updateDeliverySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateAgencyInput = z.infer<typeof createAgencySchema>;
export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>;
