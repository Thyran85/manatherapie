import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

// Protégé par le middleware /api/admin/*
export async function POST(request, { params }) {
    const { id: userId } = params;
    const { message } = await request.json();

    if (!message || message.trim().length === 0) {
        return NextResponse.json({ message: "Le message ne peut pas être vide." }, { status: 400 });
    }

    const clientDB = await pool.connect();
    try {
        // Insérer la notification dans la base de données
        await clientDB.query(
            'INSERT INTO notifications ("userId", message, link, read) VALUES ($1, $2, $3, false)',
            [userId, message, '/compte/notifications'] // Lien générique
        );

        return NextResponse.json({ message: "Notification envoyée avec succès." });
        
    } catch (error) {
        console.error(`Erreur API POST /admin/clients/${userId}/notify:`, error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        clientDB.release();
    }
}