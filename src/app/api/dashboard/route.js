import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const userId = session.user.id;

    const client = await pool.connect();
    try {
        // Pour la performance, on lance toutes les requêtes en parallèle
        const [
            userPromise,
            nextAppointmentPromise,
            coursesCountPromise,
            activityPromise,
            invoicesPromise
        ] = [
            // 1. Récupérer le nom de l'utilisateur
            client.query('SELECT name FROM users WHERE id = $1', [userId]),

            // 2. Récupérer le prochain RDV confirmé
            client.query(`
                SELECT s.title, a.start_time, a.meet_link 
                FROM appointments a
                JOIN services s ON a."serviceId" = s.id
                WHERE a."userId" = $1 AND a.status = 'confirmé' AND a.start_time > NOW()
                ORDER BY a.start_time ASC
                LIMIT 1;
            `, [userId]),

            // 3. Compter le nombre de formations achetées (nécessite une table user_courses)
            // Pour l'instant, on simule, car nous n'avons pas encore fait la page des formations
            Promise.resolve({ rows: [{ count: 0 }] }), // Simulation

            // 4. Récupérer les 2 dernières activités (notifications)
            client.query(`
                SELECT message, created_at 
                FROM notifications
                WHERE "userId" = $1
                ORDER BY created_at DESC
                LIMIT 2;
            `, [userId]),

            // 5. Récupérer les 2 dernières factures (paiements)
            client.query(`
                SELECT id, amount, created_at 
                FROM payments
                WHERE "appointmentId" IN (SELECT id FROM appointments WHERE "userId" = $1)
                ORDER BY created_at DESC
                LIMIT 2;
            `, [userId])
        ];

        // On attend que toutes les promesses se résolvent
        const [
            userResult,
            nextAppointmentResult,
            coursesCountResult,
            activityResult,
            invoicesResult
        ] = await Promise.all([
            userPromise,
            nextAppointmentPromise,
            coursesCountPromise,
            activityPromise,
            invoicesPromise
        ]);

        // On formate les données dans un seul objet
        const dashboardData = {
            userName: userResult.rows[0]?.name.split(' ')[0] || session.user.name, // Prend le prénom
            nextAppointment: nextAppointmentResult.rows[0] || null,
            coursesCount: coursesCountResult.rows[0]?.count || 0,
            recentActivity: activityResult.rows,
            recentInvoices: invoicesResult.rows
        };

        return NextResponse.json(dashboardData);

    } catch (error) {
        console.error("Erreur API /api/dashboard:", error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}