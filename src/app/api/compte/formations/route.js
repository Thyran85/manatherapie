import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

/**
 * @description Récupérer la liste des formations achetées par l'utilisateur connecté.
 * @method GET
 */
export async function GET(request) {
    // 1. Sécurité : Vérifier la session de l'utilisateur
    const token = await getToken({ req: request, secret: authOptions.secret });

    if (!token || !token.sub) {
        // 'sub' est l'ID de l'utilisateur dans le token Next-Auth
        return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
    }
    const userId = token.sub;

    const client = await pool.connect();
    try {
        // 2. Requête SQL pour joindre les tables
        // On récupère les informations de la formation ET le statut de l'achat spécifique à cet utilisateur
        const query = `
            SELECT 
                c.id,
                c.title,
                c.slug,
                c.type,
                c.category,
                c.image_url,
                c.file_url,
                uc.status
            FROM user_courses uc
            JOIN courses c ON uc."courseId" = c.id
            WHERE uc."userId" = $1
            ORDER BY uc.purchased_at DESC;
        `;
        
        const { rows } = await client.query(query, [userId]);

        return NextResponse.json(rows);
    } catch (error) {
        console.error("Erreur API GET /compte/formations:", error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}