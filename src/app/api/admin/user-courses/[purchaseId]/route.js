import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { sendCourseStatusEmail } from '@/lib/mail';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

// Protégé par le middleware /api/admin/*
export async function PUT(request, { params }) {
    const { purchaseId } = await params;
    const { status } = await request.json();
    const normalizedStatus = status === 'annulé' ? 'refusé' : status;

    if (!normalizedStatus || (normalizedStatus !== 'accepté' && normalizedStatus !== 'refusé')) {
        return NextResponse.json({ message: "Statut invalide. Utilisez 'accepté' ou 'refusé'." }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        const result = await client.query(
            `UPDATE user_courses SET status = $1 WHERE id = $2 RETURNING *`,
            [normalizedStatus, purchaseId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ message: "Achat de formation non trouvé." }, { status: 404 });
        }

        const detailsResult = await client.query(
            `SELECT u.email, u.name as client_name, c.title as course_title
             FROM user_courses uc
             JOIN users u ON u.id = uc."userId"
             JOIN courses c ON c.id = uc."courseId"
             WHERE uc.id = $1`,
            [purchaseId]
        );

        if (detailsResult.rows.length > 0) {
            const details = detailsResult.rows[0];
            await sendCourseStatusEmail({
                to: details.email,
                clientName: details.client_name,
                courseTitle: details.course_title,
                status: normalizedStatus,
            });
        }
        
        return NextResponse.json({ message: "Statut de la formation mis à jour.", status: normalizedStatus });
        
    } catch (error) {
        console.error(`Erreur API PUT /admin/user-courses/${purchaseId}:`, error);
        return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}
