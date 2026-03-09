import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

/**
 * @description Obtenir les détails publics d'un article par son slug.
 * @method GET
 */
export async function GET(request, { params }) {
    // On récupère le slug depuis les paramètres de la route dynamique
    const { slug } = await params;
    
    if (!slug) {
        return NextResponse.json({ message: "Slug manquant." }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        // On sélectionne toutes les colonnes nécessaires pour la page de l'article
        const query = `
            SELECT 
                id, title, slug, category, reading_time, image_url,
                content_html, author, published_at, excerpt
            FROM blog_posts 
            WHERE slug = $1
        `;
        const { rows } = await client.query(query, [slug]);

        if (rows.length === 0) {
            return NextResponse.json({ message: "Article non trouvé." }, { status: 404 });
        }

        return NextResponse.json(rows[0]);

    } catch (error) {
        console.error(`Erreur API GET /api/blog/${slug}:`, error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}
