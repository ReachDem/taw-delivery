// ============================================
// API: Agencies Management (Admin Only)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { createAgencySchema } from '@/lib/validations';

/**
 * GET /api/agencies - Liste des agences
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    // Récupérer les paramètres de recherche
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';
    
    const serviceClient = createServiceClient();
    let query = serviceClient
      .from('agencies')
      .select('*')
      .order('name', { ascending: true });
    
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    const { data: agencies, error } = await query;
    
    if (error) {
      console.error('Erreur liste agencies:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des agences' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ agencies });
  } catch (error) {
    console.error('Erreur GET /api/agencies:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST /api/agencies - Créer une agence
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Vérifier que l'utilisateur est admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé - Admin uniquement' }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Valider les données
    const validationResult = createAgencySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }
    
    const serviceClient = createServiceClient();
    
    const { data: agency, error } = await serviceClient
      .from('agencies')
      .insert(validationResult.data)
      .select()
      .single();
    
    if (error) {
      console.error('Erreur création agence:', error);
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
    }
    
    return NextResponse.json({ agency }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/agencies:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
