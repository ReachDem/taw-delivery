// ============================================
// API: User Management by ID (Admin Only)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { updateUserSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/users/[id] - Récupérer un utilisateur
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    
    const serviceClient = createServiceClient();
    const { data: targetUser, error } = await serviceClient
      .from('users')
      .select('*, agency:agencies(id, name, country)')
      .eq('id', id)
      .single();
    
    if (error || !targetUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }
    
    return NextResponse.json({ user: targetUser });
  } catch (error) {
    console.error('Erreur GET /api/users/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * PATCH /api/users/[id] - Modifier un utilisateur
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Valider les données
    const validationResult = updateUserSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }
    
    const serviceClient = createServiceClient();
    
    const { data: updatedUser, error } = await serviceClient
      .from('users')
      .update(validationResult.data)
      .eq('id', id)
      .select('*, agency:agencies(id, name, country)')
      .single();
    
    if (error) {
      console.error('Erreur mise à jour user:', error);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }
    
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Erreur PATCH /api/users/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/users/[id] - Désactiver un utilisateur
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Vérifier que l'utilisateur est admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    // Ne pas permettre de se supprimer soi-même
    if (user.id === id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas vous supprimer vous-même' },
        { status: 400 }
      );
    }
    
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    
    const serviceClient = createServiceClient();
    
    // Désactiver plutôt que supprimer
    const { error } = await serviceClient
      .from('users')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) {
      console.error('Erreur désactivation user:', error);
      return NextResponse.json({ error: 'Erreur lors de la désactivation' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE /api/users/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
