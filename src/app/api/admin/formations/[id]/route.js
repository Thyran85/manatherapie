import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

/**
 * @description Obtenir les détails d'une formation spécifique ET la liste de ses acheteurs
 * @method GET
 */
export async function GET(request, { params }) {
    

    const { id } = await params;
    const client = await pool.connect();

    try {
        const courseResult = await client.query('SELECT * FROM courses WHERE id = $1', [id]);
        if (courseResult.rows.length === 0) {
            return NextResponse.json({ message: "Formation non trouvée." }, { status: 404 });
        }
        const course = courseResult.rows[0];

        const buyersResult = await client.query(
            `SELECT u.name, u.email, uc.status, uc.id as purchase_id
             FROM user_courses uc
             JOIN users u ON uc."userId" = u.id
             WHERE uc."courseId" = $1
             ORDER BY uc.purchased_at DESC`,
            [id]
        );
        
        return NextResponse.json({ ...course, buyers: buyersResult.rows });
    } catch (error) {
        console.error(`Erreur API GET /admin/formations/${id}:`, error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}

/**
 * @description Mettre à jour une formation (Complet)
 * @method PUT
 */
export async function PUT(request, { params }) {
    

    const { id } = await params;
    const client = await pool.connect();
    
    try {
        const data = await request.json();
        // --- MODIFICATION 1 : Récupérer les URLs potentielles ---
        const { title, slug, type, category, price, description, whatYoullLearn, modules, imageUrl, fileUrl } = data;

        const fields = [];
        const values = [];
        let paramIndex = 1;

        if (title) { fields.push(`title = $${paramIndex++}`); values.push(title); }
        if (slug) { fields.push(`slug = $${paramIndex++}`); values.push(slug); }
        if (type) { fields.push(`type = $${paramIndex++}`); values.push(type); }
        if (category) { fields.push(`category = $${paramIndex++}`); values.push(category); }
        if (price) { fields.push(`price = $${paramIndex++}`); values.push(price); }
        if (description) { fields.push(`description = $${paramIndex++}`); values.push(description); }
        if (whatYoullLearn) { fields.push(`what_you_learn = $${paramIndex++}`); values.push(whatYoullLearn); }
        if (modules) { fields.push(`modules = $${paramIndex++}`); values.push(JSON.stringify(modules)); }
        
        // --- MODIFICATION 2 : Ajouter la logique pour mettre à jour les URLs si elles sont fournies ---
        if (imageUrl) { fields.push(`image_url = $${paramIndex++}`); values.push(imageUrl); }
        if (fileUrl) { fields.push(`file_url = $${paramIndex++}`); values.push(fileUrl); }


        if (fields.length === 0) {
            return NextResponse.json({ message: "Aucun champ à mettre à jour." }, { status: 400 });
        }

        values.push(id);
        const query = `
            UPDATE courses 
            SET ${fields.join(', ')}, updated_at = NOW() 
            WHERE id = $${paramIndex}
            RETURNING *;
        `;
        
        const { rows } = await client.query(query, values);
        return NextResponse.json(rows[0]);

    } catch (error) {
        if (error.code === '23505') { 
            return NextResponse.json({ message: "Ce slug est déjà utilisé." }, { status: 409 });
        }
        console.error(`Erreur API PUT /admin/formations/${id}:`, error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}

/**
 * @description Supprimer une formation (si aucun acheteur)
 * @method DELETE
 */
export async function DELETE(request, { params }) {
    

    const { id } = await params;
    const client = await pool.connect();

    try {
        const checkBuyers = await client.query(
            'SELECT COUNT(*) FROM user_courses WHERE "courseId" = $1',
            [id]
        );

        if (parseInt(checkBuyers.rows[0].count, 10) > 0) {
            return NextResponse.json({ message: "Impossible de supprimer: cette formation a déjà été achetée par des clients." }, { status: 403 });
        }

        const result = await client.query('DELETE FROM courses WHERE id = $1', [id]);
        
        if (result.rowCount === 0) {
            return NextResponse.json({ message: "Formation non trouvée." }, { status: 404 });
        }
        
        return NextResponse.json({ message: "Formation supprimée avec succès." }, { status: 200 });

    } catch (error) {
        console.error(`Erreur API DELETE /admin/formations/${id}:`, error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}
