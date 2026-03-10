import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: 'Non autorisé.' }, { status: 401 });
        }

        const { password } = await request.json();

        if (!password || password.length < 8) {
            return NextResponse.json({ message: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            const passwordHash = await bcrypt.hash(password, 10);
            await client.query(
                'UPDATE users SET password_hash = $1 WHERE email = $2',
                [passwordHash, session.user.email]
            );
            return NextResponse.json({ message: 'Mot de passe défini avec succès.' }, { status: 200 });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Erreur API set-password:', error);
        return NextResponse.json({ message: 'Erreur interne du serveur.' }, { status: 500 });
    }
}
