import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

// Protégé par le middleware /api/admin/*
export async function PUT(request, { params }) {
    const { purchaseId } = params;
    const { status } = await request.json();

    if (!status || (status !== 'accepté' && status !== 'annulé')) {
        return NextResponse.json({ message: "Statut invalide. Utilisez 'accepté' ou 'annulé'." }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        const result = await client.query(
            `UPDATE user_courses SET status = $1 WHERE id = $2 RETURNING *`,
            [status, purchaseId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ message: "Achat de formation non trouvé." }, { status: 404 });
        }

        // TODO: Envoyer une notification par email au client
        
        return NextResponse.json({ message: "Statut de la formation mis à jour." });
        
    } catch (error) {
        console.error(`Erreur API PUT /admin/user-courses/${purchaseId}:`, error);
        return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}