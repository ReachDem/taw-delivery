import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDeliverySchema } from '@/lib/validations';

// GET /api/deliveries - Liste des livraisons
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Parser les query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const driverId = searchParams.get('driver_id');

    // Construire la requête
    let query = supabase
      .from('deliveries')
      .select(`
        *,
        parcel:parcels(*, agency:agencies(*)),
        driver:users(*),
        slot:delivery_slots(*)
      `)
      .order('scheduled_date', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    if (date) {
      query = query.eq('scheduled_date', date);
    }

    if (driverId) {
      query = query.eq('driver_id', driverId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching deliveries:', error);
      return NextResponse.json({ error: 'Erreur lors de la récupération des livraisons' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/deliveries:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/deliveries - Créer une livraison
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Valider les données
    const body = await request.json();
    const validatedData = createDeliverySchema.parse(body);

    // Créer la livraison
    const { data: delivery, error: insertError } = await supabase
      .from('deliveries')
      .insert({
        ...validatedData,
        status: 'programmée',
      })
      .select('*, parcel:parcels(*), driver:users(*)')
      .single();

    if (insertError) {
      console.error('Error creating delivery:', insertError);
      return NextResponse.json({ error: 'Erreur lors de la création de la livraison' }, { status: 500 });
    }

    // Mettre à jour le statut du colis
    await supabase
      .from('parcels')
      .update({ status: 'EN_LIVRAISON' })
      .eq('id', validatedData.parcel_id);

    return NextResponse.json({ data: delivery }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides', details: error }, { status: 400 });
    }
    console.error('Error in POST /api/deliveries:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
