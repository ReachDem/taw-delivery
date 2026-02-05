import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createConfirmationSchema } from '@/lib/validations';
import { trackConfirmationReceived, trackStatusChange } from '@/lib/tracking';

interface Params {
  params: Promise<{ code: string }>;
}

// GET /api/confirm/[code] - Récupérer infos colis pour page publique
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { code } = await params;
    
    // Utiliser le service client pour accès public
    const supabase = createServiceClient();

    // Récupérer le colis avec ses relations
    const { data: parcel, error } = await supabase
      .from('parcels')
      .select(`
        id,
        code,
        description,
        recipient_name,
        status,
        created_at,
        agency:agencies(id, name, city, address, phone),
        confirmation:confirmations(*)
      `)
      .eq('code', code)
      .single();

    if (error || !parcel) {
      return NextResponse.json({ error: 'Colis non trouvé' }, { status: 404 });
    }

    // Vérifier si le colis peut encore être confirmé
    const canConfirm = ['ARRIVÉ', 'EN_ATTENTE'].includes(parcel.status) && !parcel.confirmation;

    // L'agency est retourné comme objet (relation many-to-one)
    // TypeScript peut l'inférer comme un tableau, on le normalise
    const agencyData = parcel.agency;
    const agency = Array.isArray(agencyData) ? agencyData[0] : agencyData;
    const agencyId = agency?.id as string | undefined;

    // Récupérer les zones et créneaux disponibles si pas encore confirmé
    let zones = null;
    let slots = null;

    if (canConfirm && agencyId) {
      const [zonesResult, slotsResult] = await Promise.all([
        supabase
          .from('delivery_zones')
          .select('*')
          .eq('agency_id', agencyId)
          .eq('is_active', true),
        supabase
          .from('delivery_slots')
          .select('*')
          .eq('agency_id', agencyId)
          .eq('is_active', true),
      ]);

      zones = zonesResult.data;
      slots = slotsResult.data;
    }

    return NextResponse.json({
      data: {
        ...parcel,
        agency,
        can_confirm: canConfirm,
        delivery_zones: zones,
        delivery_slots: slots,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/confirm/[code]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/confirm/[code] - Soumettre la confirmation
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { code } = await params;
    const supabase = createServiceClient();

    // Récupérer le colis
    const { data: parcel, error: parcelError } = await supabase
      .from('parcels')
      .select('id, status, agency_id')
      .eq('code', code)
      .single();

    if (parcelError || !parcel) {
      return NextResponse.json({ error: 'Colis non trouvé' }, { status: 404 });
    }

    // Vérifier si le colis peut être confirmé
    if (!['ARRIVÉ', 'EN_ATTENTE'].includes(parcel.status)) {
      return NextResponse.json(
        { error: 'Ce colis ne peut plus être confirmé' },
        { status: 400 }
      );
    }

    // Vérifier si déjà confirmé
    const { data: existingConfirmation } = await supabase
      .from('confirmations')
      .select('id')
      .eq('parcel_id', parcel.id)
      .single();

    if (existingConfirmation) {
      return NextResponse.json(
        { error: 'Ce colis a déjà été confirmé' },
        { status: 400 }
      );
    }

    // Valider les données
    const body = await request.json();
    const validatedData = createConfirmationSchema.parse(body);

    // Créer la confirmation
    const { data: confirmation, error: confirmError } = await supabase
      .from('confirmations')
      .insert({
        parcel_id: parcel.id,
        choice: validatedData.choice,
        delivery_address: validatedData.delivery_address,
        zone_id: validatedData.zone_id,
        slot_id: validatedData.slot_id,
        preferred_date: validatedData.preferred_date,
        notes: validatedData.notes,
      })
      .select()
      .single();

    if (confirmError) {
      console.error('Error creating confirmation:', confirmError);
      return NextResponse.json(
        { error: 'Erreur lors de la confirmation' },
        { status: 500 }
      );
    }

    // Si livraison, créer l'entrée de livraison et mettre à jour le statut
    const oldStatus = parcel.status;
    let newStatus = oldStatus;

    if (validatedData.choice === 'livraison' && validatedData.preferred_date) {
      // Créer la livraison
      await supabase.from('deliveries').insert({
        parcel_id: parcel.id,
        confirmation_id: confirmation.id,
        scheduled_date: validatedData.preferred_date,
        slot_id: validatedData.slot_id,
        delivery_address: validatedData.delivery_address,
        status: 'programmée',
      });

      newStatus = 'EN_LIVRAISON';
    }

    // Mettre à jour le statut du colis si nécessaire
    if (newStatus !== oldStatus) {
      await supabase
        .from('parcels')
        .update({ status: newStatus })
        .eq('id', parcel.id);

      await trackStatusChange(parcel.id, oldStatus, newStatus);
    }

    // Tracker la confirmation
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;
    await trackConfirmationReceived(parcel.id, validatedData.choice, ip, userAgent);

    return NextResponse.json({
      success: true,
      message: validatedData.choice === 'retrait'
        ? 'Votre choix a été enregistré. Rendez-vous en agence pour récupérer votre colis.'
        : 'Votre demande de livraison a été enregistrée. Vous serez contacté pour confirmation.',
      data: confirmation,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides', details: error }, { status: 400 });
    }
    console.error('Error in POST /api/confirm/[code]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
