import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

export async function POST(request) {
    try {
        const { fullName, email, password } = await request.json();

        if (!fullName || !email || !password || password.length < 8) {
            return NextResponse.json({ message: 'Données invalides.' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            const passwordHash = await bcrypt.hash(password, 10);
            
            // On insère dans la nouvelle table avec les bonnes colonnes (`name` au lieu de `full_name`)
            await client.query(
                'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)',
                [fullName, email, passwordHash]
            );

            return NextResponse.json({ message: 'Utilisateur créé avec succès.' }, { status: 201 });

        } catch (dbError) {
            if (dbError.code === '23505') { // Erreur de violation de contrainte unique
                return NextResponse.json({ message: 'Un utilisateur avec cet email existe déjà.' }, { status: 409 });
            }
            throw dbError;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Erreur API Inscription:', error);
        return NextResponse.json({ message: 'Erreur interne du serveur.' }, { status: 500 });
    }
}