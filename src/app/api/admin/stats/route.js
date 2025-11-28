import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import moment from 'moment';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

// Protégé par le middleware /api/admin/*
export async function GET() {
    const client = await pool.connect();

    try {
        const queries = [
            // [0] Revenu Total
            client.query(`
                SELECT 
                    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'succeeded') +
                    (SELECT COALESCE(SUM(c.price), 0) FROM user_courses uc JOIN courses c ON uc."courseId" = c.id WHERE uc.status = 'accepté')
                as total_revenue;
            `),

            // [1] Clients Actifs (acheteurs uniques)
            client.query(`
                SELECT COUNT(DISTINCT "userId") FROM (
                    SELECT "userId" FROM user_courses WHERE status = 'accepté'
                    UNION
                    SELECT "userId" FROM appointments WHERE status IN ('confirmé', 'terminé')
                ) as active_users;
            `),

            // [2] Total Formations Vendues
            client.query(`SELECT COUNT(*) FROM user_courses WHERE status = 'accepté'`),

            // [3] Total des Clients Inscrits
            client.query(`SELECT COUNT(*) FROM users WHERE role = 'CLIENT'`),

            // [4] Top 5 Formations
            client.query(`
                SELECT c.title, COUNT(uc.id) as sales_count
                FROM user_courses uc
                JOIN courses c ON uc."courseId" = c.id
                WHERE uc.status = 'accepté'
                GROUP BY c.title
                ORDER BY sales_count DESC
                LIMIT 5;
            `),

            // [5] Revenus par Mois (sur les 6 derniers mois)
            client.query(`
                WITH monthly_revenues AS (
                    -- Agréger les revenus des deux sources
                    SELECT 
                        DATE_TRUNC('month', p.created_at) as month,
                        SUM(p.amount) as revenue
                    FROM payments p
                    WHERE p.status = 'succeeded'
                    GROUP BY month
                    
                    UNION ALL
                    
                    SELECT 
                        DATE_TRUNC('month', uc.purchased_at) as month,
                        SUM(c.price) as revenue
                    FROM user_courses uc
                    JOIN courses c ON uc."courseId" = c.id
                    WHERE uc.status = 'accepté'
                    GROUP BY month
                )
                SELECT 
                    DATE_TRUNC('month', month) as final_month,
                    SUM(revenue) as monthly_total
                FROM monthly_revenues
                WHERE month >= DATE_TRUNC('month', NOW() - INTERVAL '5 months') -- 5 mois en arrière + le mois actuel = 6 mois
                GROUP BY final_month
                ORDER BY final_month ASC;
            `),
        ];

        const results = await Promise.all(queries);

        // --- Traitement des données pour la réponse ---

        // Indicateurs Clés
        const totalRevenue = parseFloat(results[0].rows[0].total_revenue).toFixed(2);
        const activeClients = parseInt(results[1].rows[0].count, 10);
        const coursesSold = parseInt(results[2].rows[0].count, 10);
        const totalClients = parseInt(results[3].rows[0].count, 10);
        const conversionRate = totalClients > 0 ? ((activeClients / totalClients) * 100).toFixed(1) : "0.0";

        // Top 5 Formations (pour liste et graphique)
        const topCoursesData = results[4].rows;
        const topCoursesChart = {
            labels: topCoursesData.map(c => c.title),
            data: topCoursesData.map(c => parseInt(c.sales_count, 10)),
        };

        // Revenus par Mois (pour graphique)
        const monthlyRevenueData = results[5].rows;
        const lastSixMonths = [];
        const monthlyRevenueChart = {
            labels: [],
            data: [],
        };
        // Préparer les 6 derniers mois pour s'assurer qu'il n'y a pas de trous
        for (let i = 5; i >= 0; i--) {
            lastSixMonths.push(moment().subtract(i, 'months'));
        }
        lastSixMonths.forEach(month => {
            monthlyRevenueChart.labels.push(month.format('MMMM')); // ex: "novembre"
            const monthData = monthlyRevenueData.find(row => 
                moment(row.final_month).isSame(month, 'month')
            );
            monthlyRevenueChart.data.push(monthData ? parseFloat(monthData.monthly_total) : 0);
        });

        // --- Assemblage de la réponse finale ---
        const responseData = {
            keyMetrics: {
                totalRevenue: `${totalRevenue}€`,
                activeClients,
                coursesSold,
                conversionRate: `${conversionRate}%`,
            },
            topCourses: {
                list: topCoursesData,
                chart: topCoursesChart,
            },
            monthlyRevenue: {
                chart: monthlyRevenueChart,
            }
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error("Erreur API GET /admin/stats:", error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}