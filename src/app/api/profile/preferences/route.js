import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

export async function PUT(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

    const { key, value } = await request.json();
    
    // Sécurité : on s'assure que seules les colonnes autorisées peuvent être modifiées
    const allowedColumns = ['newsletter_subscribed', 'reminders_subscribed'];
    if (!allowedColumns.includes(key) || typeof value !== 'boolean') {
        return NextResponse.json({ message: "Données invalides." }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        // On utilise une requête paramétrée sécurisée pour le nom de la colonne
        await client.query(
            `UPDATE users SET "${key}" = $1 WHERE id = $2`,
            [value, session.user.id]
        );
        return NextResponse.json({ message: "Préférences mises à jour." });
    } catch (error) {
        console.error("Erreur API PUT /api/profile/preferences:", error);
        return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 });
    } finally {
        client.release();
    }
}