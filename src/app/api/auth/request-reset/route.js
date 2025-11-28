import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/mail';
import bcrypt from 'bcryptjs';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

export async function POST(request) {
    try {
        const { email } = await request.json();
        if (!email) {
            return NextResponse.json({ message: 'Email requis.' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            // On vérifie qu'un utilisateur avec cet email existe ET qu'il a un mot de passe
            // (on ne peut pas réinitialiser le mot de passe d'un compte Google)
            const userResult = await client.query('SELECT id FROM users WHERE email = $1 AND password_hash IS NOT NULL', [email]);
            
            if (userResult.rows.length > 0) {
                const resetToken = crypto.randomBytes(32).toString('hex');
                const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
                const tokenExpiry = new Date(Date.now() + 3600000); // 1 heure

                // On utilise bien les noms de colonnes corrects, avec les guillemets si nécessaire
                await client.query(
                    'UPDATE users SET reset_token = $1, "reset_token_expires" = $2 WHERE email = $3',
                    [hashedToken, tokenExpiry, email]
                );

                const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;
                
                await sendPasswordResetEmail({ to: email, link: resetLink });
            }

            // Réponse de sécurité : on ne révèle jamais si l'email a été trouvé ou non.
            return NextResponse.json({ message: "Si un compte avec cet email existe, un lien de réinitialisation a été envoyé." });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Erreur dans /api/auth/request-reset:", error);
        return NextResponse.json({ message: 'Erreur interne du serveur.' }, { status: 500 });
    }
}