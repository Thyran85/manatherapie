import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

// Protégé par le middleware /api/admin/*
export async function GET() {
    const client = await pool.connect();

    try {
        // === ÉTAPE 1: TÂCHES DE NETTOYAGE AUTOMATIQUE ===
        // On utilise une transaction pour s'assurer que si une mise à jour échoue, rien n'est appliqué.
        await client.query('BEGIN');

        // Annuler les RDV "en attente" dont la date est passée
        await client.query(`
            UPDATE appointments SET status = 'annulé'
            WHERE status = 'en attente' AND start_time < NOW()
        `);

        // Marquer comme "terminé" les RDV "confirmés" dont la date de fin est passée
        await client.query(`
            UPDATE appointments SET status = 'terminé'
            WHERE status = 'confirmé' AND end_time < NOW()
        `);
        
        await client.query('COMMIT');

        // === ÉTAPE 2: RÉCUPÉRATION DES DONNÉES EN PARALLÈLE ===
        // Utiliser Promise.all pour exécuter toutes les requêtes de lecture simultanément pour de meilleures performances.

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const queries = [
            // [0] Calcul des Revenus (30j)
            client.query(
                `SELECT 
                    (
                        -- Revenus des RDV basés sur les paiements réussis
                        SELECT COALESCE(SUM(p.amount), 0) FROM payments p
                        JOIN appointments a ON p."appointmentId" = a.id
                        WHERE p.status = 'succeeded' AND p.created_at >= $1
                    ) + (
                        -- Revenus des formations acceptées
                        SELECT COALESCE(SUM(c.price), 0) FROM user_courses uc
                        JOIN courses c ON uc."courseId" = c.id
                        WHERE uc.status = 'accepté' AND uc.purchased_at >= $1
                    ) as total_revenue;`,
                [thirtyDaysAgo]
            ),
            // [1] Nouveaux Clients (30j)
            client.query(
                `SELECT COUNT(*) FROM users WHERE role = 'CLIENT' AND created_at >= $1`, 
                [thirtyDaysAgo]
            ),
            // [2] Nombre de RDV en attente
            client.query(`SELECT COUNT(*) FROM appointments WHERE status = 'en attente'`),
            // [3] Formations vendues (30j)
            client.query(
                `SELECT COUNT(*) FROM user_courses WHERE purchased_at >= $1`, 
                [thirtyDaysAgo]
            ),
            // [4] Liste des RDV pour "Actions Rapides" (les 3 plus urgents)
            client.query(`
                SELECT a.id, s.title as service, u.name as "clientName", a.start_time as date
                FROM appointments a
                JOIN services s ON a."serviceId" = s.id
                JOIN users u ON a."userId" = u.id
                WHERE a.status = 'en attente'
                ORDER BY a.start_time ASC
                LIMIT 3;
            `),
            // [5] Liste des RDV à venir (les 5 prochains confirmés)
            client.query(`
                SELECT a.id, s.title as service, u.name as "clientName", a.start_time as date, a.status
                FROM appointments a
                JOIN services s ON a."serviceId" = s.id
                JOIN users u ON a."userId" = u.id
                WHERE a.status = 'confirmé' AND a.start_time > NOW()
                ORDER BY a.start_time ASC
                LIMIT 5;
            `),
            // [6] Activité Récente (les 5 derniers événements)
            client.query(`
                SELECT 'new_purchase' as type, c.title as "primaryText", u.name as "secondaryText", uc.purchased_at as timestamp
                FROM user_courses uc
                JOIN courses c ON uc."courseId" = c.id
                JOIN users u ON uc."userId" = u.id
                
                UNION ALL
                
                SELECT 'new_client' as type, u.name as "primaryText", null as "secondaryText", u.created_at as timestamp
                FROM users u
                WHERE u.role = 'CLIENT'
                
                ORDER BY timestamp DESC
                LIMIT 5;
            `)
        ];

        const results = await Promise.all(queries);

        // === ÉTAPE 3: FORMATAGE DE LA RÉPONSE JSON ===
        const dashboardData = {
            stats: {
                revenue: parseFloat(results[0].rows[0].total_revenue).toFixed(2),
                newClients: parseInt(results[1].rows[0].count, 10),
                pendingAppointments: parseInt(results[2].rows[0].count, 10),
                coursesSold: parseInt(results[3].rows[0].count, 10),
            },
            quickActions: {
                pendingAppointments: results[4].rows
            },
            upcomingAppointments: results[5].rows,
            recentActivity: results[6].rows
        };

        return NextResponse.json(dashboardData);

    } catch (error) {
        // En cas d'erreur, annuler la transaction si elle était en cours
        await client.query('ROLLBACK');
        console.error("Erreur API GET /admin/dashboard:", error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}