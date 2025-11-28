import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

/**
 * @description Lister les articles de blog pour l'affichage public.
 * @method GET
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    // On peut ajouter une limite pour la page d'accueil, par exemple
    const limit = searchParams.get('limit');
    
    const client = await pool.connect();
    try {
        // On sélectionne les champs nécessaires pour l'aperçu (pas le contenu complet)
        let query = `
            SELECT 
                id, 
                title, 
                slug, 
                category, 
                image_url,
                excerpt,
                published_at
            FROM blog_posts
            ORDER BY published_at DESC
        `;

        const queryParams = [];
        
        if (limit && !isNaN(parseInt(limit))) {
            query += ` LIMIT $1`;
            queryParams.push(parseInt(limit));
        }

        const { rows } = await client.query(query, queryParams);
        return NextResponse.json(rows);

    } catch (error) {
        console.error("Erreur API GET /api/blog:", error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}