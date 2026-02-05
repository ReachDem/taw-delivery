import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateDeliverySchema } from '@/lib/validations';
import { trackDeliveryCompleted, trackStatusChange } from '@/lib/tracking';

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH /api/deliveries/[id] - Mettre à jour une livraison
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Valider les données
    const body = await request.json();
    const validatedData = updateDeliverySchema.parse(body);

    // Récupérer la livraison actuelle
    const { data: currentDelivery, error: fetchError } = await supabase
      .from('deliveries')
      .select('*, parcel:parcels(*)')
      .eq('id', id)
      .single();

    if (fetchError || !currentDelivery) {
      return NextResponse.json({ error: 'Livraison non trouvée' }, { status: 404 });
    }

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = { ...validatedData };

    // Si la livraison est terminée, ajouter completed_at
    if (validatedData.status === 'terminée' && currentDelivery.status !== 'terminée') {
      updateData.completed_at = new Date().toISOString();
    }

    // Si la livraison démarre, ajouter started_at
    if (validatedData.status === 'en_cours' && currentDelivery.status !== 'en_cours') {
      updateData.started_at = new Date().toISOString();
    }

    // Mettre à jour
    const { data: delivery, error: updateError } = await supabase
      .from('deliveries')
      .update(updateData)
      .eq('id', id)
      .select('*, parcel:parcels(*), driver:users(*)')
      .single();

    if (updateError) {
      console.error('Error updating delivery:', updateError);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    // Si la livraison est terminée, mettre à jour le statut du colis
    if (validatedData.status === 'terminée') {
      await supabase
        .from('parcels')
        .update({ status: 'LIVRÉ' })
        .eq('id', currentDelivery.parcel.id);

      await trackStatusChange(currentDelivery.parcel.id, 'EN_LIVRAISON', 'LIVRÉ', user.id);
      await trackDeliveryCompleted(currentDelivery.parcel.id, id, user.id);
    }

    // Si la livraison est annulée, remettre le colis en attente
    if (validatedData.status === 'annulée') {
      await supabase
        .from('parcels')
        .update({ status: 'EN_ATTENTE' })
        .eq('id', currentDelivery.parcel.id);

      await trackStatusChange(currentDelivery.parcel.id, 'EN_LIVRAISON', 'EN_ATTENTE', user.id);
    }

    return NextResponse.json({ data: delivery });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides', details: error }, { status: 400 });
    }
    console.error('Error in PATCH /api/deliveries/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
