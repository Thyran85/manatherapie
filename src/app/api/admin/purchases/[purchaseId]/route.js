import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { sendCourseStatusEmail } from '@/lib/mail';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

/**
 * @description Mettre à jour le statut d'un achat (accepter/refuser).
 * @method PUT
 */
export async function PUT(request, { params }) {
    

    const { purchaseId } = await params;
    const { status } = await request.json();
    const normalizedStatus = status === 'annulé' ? 'refusé' : status;

    // 2. Validation des données
    if (!purchaseId || !normalizedStatus) {
        return NextResponse.json({ message: "ID de l'achat et statut requis." }, { status: 400 });
    }

    if (normalizedStatus !== 'accepté' && normalizedStatus !== 'refusé') {
        return NextResponse.json({ message: "Statut invalide." }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        // 3. Mettre à jour la base de données
        const query = `
            UPDATE user_courses
            SET status = $1
            WHERE id = $2
            RETURNING *;
        `;
        
        const result = await client.query(query, [normalizedStatus, purchaseId]);

        if (result.rows.length === 0) {
            return NextResponse.json({ message: "Achat non trouvé." }, { status: 404 });
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

        return NextResponse.json(result.rows[0]);

    } catch (error) {
        console.error(`Erreur API PUT /admin/purchases/${purchaseId}:`, error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}
