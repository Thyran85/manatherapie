import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

// GET : Lister tous les articles pour l'admin
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const client = await pool.connect();
    try {
        const query = `
            SELECT id, title, category, published_at, slug 
            FROM blog_posts
            WHERE title ILIKE $1 OR category ILIKE $1
            ORDER BY published_at DESC`;
        const { rows } = await client.query(query, [`%${search}%`]);
        return NextResponse.json(rows);
    } finally {
        client.release();
    }
}

// POST : Créer un nouvel article
export async function POST(request) {
    const client = await pool.connect();
    try {
        const { title, slug, category, reading_time, image_url, content_html } = await request.json();
        // Générer un extrait simple à partir du HTML
        const excerpt = content_html.replace(/<[^>]+>/g, '').substring(0, 150) + '...';
        
        const query = `
            INSERT INTO blog_posts (title, slug, category, reading_time, image_url, content_html, excerpt)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
        const values = [title, slug, category, reading_time, image_url, content_html, excerpt];
        
        const { rows } = await client.query(query, values);
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        if (error.code === '23505') {
            return NextResponse.json({ message: "Ce slug (URL) est déjà utilisé." }, { status: 409 });
        }
        console.error(error);
        return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}