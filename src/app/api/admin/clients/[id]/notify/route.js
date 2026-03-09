import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { sendAdminClientNotificationEmail } from '@/lib/mail';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

// Protégé par le middleware /api/admin/*
export async function POST(request, { params }) {
    const { id: userId } = await params;
    const { message } = await request.json();

    if (!message || message.trim().length === 0) {
        return NextResponse.json({ message: "Le message ne peut pas être vide." }, { status: 400 });
    }

    const clientDB = await pool.connect();
    try {
        const userResult = await clientDB.query(
            'SELECT name, email FROM users WHERE id = $1',
            [userId]
        );
        if (userResult.rows.length === 0) {
            return NextResponse.json({ message: "Client introuvable." }, { status: 404 });
        }
        const user = userResult.rows[0];

        // Insérer la notification dans la base de données
        await clientDB.query(
            'INSERT INTO notifications ("userId", message, link) VALUES ($1, $2, $3)',
            [userId, message, '/compte/notifications'] // Lien générique
        );

        // Envoyer aussi un email au client
        await sendAdminClientNotificationEmail({
            to: user.email,
            clientName: user.name,
            message,
        });

        return NextResponse.json({ message: "Notification envoyée avec succès." });
        
    } catch (error) {
        console.error(`Erreur API POST /admin/clients/${userId}/notify:`, error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        clientDB.release();
    }
}
