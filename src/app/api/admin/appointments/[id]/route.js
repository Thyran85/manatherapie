import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

// Protégée par le middleware /api/admin/*
export async function PUT(request, { params }) {
    const { id } = params;
    const body = await request.json();
    const { status, meet_link } = body;

    if (!status && !meet_link) {
        return NextResponse.json({ message: "Aucune action spécifiée (statut ou lien manquant)." }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let updatedAppointment;

        if (status) {
            // Logique existante pour mettre à jour le statut
            if (status !== 'confirmé' && status !== 'annulé') {
                return NextResponse.json({ message: "Statut invalide. Utilisez 'confirmé' ou 'annulé'." }, { status: 400 });
            }
            const result = await client.query(
                `UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *`,
                [status, id]
            );
            if (result.rows.length === 0) throw new Error("Rendez-vous non trouvé.");
            updatedAppointment = result.rows[0];
            
            // TODO: Envoyer une notification par email pour le changement de statut

        } else if (meet_link) {
            // Nouvelle logique pour ajouter le lien de la réunion
            const result = await client.query(
                `UPDATE appointments SET meet_link = $1 WHERE id = $2 RETURNING *`,
                [meet_link, id]
            );
            if (result.rows.length === 0) throw new Error("Rendez-vous non trouvé.");
            updatedAppointment = result.rows[0];

            // Créer une notification interne pour le client
            const serviceInfo = await client.query(
                `SELECT s.title FROM services s JOIN appointments a ON s.id = a."serviceId" WHERE a.id = $1`,
                [id]
            );
            const message = `Le lien pour votre session "${serviceInfo.rows[0].title}" est maintenant disponible.`;
            await client.query(
                'INSERT INTO notifications ("userId", message, link, read) VALUES ($1, $2, $3, false)',
                [updatedAppointment.userId, message, '/compte/rendez-vous']
            );
            
            // TODO: Envoyer une notification par email au client avec le lien
        }

        await client.query('COMMIT');
        return NextResponse.json(updatedAppointment);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Erreur API PUT /admin/appointments/${id}:`, error);
        return NextResponse.json({ message: error.message || "Erreur serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}