import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/stats - Stats du dashboard
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Récupérer les stats en parallèle
    const [
      arrivedTodayResult,
      pendingResult,
      inDeliveryResult,
      deliveredTodayResult,
      totalResult,
    ] = await Promise.all([
      // Arrivés aujourd'hui
      supabase
        .from('parcels')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`),
      
      // En attente
      supabase
        .from('parcels')
        .select('id', { count: 'exact', head: true })
        .in('status', ['ARRIVÉ', 'EN_ATTENTE']),
      
      // En livraison
      supabase
        .from('parcels')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'EN_LIVRAISON'),
      
      // Livrés/Retirés aujourd'hui
      supabase
        .from('parcels')
        .select('id', { count: 'exact', head: true })
        .in('status', ['LIVRÉ', 'RETIRÉ'])
        .gte('updated_at', `${today}T00:00:00`)
        .lt('updated_at', `${today}T23:59:59`),
      
      // Total
      supabase
        .from('parcels')
        .select('id', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      data: {
        arrived_today: arrivedTodayResult.count || 0,
        pending: pendingResult.count || 0,
        in_delivery: inDeliveryResult.count || 0,
        delivered_today: deliveredTodayResult.count || 0,
        total_parcels: totalResult.count || 0,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
