import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createParcelSchema, parcelQuerySchema } from '@/lib/validations';
import { trackParcelCreated } from '@/lib/tracking';

// GET /api/parcels - Liste des colis
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Parser les query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = parcelQuerySchema.parse(searchParams);

    // Construire la requête
    let dbQuery = supabase
      .from('parcels')
      .select('*, agency:agencies(*), confirmation:confirmations(*)', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Filtre par statut
    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status);
    }

    // Recherche par code ou nom
    if (query.search) {
      dbQuery = dbQuery.or(`code.ilike.%${query.search}%,recipient_name.ilike.%${query.search}%,recipient_phone.ilike.%${query.search}%`);
    }

    // Pagination
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;
    dbQuery = dbQuery.range(from, to);

    const { data, error, count } = await dbQuery;

    if (error) {
      console.error('Error fetching parcels:', error);
      return NextResponse.json({ error: 'Erreur lors de la récupération des colis' }, { status: 500 });
    }

    return NextResponse.json({
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / query.limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/parcels:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/parcels - Créer un colis
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer l'utilisateur et son agence
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.agency_id) {
      return NextResponse.json({ error: 'Utilisateur non configuré' }, { status: 403 });
    }

    // Valider les données
    const body = await request.json();
    const validatedData = createParcelSchema.parse(body);

    // Vérifier si le code existe déjà pour cette agence
    const { data: existingParcel } = await supabase
      .from('parcels')
      .select('id')
      .eq('code', validatedData.code)
      .eq('agency_id', userData.agency_id)
      .single();

    if (existingParcel) {
      return NextResponse.json({ error: 'Un colis avec ce code existe déjà' }, { status: 409 });
    }

    // Créer le colis
    const { data: parcel, error: insertError } = await supabase
      .from('parcels')
      .insert({
        ...validatedData,
        agency_id: userData.agency_id,
        created_by: user.id,
        status: 'ARRIVÉ',
      })
      .select('*, agency:agencies(*)')
      .single();

    if (insertError) {
      console.error('Error creating parcel:', insertError);
      return NextResponse.json({ error: 'Erreur lors de la création du colis' }, { status: 500 });
    }

    // Tracker l'événement
    await trackParcelCreated(parcel.id, parcel.code, user.id, userData.agency_id);

    return NextResponse.json({ data: parcel }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides', details: error }, { status: 400 });
    }
    console.error('Error in POST /api/parcels:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
