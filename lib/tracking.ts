// ============================================
// TAW DELIVERY - Service de Tracking
// ============================================

import { createServiceClient } from '@/lib/supabase/server';

// Types d'événements
export type TrackingEventType =
  | 'parcel.created'
  | 'parcel.status_changed'
  | 'notification.sent'
  | 'notification.delivered'
  | 'notification.failed'
  | 'confirmation.received'
  | 'delivery.created'
  | 'delivery.assigned'
  | 'delivery.started'
  | 'delivery.completed'
  | 'delivery.cancelled';

interface TrackingEventData {
  [key: string]: unknown;
}

interface TrackingOptions {
  parcel_id?: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Enregistre un événement de tracking
 */
export async function trackEvent(
  eventType: TrackingEventType,
  data: TrackingEventData = {},
  options: TrackingOptions = {}
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase.from('tracking_events').insert({
    event_type: eventType,
    data,
    parcel_id: options.parcel_id || null,
    user_id: options.user_id || null,
    ip_address: options.ip_address || null,
    user_agent: options.user_agent || null,
  });

  if (error) {
    console.error('Failed to track event:', error);
    // Ne pas throw - le tracking ne doit pas bloquer les opérations
  }
}

/**
 * Track la création d'un colis
 */
export async function trackParcelCreated(
  parcelId: string,
  code: string,
  userId: string,
  agencyId: string
): Promise<void> {
  await trackEvent(
    'parcel.created',
    {
      code,
      agency_id: agencyId,
    },
    {
      parcel_id: parcelId,
      user_id: userId,
    }
  );
}

/**
 * Track le changement de statut d'un colis
 */
export async function trackStatusChange(
  parcelId: string,
  oldStatus: string,
  newStatus: string,
  userId?: string
): Promise<void> {
  await trackEvent(
    'parcel.status_changed',
    {
      old_status: oldStatus,
      new_status: newStatus,
    },
    {
      parcel_id: parcelId,
      user_id: userId,
    }
  );
}

/**
 * Track l'envoi d'une notification
 */
export async function trackNotificationSent(
  parcelId: string,
  notificationType: 'sms' | 'email',
  recipient: string,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  await trackEvent(
    success ? 'notification.sent' : 'notification.failed',
    {
      type: notificationType,
      recipient,
      error: errorMessage,
    },
    {
      parcel_id: parcelId,
    }
  );
}

/**
 * Track la confirmation du destinataire
 */
export async function trackConfirmationReceived(
  parcelId: string,
  choice: 'retrait' | 'livraison',
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await trackEvent(
    'confirmation.received',
    {
      choice,
    },
    {
      parcel_id: parcelId,
      ip_address: ipAddress,
      user_agent: userAgent,
    }
  );
}

/**
 * Track l'assignation d'un livreur
 */
export async function trackDeliveryAssigned(
  parcelId: string,
  deliveryId: string,
  driverId: string,
  scheduledDate: string,
  userId: string
): Promise<void> {
  await trackEvent(
    'delivery.assigned',
    {
      delivery_id: deliveryId,
      driver_id: driverId,
      scheduled_date: scheduledDate,
    },
    {
      parcel_id: parcelId,
      user_id: userId,
    }
  );
}

/**
 * Track la complétion d'une livraison
 */
export async function trackDeliveryCompleted(
  parcelId: string,
  deliveryId: string,
  driverId: string
): Promise<void> {
  await trackEvent(
    'delivery.completed',
    {
      delivery_id: deliveryId,
    },
    {
      parcel_id: parcelId,
      user_id: driverId,
    }
  );
}

/**
 * Récupère l'historique de tracking d'un colis
 */
export async function getParcelHistory(parcelId: string) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('tracking_events')
    .select('*')
    .eq('parcel_id', parcelId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get parcel history:', error);
    return [];
  }

  return data;
}
