import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/lib/mail';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
    try {
        const { fullName, email, password } = await request.json();

        if (!fullName || !email || !password || password.length < 8) {
            return NextResponse.json({ message: 'Données invalides.' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            const passwordHash = await bcrypt.hash(password, 10);
            const code = generateCode();
            const codeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

            // Vérifie si un compte existe déjà avec cet email
            const existing = await client.query('SELECT id, email_verified FROM users WHERE email = $1', [email]);
            if (existing.rows.length > 0) {
                const user = existing.rows[0];
                if (user.email_verified) {
                    return NextResponse.json({ message: 'Un utilisateur avec cet email existe déjà.' }, { status: 409 });
                }
                // Compte non vérifié — on remet à jour le code et le mot de passe
                await client.query(
                    'UPDATE users SET name = $1, password_hash = $2, verification_code = $3, verification_code_expires = $4 WHERE email = $5',
                    [fullName, passwordHash, code, codeExpiry, email]
                );
            } else {
                await client.query(
                    'INSERT INTO users (name, email, password_hash, email_verified, verification_code, verification_code_expires) VALUES ($1, $2, $3, FALSE, $4, $5)',
                    [fullName, email, passwordHash, code, codeExpiry]
                );
            }

            await sendVerificationEmail({ to: email, code });

            return NextResponse.json({ message: 'Compte créé. Veuillez vérifier votre email.' }, { status: 201 });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Erreur API Inscription:', error);
        return NextResponse.json({ message: 'Erreur interne du serveur.' }, { status: 500 });
    }
}