// ============================================
// TAW DELIVERY - Script de Seed
// ============================================
// 
// Ce script crée les données initiales:
// - Les agences (France, Belgique, Cameroun)
// - Un super-admin (premier utilisateur)
//
// Usage: npx tsx scripts/seed.ts
//
// Prérequis:
// - Variables d'environnement configurées (.env)
// - Base de données Supabase avec le schéma déployé
// ============================================

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('   Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définis');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Données initiales
const AGENCIES = [
  {
    name: 'TAW France',
    country: 'France',
    city: 'Paris',
    address: '123 Avenue des Champs-Élysées',
    phone: '+33 1 23 45 67 89',
    email: 'france@taw-delivery.com',
  },
  {
    name: 'TAW Belgique',
    country: 'Belgique',
    city: 'Bruxelles',
    address: '45 Grand Place',
    phone: '+32 2 345 67 89',
    email: 'belgique@taw-delivery.com',
  },
  {
    name: 'TAW Cameroun',
    country: 'Cameroun',
    city: 'Douala',
    address: '78 Boulevard de la Liberté',
    phone: '+237 6 99 88 77 66',
    email: 'cameroun@taw-delivery.com',
  },
];

// Configuration du premier admin
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@taw-delivery.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Super Admin';

async function seed() {
  console.log('🌱 Démarrage du seed TAW Delivery...\n');

  try {
    // 1. Créer les agences
    console.log('📦 Création des agences...');
    
    const { data: existingAgencies } = await supabase
      .from('agencies')
      .select('name');
    
    const existingNames = new Set(existingAgencies?.map(a => a.name) || []);
    
    const agenciesToCreate = AGENCIES.filter(a => !existingNames.has(a.name));
    
    if (agenciesToCreate.length > 0) {
      const { data: agencies, error: agencyError } = await supabase
        .from('agencies')
        .insert(agenciesToCreate)
        .select();
      
      if (agencyError) {
        throw new Error(`Erreur création agences: ${agencyError.message}`);
      }
      
      console.log(`   ✅ ${agencies?.length || 0} agence(s) créée(s)`);
    } else {
      console.log('   ⏭️  Les agences existent déjà');
    }

    // 2. Récupérer la première agence pour l'admin
    const { data: allAgencies } = await supabase
      .from('agencies')
      .select('id, name')
      .order('created_at', { ascending: true })
      .limit(1);
    
    if (!allAgencies || allAgencies.length === 0) {
      throw new Error('Aucune agence trouvée');
    }
    
    const defaultAgencyId = allAgencies[0].id;
    console.log(`   📍 Agence par défaut: ${allAgencies[0].name}`);

    // 3. Vérifier si l'admin existe déjà
    console.log('\n👤 Création du super-admin...');
    
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', ADMIN_EMAIL)
      .single();
    
    if (existingUser) {
      console.log(`   ⚡ L'admin ${ADMIN_EMAIL} existe, mise à jour...`);
      // S'assurer que l'admin est bien actif et a le bon rôle
      const { error: updateExistingError } = await supabase
        .from('users')
        .update({
          role: 'admin',
          is_active: true,
        })
        .eq('id', existingUser.id);
      
      if (updateExistingError) {
        console.warn(`   ⚠️  Avertissement: ${updateExistingError.message}`);
      } else {
        console.log(`   ✅ Admin mis à jour et activé`);
      }
    } else {
      // Vérifier si l'utilisateur existe dans auth mais pas dans la table users
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const existingAuthUser = authUsers?.users?.find(u => u.email === ADMIN_EMAIL);
      
      if (existingAuthUser) {
        // L'utilisateur auth existe, créer/mettre à jour le profil
        console.log(`   ⚡ Utilisateur auth existant, mise à jour du profil...`);
        const { error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: existingAuthUser.id,
            email: ADMIN_EMAIL,
            full_name: ADMIN_NAME,
            role: 'admin',
            agency_id: defaultAgencyId,
            is_active: true,
          });
        
        if (upsertError) {
          console.warn(`   ⚠️  Avertissement: ${upsertError.message}`);
        } else {
          console.log(`   ✅ Profil admin mis à jour`);
        }
      } else {
        // Créer l'utilisateur dans Supabase Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: {
            full_name: ADMIN_NAME,
          },
        });
        
        if (authError) {
          throw new Error(`Erreur création auth: ${authError.message}`);
        }
        
        // Mettre à jour le profil utilisateur
        const { error: updateError } = await supabase
          .from('users')
          .update({
            full_name: ADMIN_NAME,
            role: 'admin',
            agency_id: defaultAgencyId,
            is_active: true,
          })
          .eq('id', authUser.user.id);
        
        if (updateError) {
          console.warn(`   ⚠️  Avertissement mise à jour profil: ${updateError.message}`);
        }
        
        console.log(`   ✅ Super-admin créé:`);
        console.log(`      Email: ${ADMIN_EMAIL}`);
        console.log(`      Mot de passe: ${ADMIN_PASSWORD}`);
      }
    }

    // 4. Créer quelques zones de livraison par défaut
    console.log('\n🗺️  Création des zones de livraison...');
    
    const { data: agencies } = await supabase
      .from('agencies')
      .select('id, name, country');
    
    for (const agency of agencies || []) {
      const { data: existingZones } = await supabase
        .from('delivery_zones')
        .select('id')
        .eq('agency_id', agency.id);
      
      if (!existingZones || existingZones.length === 0) {
        const zones = [
          { agency_id: agency.id, zone_name: 'Centre-ville', delivery_fee: 5.00 },
          { agency_id: agency.id, zone_name: 'Banlieue proche', delivery_fee: 10.00 },
          { agency_id: agency.id, zone_name: 'Banlieue lointaine', delivery_fee: 15.00 },
        ];
        
        await supabase.from('delivery_zones').insert(zones);
        console.log(`   ✅ Zones créées pour ${agency.name}`);
      }
    }

    // 5. Créer des créneaux de livraison par défaut
    console.log('\n⏰ Création des créneaux de livraison...');
    
    for (const agency of agencies || []) {
      const { data: existingSlots } = await supabase
        .from('delivery_slots')
        .select('id')
        .eq('agency_id', agency.id);
      
      if (!existingSlots || existingSlots.length === 0) {
        const slots = [];
        // Créneaux du lundi au samedi (1-6)
        for (let day = 1; day <= 6; day++) {
          slots.push(
            { agency_id: agency.id, day_of_week: day, start_time: '09:00', end_time: '12:00', max_deliveries: 10 },
            { agency_id: agency.id, day_of_week: day, start_time: '14:00', end_time: '18:00', max_deliveries: 10 }
          );
        }
        
        await supabase.from('delivery_slots').insert(slots);
        console.log(`   ✅ Créneaux créés pour ${agency.name}`);
      }
    }

    console.log('\n✅ Seed terminé avec succès!');
    console.log('\n📋 Prochaines étapes:');
    console.log('   1. Lancez l\'application: pnpm dev');
    console.log('   2. Connectez-vous avec les identifiants admin');
    console.log('   3. Créez d\'autres utilisateurs depuis la page Utilisateurs');
    
  } catch (error) {
    console.error('\n❌ Erreur lors du seed:', error);
    process.exit(1);
  }
}

// Exécuter le seed
seed();
