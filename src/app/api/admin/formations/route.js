
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

/**
 * @description Lister toutes les formations pour l'interface d'administration (Sécurisé)
 * @method GET
 */
export async function GET(request) {
    
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at_desc';
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    let query = `
        SELECT 
            c.*, 
            COUNT(uc.id) as total_buyers,
            COUNT(uc.id) FILTER (WHERE uc.status = 'en attente') as pending_buyers
        FROM courses c
        LEFT JOIN user_courses uc ON c.id = uc."courseId"
        WHERE c.title ILIKE $1
    `;
    const queryParams = [`%${searchTerm}%`];
    let paramIndex = 2;

    if (category && category !== 'all') {
        query += ` AND c.category = $${paramIndex++}`;
        queryParams.push(category);
    }
    if (type && type !== 'all') {
        query += ` AND c.type = $${paramIndex++}`;
        queryParams.push(type);
    }

    query += ` GROUP BY c.id`;

    switch(sortBy) {
        case 'title_asc':
            query += ' ORDER BY c.title ASC';
            break;
        case 'created_at_desc':
        default:
            query += ' ORDER BY c.created_at DESC';
            break;
    }

    const client = await pool.connect();
    try {
        const { rows } = await client.query(query, queryParams);
        return NextResponse.json(rows);
    } catch (error) {
        console.error("Erreur API GET /admin/formations:", error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}

/**
 * @description Créer une nouvelle formation (Sécurisé et Complet)
 * @method POST
 */
export async function POST(request) {
   

    try {
        const data = await request.json();
        if (!data.title || !data.slug || !data.price || !data.type) {
            return NextResponse.json({ message: "Les champs titre, slug, prix et type sont requis." }, { status: 400 });
        }

        // --- MODIFICATION 1 : Récupérer les nouvelles URLs ---
        const {
            title, slug, type, category, price, description,
            whatYoullLearn, modules, imageUrl, fileUrl
        } = data;
        
        const client = await pool.connect();
        try {
            // --- MODIFICATION 2 : Mettre à jour la requête pour insérer les URLs ---
            const query = `
                INSERT INTO courses (
                    title, slug, type, category, price, description, 
                    what_you_learn, modules, image_url, file_url
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *;
            `;
            // --- MODIFICATION 3 : Ajouter les URLs au tableau des valeurs ---
            const values = [
                title, slug, type, category, price, description,
                whatYoullLearn, JSON.stringify(modules),
                imageUrl, fileUrl
            ];
            
            const { rows } = await client.query(query, values);
            return NextResponse.json(rows[0], { status: 201 });

        } catch (error) {
             if (error.code === '23505') { 
                return NextResponse.json({ message: "Ce slug est déjà utilisé." }, { status: 409 });
            }
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Erreur API POST /admin/formations:", error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    }
}