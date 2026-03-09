import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Note : Cette route est protégée par le middleware, donc pas besoin de verifyAdmin ici.

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

/**
 * @description Obtenir les détails d'une formation ADMIN par son SLUG.
 * @method GET
 */
export async function GET(request, { params }) {
    const { slug } = await params;
    const client = await pool.connect();

    try {
        // Requête 1: Trouver la formation par son slug
        const courseResult = await client.query('SELECT * FROM courses WHERE slug = $1', [slug]);
        if (courseResult.rows.length === 0) {
            return NextResponse.json({ message: "Formation non trouvée." }, { status: 404 });
        }
        const course = courseResult.rows[0];

        // Requête 2: Obtenir la liste des acheteurs pour cette formation
        const buyersResult = await client.query(
            `SELECT u.name, u.email, uc.status, uc.id as purchase_id
             FROM user_courses uc
             JOIN users u ON uc."userId" = u.id
             WHERE uc."courseId" = $1
             ORDER BY uc.purchased_at DESC`,
            [course.id] // On utilise l'ID trouvé dans la première requête
        );
        
        // On combine les deux résultats
        const finalResponse = { ...course, buyers: buyersResult.rows };
        
        return NextResponse.json(finalResponse);

    } catch (error) {
        console.error(`Erreur API GET /admin/formations/slug/${slug}:`, error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}
