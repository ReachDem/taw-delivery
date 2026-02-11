import prisma from '../lib/prisma';

async function cleanupTestAgencies() {
    console.log('🧹 Nettoyage des agences de test...\n');

    try {
        // Liste toutes les agences actuelles
        const agencies = await prisma.agency.findMany({
            include: {
                _count: {
                    select: {
                        agents: true,
                        drivers: true,
                        orders: true,
                    },
                },
            },
        });

        console.log(`📊 Agences trouvées : ${agencies.length}\n`);

        for (const agency of agencies) {
            console.log(`\n🏢 ${agency.name} (${agency.city})`);
            console.log(`   - Agents: ${agency._count.agents}`);
            console.log(`   - Livreurs: ${agency._count.drivers}`);
            console.log(`   - Commandes: ${agency._count.orders}`);
        }

        // Supprimer toutes les agences de test
        console.log('\n\n🗑️  Suppression des agences de test...\n');

        const deleted = await prisma.agency.deleteMany({});

        console.log(`✅ ${deleted.count} agence(s) supprimée(s)\n`);
        console.log('✨ Base de données nettoyée !\n');
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

cleanupTestAgencies()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
