// ============================================
// TAW DELIVERY - Types TypeScript
// ============================================

// ============================================
// ENUMS
// ============================================

export type UserRole = 'admin' | 'agent' | 'livreur';

export type ParcelStatus = 'ARRIVÉ' | 'EN_ATTENTE' | 'EN_LIVRAISON' | 'RETIRÉ' | 'LIVRÉ';

export type ConfirmationChoice = 'retrait' | 'livraison';

export type DeliveryStatus = 'programmée' | 'en_cours' | 'terminée' | 'annulée';

export type NotificationType = 'sms' | 'email';

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed';

// ============================================
// DATABASE TYPES
// ============================================

export interface Agency {
  id: string;
  name: string;
  country: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  agency_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  agency?: Agency;
}

export interface Parcel {
  id: string;
  code: string;
  external_id: string | null;
  description: string | null;
  weight: number | null;
  recipient_name: string;
  recipient_phone: string;
  recipient_email: string | null;
  recipient_address: string | null;
  sender_name: string | null;
  sender_phone: string | null;
  status: ParcelStatus;
  agency_id: string;
  created_by: string | null;
  notified_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  agency?: Agency;
  creator?: User;
  confirmation?: Confirmation;
  delivery?: Delivery;
}

export interface DeliveryZone {
  id: string;
  agency_id: string;
  zone_name: string;
  description: string | null;
  delivery_fee: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  agency?: Agency;
}

export interface DeliverySlot {
  id: string;
  agency_id: string;
  day_of_week: number; // 0-6, 0 = Dimanche
  start_time: string;
  end_time: string;
  max_deliveries: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  agency?: Agency;
}

export interface Confirmation {
  id: string;
  parcel_id: string;
  choice: ConfirmationChoice;
  delivery_address: string | null;
  zone_id: string | null;
  slot_id: string | null;
  preferred_date: string | null;
  notes: string | null;
  confirmed_at: string;
  // Relations
  parcel?: Parcel;
  zone?: DeliveryZone;
  slot?: DeliverySlot;
}

export interface Delivery {
  id: string;
  parcel_id: string;
  driver_id: string | null;
  confirmation_id: string | null;
  scheduled_date: string;
  slot_id: string | null;
  status: DeliveryStatus;
  delivery_address: string | null;
  delivery_fee: number;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  parcel?: Parcel;
  driver?: User;
  confirmation?: Confirmation;
  slot?: DeliverySlot;
}

export interface Notification {
  id: string;
  parcel_id: string;
  type: NotificationType;
  recipient: string;
  message: string;
  status: NotificationStatus;
  external_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
  // Relations
  parcel?: Parcel;
}

export interface TrackingEvent {
  id: string;
  parcel_id: string | null;
  event_type: string;
  data: Record<string, unknown>;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Relations
  parcel?: Parcel;
  user?: User;
}

// ============================================
// API TYPES
// ============================================

// Création d'un colis
export interface CreateParcelInput {
  code: string;
  description?: string;
  weight?: number;
  recipient_name: string;
  recipient_phone: string;
  recipient_email?: string;
  recipient_address?: string;
  sender_name?: string;
  sender_phone?: string;
}

// Mise à jour du statut d'un colis
export interface UpdateParcelStatusInput {
  status: ParcelStatus;
  notes?: string;
}

// Confirmation du destinataire
export interface CreateConfirmationInput {
  choice: ConfirmationChoice;
  delivery_address?: string;
  zone_id?: string;
  slot_id?: string;
  preferred_date?: string;
  notes?: string;
}

// Création d'une livraison
export interface CreateDeliveryInput {
  parcel_id: string;
  driver_id?: string;
  scheduled_date: string;
  slot_id?: string;
  delivery_address?: string;
  delivery_fee?: number;
  notes?: string;
}

// ============================================
// UI TYPES
// ============================================

export interface ParcelWithRelations extends Parcel {
  agency: Agency;
  confirmation?: Confirmation;
  delivery?: Delivery;
}

export interface DeliveryWithRelations extends Delivery {
  parcel: ParcelWithRelations;
  driver?: User;
  slot?: DeliverySlot;
}

// Stats du dashboard
export interface DashboardStats {
  arrived_today: number;
  pending: number;
  in_delivery: number;
  delivered_today: number;
  total_parcels: number;
}

// ============================================
// UTILITY TYPES
// ============================================

export type ApiResponse<T> = {
  data: T;
  error: null;
} | {
  data: null;
  error: string;
};

// Jours de la semaine
export const DAYS_OF_WEEK = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
] as const;

// Labels des statuts
export const PARCEL_STATUS_LABELS: Record<ParcelStatus, string> = {
  'ARRIVÉ': 'Arrivé en agence',
  'EN_ATTENTE': 'En attente de confirmation',
  'EN_LIVRAISON': 'En cours de livraison',
  'RETIRÉ': 'Retiré en agence',
  'LIVRÉ': 'Livré à domicile',
};

// Couleurs des statuts (pour l'UI)
export const PARCEL_STATUS_COLORS: Record<ParcelStatus, string> = {
  'ARRIVÉ': 'bg-blue-100 text-blue-800',
  'EN_ATTENTE': 'bg-yellow-100 text-yellow-800',
  'EN_LIVRAISON': 'bg-purple-100 text-purple-800',
  'RETIRÉ': 'bg-green-100 text-green-800',
  'LIVRÉ': 'bg-green-100 text-green-800',
};

// Aliases pour rétrocompatibilité
export const STATUS_LABELS = PARCEL_STATUS_LABELS;
export const STATUS_COLORS = PARCEL_STATUS_COLORS;
