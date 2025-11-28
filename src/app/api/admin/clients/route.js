import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

// Protégé par le middleware /api/admin/*
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'date_desc'; // 'name_asc', 'name_desc', 'date_asc'

    const clientDB = await pool.connect();
    try {
        let query = `
            SELECT
                u.id,
                u.name,
                u.email,
                u.created_at,
                COALESCE(rdv_stats.confirmed_count, 0) as confirmed_appointments,
                COALESCE(rdv_stats.pending_count, 0) as pending_appointments,
                COALESCE(course_stats.accepted_count, 0) as accepted_courses,
                COALESCE(course_stats.pending_count, 0) as pending_courses
            FROM users u
            -- Sous-requête pour les statistiques des rendez-vous
            LEFT JOIN (
                SELECT "userId",
                    COUNT(*) FILTER (WHERE status = 'confirmé') as confirmed_count,
                    COUNT(*) FILTER (WHERE status = 'en attente') as pending_count
                FROM appointments
                GROUP BY "userId"
            ) as rdv_stats ON u.id = rdv_stats."userId"
            -- Sous-requête pour les statistiques des formations
            LEFT JOIN (
                SELECT "userId",
                    COUNT(*) FILTER (WHERE status = 'accepté') as accepted_count,
                    COUNT(*) FILTER (WHERE status = 'en attente') as pending_count
                FROM user_courses
                GROUP BY "userId"
            ) as course_stats ON u.id = course_stats."userId"
            WHERE u.role = 'CLIENT' AND (u.name ILIKE $1 OR u.email ILIKE $1)
        `;

        const queryParams = [`%${search}%`];
        
        switch (sortBy) {
            case 'name_asc': query += ' ORDER BY u.name ASC'; break;
            case 'name_desc': query += ' ORDER BY u.name DESC'; break;
            case 'date_asc': query += ' ORDER BY u.created_at ASC'; break;
            case 'date_desc':
            default: query += ' ORDER BY u.created_at DESC'; break;
        }

        const { rows } = await clientDB.query(query, queryParams);

        return NextResponse.json(rows);

    } catch (error) {
        console.error("Erreur API GET /admin/clients:", error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        clientDB.release();
    }
}