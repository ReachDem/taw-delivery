// ============================================
// API: Users Management (Admin Only)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { createUserSchema } from '@/lib/validations';

/**
 * GET /api/users - Liste des utilisateurs
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Vérifier que l'utilisateur est admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé - Admin uniquement' },
        { status: 403 }
      );
    }
    
    // Récupérer les paramètres de recherche
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const agency_id = searchParams.get('agency_id');
    const role = searchParams.get('role');
    
    // Utiliser le service role pour voir tous les utilisateurs
    const serviceClient = createServiceClient();
    let query = serviceClient
      .from('users')
      .select('*, agency:agencies(id, name, country)')
      .order('created_at', { ascending: false });
    
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    if (agency_id) {
      query = query.eq('agency_id', agency_id);
    }
    
    if (role) {
      query = query.eq('role', role);
    }
    
    const { data: users, error } = await query;
    
    if (error) {
      console.error('Erreur liste users:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des utilisateurs' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Erreur GET /api/users:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users - Créer un utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Vérifier que l'utilisateur est admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé - Admin uniquement' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Valider les données
    const validationResult = createUserSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }
    
    const { email, password, full_name, phone, role, agency_id } = validationResult.data;
    
    // Utiliser le service role client pour créer l'utilisateur
    const serviceClient = createServiceClient();
    
    // Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmer l'email automatiquement
      user_metadata: {
        full_name,
      },
    });
    
    if (authError) {
      console.error('Erreur création auth user:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }
    
    // Le trigger handle_new_user devrait créer l'entrée dans la table users
    // Mais on met à jour les infos supplémentaires
    const { error: updateError } = await serviceClient
      .from('users')
      .update({
        full_name,
        phone,
        role,
        agency_id,
      })
      .eq('id', authData.user.id);
    
    if (updateError) {
      console.error('Erreur mise à jour user:', updateError);
      // L'utilisateur auth existe, on ne le supprime pas
    }
    
    // Récupérer l'utilisateur créé
    const { data: newUser } = await serviceClient
      .from('users')
      .select('*, agency:agencies(id, name, country)')
      .eq('id', authData.user.id)
      .single();
    
    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/users:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
