import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

// Protégé par le middleware /api/admin/*
export async function GET(request, { params }) {
    const { id } = await params;
    const clientDB = await pool.connect();
    try {
        // 1. Récupérer les informations du client
        const userResult = await clientDB.query('SELECT id, name, email, created_at FROM users WHERE id = $1 AND role = \'CLIENT\'', [id]);
        if (userResult.rows.length === 0) {
            return NextResponse.json({ message: "Client non trouvé." }, { status: 404 });
        }
        const userProfile = userResult.rows[0];

        // 2. Récupérer les rendez-vous du client
        const appointmentsResult = await clientDB.query(
            `SELECT a.id, a.start_time, a.status, s.title, s.type
             FROM appointments a
             JOIN services s ON a."serviceId" = s.id
             WHERE a."userId" = $1
             ORDER BY a.start_time DESC`,
            [id]
        );

        // 3. Récupérer les formations du client
        const coursesResult = await clientDB.query(
            `SELECT uc.id as purchase_id, uc.status, c.id as course_id, c.title
             FROM user_courses uc
             JOIN courses c ON uc."courseId" = c.id
             WHERE uc."userId" = $1
             ORDER BY uc.purchased_at DESC`,
            [id]
        );

        const responseData = {
            profile: userProfile,
            appointments: appointmentsResult.rows,
            courses: coursesResult.rows,
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error(`Erreur API GET /admin/clients/${id}:`, error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        clientDB.release();
    }
}
