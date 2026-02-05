import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateParcelStatusSchema } from '@/lib/validations';
import { trackStatusChange } from '@/lib/tracking';

interface Params {
  params: Promise<{ code: string }>;
}

// GET /api/parcels/[code] - Détails d'un colis
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { code } = await params;
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer le colis avec ses relations
    const { data: parcel, error } = await supabase
      .from('parcels')
      .select(`
        *,
        agency:agencies(*),
        confirmation:confirmations(*),
        delivery:deliveries(*),
        notifications(*)
      `)
      .eq('code', code)
      .single();

    if (error || !parcel) {
      return NextResponse.json({ error: 'Colis non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ data: parcel });
  } catch (error) {
    console.error('Error in GET /api/parcels/[code]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/parcels/[code] - Mettre à jour le statut
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { code } = await params;
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Valider les données
    const body = await request.json();
    const validatedData = updateParcelStatusSchema.parse(body);

    // Récupérer le colis actuel
    const { data: currentParcel, error: fetchError } = await supabase
      .from('parcels')
      .select('id, status')
      .eq('code', code)
      .single();

    if (fetchError || !currentParcel) {
      return NextResponse.json({ error: 'Colis non trouvé' }, { status: 404 });
    }

    const oldStatus = currentParcel.status;

    // Mettre à jour
    const { data: parcel, error: updateError } = await supabase
      .from('parcels')
      .update({ status: validatedData.status })
      .eq('code', code)
      .select('*, agency:agencies(*)')
      .single();

    if (updateError) {
      console.error('Error updating parcel:', updateError);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    // Tracker le changement de statut
    await trackStatusChange(currentParcel.id, oldStatus, validatedData.status, user.id);

    return NextResponse.json({ data: parcel });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides', details: error }, { status: 400 });
    }
    console.error('Error in PATCH /api/parcels/[code]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
