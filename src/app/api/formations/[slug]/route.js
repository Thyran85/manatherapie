// src/app/api/formations/[slug]/route.js
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

/**
 * @description Obtenir les détails publics d'une formation par son slug
 * @method GET
 */
export async function GET(request, { params }) {
    const { slug } = await params;
    const client = await pool.connect();
    try {
        const query = `
            SELECT 
                id, title, slug, type, category, price, description, 
                image_url, what_you_learn, modules, author, duration, level
            FROM courses 
            WHERE slug = $1
        `;
        const { rows } = await client.query(query, [slug]);

        if (rows.length === 0) {
            return NextResponse.json({ message: "Formation non trouvée." }, { status: 404 });
        }

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`Erreur API GET /formations/${slug}:`, error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}
