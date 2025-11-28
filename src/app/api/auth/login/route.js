import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { cookies } from 'next/headers';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

const loginSchema = z.object({
    email: z.string().email({ message: "Adresse email invalide." }),
    password: z.string().min(1, { message: "Le mot de passe ne peut pas être vide." }),
});

export async function POST(request) {
    try {
        const body = await request.json();

        // 1. Valider les données
        const validation = loginSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        const { email, password } = validation.data;
        const client = await pool.connect();
        try {
            // 2. Chercher l'utilisateur par email
            const result = await client.query('SELECT id, full_name, email, password_hash FROM users WHERE email = $1', [email]);
            const user = result.rows[0];

            if (!user) {
                return NextResponse.json({ message: 'Identifiants invalides.' }, { status: 401 });
            }

            // 3. Comparer le mot de passe
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);

            if (!isPasswordValid) {
                return NextResponse.json({ message: 'Identifiants invalides.' }, { status: 401 });
            }

            // 4. Créer le JWT
            const token = jwt.sign(
                { userId: user.id, email: user.email, name: user.full_name },
                process.env.JWT_SECRET,
                { expiresIn: '1d' } // Le token expire dans 1 jour
            );

            // 5. Stocker le token dans un cookie sécurisé
            cookies().set('token', token, {
                httpOnly: true, // Le cookie n'est pas accessible par le JavaScript côté client
                secure: process.env.NODE_ENV === 'production', // Uniquement en HTTPS en production
                maxAge: 60 * 60 * 24, // 1 jour en secondes
                path: '/',
                sameSite: 'lax',
            });
            
            // On ne renvoie pas le hash du mot de passe au client
            const { password_hash, ...userWithoutPassword } = user;
            
            return NextResponse.json({ user: userWithoutPassword }, { status: 200 });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Erreur API Connexion:', error);
        return NextResponse.json({ message: 'Erreur interne du serveur.' }, { status: 500 });
    }
}