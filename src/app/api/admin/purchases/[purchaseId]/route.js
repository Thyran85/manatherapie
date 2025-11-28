import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

/**
 * @description Mettre à jour le statut d'un achat (accepter/refuser).
 * @method PUT
 */
export async function PUT(request, { params }) {
    

    const { purchaseId } = params;
    const { status } = await request.json(); // Le frontend enverra le nouveau statut : 'accepté' ou 'refusé'

    // 2. Validation des données
    if (!purchaseId || !status) {
        return NextResponse.json({ message: "ID de l'achat et statut requis." }, { status: 400 });
    }

    if (status !== 'accepté' && status !== 'refusé') {
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
        
        const result = await client.query(query, [status, purchaseId]);

        if (result.rows.length === 0) {
            return NextResponse.json({ message: "Achat non trouvé." }, { status: 404 });
        }

        // TODO: À l'avenir, on pourrait déclencher un email de confirmation ici pour informer le client
        // que son accès à la formation est maintenant activé.

        return NextResponse.json(result.rows[0]);

    } catch (error) {
        console.error(`Erreur API PUT /admin/purchases/${purchaseId}:`, error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}