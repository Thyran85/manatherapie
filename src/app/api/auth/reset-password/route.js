import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

export async function POST(request) {
    try {
        const { token, password } = await request.json();
        if (!token || !password) {
            return NextResponse.json({ message: 'Token et mot de passe requis.' }, { status: 400 });
        }

        // Hasher le token reçu pour le comparer à celui dans la BDD
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const client = await pool.connect();
        try {
            const userResult = await client.query(
                'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
                [hashedToken]
            );

            if (userResult.rows.length === 0) {
                return NextResponse.json({ message: 'Token invalide ou expiré.' }, { status: 400 });
            }

            const userId = userResult.rows[0].id;
            
            // Hasher le nouveau mot de passe
            const newPasswordHash = await bcrypt.hash(password, 10);

            // Mettre à jour le mot de passe et invalider le token
            await client.query(
                'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
                [newPasswordHash, userId]
            );

            return NextResponse.json({ message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.' });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Erreur interne du serveur.' }, { status: 500 });
    }
}