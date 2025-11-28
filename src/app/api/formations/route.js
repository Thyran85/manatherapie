import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const searchTerm = searchParams.get('search') || '';
    // --- NOUVELLE LIGNE ---
    const limit = searchParams.get('limit');

    let query = `
        SELECT 
            id, title, slug, type, category, price, 
            description, image_url, author, duration, level
        FROM courses
        WHERE title ILIKE $1
    `;
    const queryParams = [`%${searchTerm}%`];
    let paramIndex = 2;

    if (category && category !== 'all') {
        query += ` AND category = $${paramIndex++}`;
        queryParams.push(category);
    }
    if (type && type !== 'all') {
        query += ` AND c.type = $${paramIndex++}`;
        queryParams.push(type);
    }

    query += ` ORDER BY created_at DESC`;

    // --- NOUVELLE LOGIQUE ---
    if (limit && !isNaN(parseInt(limit))) {
        query += ` LIMIT $${paramIndex++}`;
        queryParams.push(parseInt(limit));
    }

    const client = await pool.connect();
    try {
        const { rows } = await client.query(query, queryParams);
        return NextResponse.json(rows);
    } catch (error) {
        console.error("Erreur API GET /formations:", error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}