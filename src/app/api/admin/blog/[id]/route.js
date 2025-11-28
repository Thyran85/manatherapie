import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

// GET : Récupérer un article spécifique pour l'édition
export async function GET(request, { params }) {
    const client = await pool.connect();
    try {
        const { rows } = await client.query('SELECT * FROM blog_posts WHERE id = $1', [params.id]);
        if (rows.length === 0) return NextResponse.json({ message: "Article non trouvé" }, { status: 404 });
        return NextResponse.json(rows[0]);
    } finally {
        client.release();
    }
}

// PUT : Mettre à jour un article
export async function PUT(request, { params }) {
    const client = await pool.connect();
    try {
        const { title, slug, category, reading_time, image_url, content_html } = await request.json();
        const excerpt = content_html.replace(/<[^>]+>/g, '').substring(0, 150) + '...';

        const query = `
            UPDATE blog_posts 
            SET title=$1, slug=$2, category=$3, reading_time=$4, image_url=$5, content_html=$6, excerpt=$7, updated_at=NOW()
            WHERE id=$8 RETURNING *`;
        const values = [title, slug, category, reading_time, image_url, content_html, excerpt, params.id];
        
        const { rows } = await client.query(query, values);
        return NextResponse.json(rows[0]);
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

// DELETE : Supprimer un article
export async function DELETE(request, { params }) {
    const client = await pool.connect();
    try {
        await client.query('DELETE FROM blog_posts WHERE id = $1', [params.id]);
        return new NextResponse(null, { status: 204 }); // No Content
    } finally {
        client.release();
    }
}