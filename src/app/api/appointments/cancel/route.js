import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const userId = session.user.id;

    const { appointmentId } = await request.json();

    if (!appointmentId) {
        return NextResponse.json({ message: "ID de rendez-vous manquant." }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Sécurité : on vérifie que le rendez-vous appartient bien à l'utilisateur connecté
        const result = await client.query(
            `UPDATE appointments 
             SET status = 'annulé' 
             WHERE id = $1 AND "userId" = $2 AND status IN ('en attente', 'confirmé')
             RETURNING id, "serviceId", start_time`,
            [appointmentId, userId]
        );

        // Si la requête n'a rien retourné, c'est que l'utilisateur n'est pas propriétaire
        // ou que le statut ne permettait pas l'annulation.
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: "Action non autorisée ou rendez-vous non annulable." }, { status: 403 });
        }

        // Créer une notification interne pour l'utilisateur
        const { serviceId, start_time } = result.rows[0];
        const serviceRes = await client.query('SELECT title FROM services WHERE id = $1', [serviceId]);
        const serviceTitle = serviceRes.rows[0].title;
        const message = `Votre rendez-vous pour "${serviceTitle}" le ${new Date(start_time).toLocaleDateString('fr-FR')} a été annulé.`;
        await client.query(
            'INSERT INTO notifications ("userId", message, link) VALUES ($1, $2, $3)',
            [userId, message, '/compte/rendez-vous']
        );
        
        // TODO : Logique de remboursement Stripe si nécessaire
        // Par exemple: const payment = await client.query('SELECT stripe_payment_intent_id FROM payments WHERE "appointmentId" = $1', [appointmentId]);
        // if (payment.rows.length > 0) { await stripe.refunds.create({ payment_intent: payment.rows[0].stripe_payment_intent_id }); }

        await client.query('COMMIT');
        
        return NextResponse.json({ message: "Rendez-vous annulé avec succès." });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Erreur API /api/appointments/cancel:", error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}    