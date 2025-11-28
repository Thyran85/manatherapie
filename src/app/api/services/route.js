import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

export async function GET() {
    // Cette route n'a pas besoin d'être protégée, car la liste des services est publique.
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT slug, title, price, acompte FROM services ORDER BY title');
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("Erreur API /api/services:", error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}