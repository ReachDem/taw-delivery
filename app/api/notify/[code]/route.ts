import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendParcelArrivalNotification } from '@/lib/sms/mboa';
import { trackNotificationSent, trackStatusChange } from '@/lib/tracking';

interface Params {
  params: Promise<{ code: string }>;
}

// POST /api/notify/[code] - Envoyer SMS de notification
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { code } = await params;
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer le colis avec l'agence
    const { data: parcel, error: parcelError } = await supabase
      .from('parcels')
      .select('*, agency:agencies(*)')
      .eq('code', code)
      .single();

    if (parcelError || !parcel) {
      return NextResponse.json({ error: 'Colis non trouvé' }, { status: 404 });
    }

    // Enregistrer la notification dans la base (pending)
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .insert({
        parcel_id: parcel.id,
        type: 'sms',
        recipient: parcel.recipient_phone,
        message: `Votre colis ${parcel.code} est arrivé à ${parcel.agency.name}. Confirmez: https://${process.env.NEXT_PUBLIC_SHORT_DOMAIN}/c/${parcel.code}`,
        status: 'pending',
      })
      .select()
      .single();

    if (notifError) {
      console.error('Error creating notification record:', notifError);
    }

    try {
      // Envoyer le SMS
      const smsResult = await sendParcelArrivalNotification(
        parcel.recipient_phone,
        parcel.code,
        parcel.agency.name
      );

      // Mettre à jour la notification comme envoyée
      if (notification) {
        await supabase
          .from('notifications')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            external_id: smsResult?.message || null,
          })
          .eq('id', notification.id);
      }

      // Mettre à jour le statut du colis
      const oldStatus = parcel.status;
      if (oldStatus === 'ARRIVÉ') {
        await supabase
          .from('parcels')
          .update({ status: 'EN_ATTENTE' })
          .eq('id', parcel.id);

        await trackStatusChange(parcel.id, oldStatus, 'EN_ATTENTE', user.id);
      }

      // Tracker l'envoi
      await trackNotificationSent(parcel.id, 'sms', parcel.recipient_phone, true);

      return NextResponse.json({
        success: true,
        message: 'SMS envoyé avec succès',
        data: { parcel_code: parcel.code, recipient: parcel.recipient_phone },
      });
    } catch (smsError) {
      // Mettre à jour la notification comme échouée
      if (notification) {
        await supabase
          .from('notifications')
          .update({
            status: 'failed',
            error_message: smsError instanceof Error ? smsError.message : 'Unknown error',
          })
          .eq('id', notification.id);
      }

      // Tracker l'échec
      await trackNotificationSent(
        parcel.id,
        'sms',
        parcel.recipient_phone,
        false,
        smsError instanceof Error ? smsError.message : 'Unknown error'
      );

      console.error('SMS sending failed:', smsError);
      return NextResponse.json(
        { error: 'Échec de l\'envoi du SMS', details: smsError instanceof Error ? smsError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/notify/[code]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
