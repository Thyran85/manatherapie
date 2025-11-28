import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

// --- FONCTION GET : Pour récupérer les données du profil de l'utilisateur connecté ---
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

    const client = await pool.connect();
    try {
        const result = await client.query(
            'SELECT name, email, phone, address, newsletter_subscribed, reminders_subscribed FROM users WHERE id = $1',
            [session.user.id]
        );
        if (result.rows.length === 0) return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
        
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error("Erreur API GET /api/profile:", error);
        return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 });
    } finally {
        client.release();
    }
}

// --- FONCTION PUT : Pour mettre à jour les informations du profil ---
export async function PUT(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

    const { name, email, phone, address } = await request.json();

    if (!name || !email) {
        return NextResponse.json({ message: "Le nom et l'email sont requis." }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        await client.query(
            'UPDATE users SET name = $1, email = $2, phone = $3, address = $4 WHERE id = $5',
            [name, email, phone, address, session.user.id]
        );
        return NextResponse.json({ message: "Profil mis à jour avec succès." });
    } catch (error) {
        if (error.code === '23505') { // Gérer l'erreur d'email dupliqué
            return NextResponse.json({ message: "Cet email est déjà utilisé par un autre compte." }, { status: 409 });
        }
        console.error("Erreur API PUT /api/profile:", error);
        return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 });
    } finally {
        client.release();
    }
}