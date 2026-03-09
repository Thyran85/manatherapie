import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

// Clé secrète pour les tokens admin. On peut utiliser le JWT_SECRET, mais un secret dédié est encore mieux.
const ADMIN_JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ message: 'Email et mot de passe requis.' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            // 1. Chercher l'utilisateur par email
            const result = await client.query('SELECT id, name, email, password_hash, role FROM users WHERE email = $1', [email]);
            const user = result.rows[0];

            // 2. Vérifier si l'utilisateur existe
            if (!user) {
                return NextResponse.json({ message: 'Identifiants invalides.' }, { status: 401 });
            }

            // 3. VÉRIFICATION CRUCIALE : L'utilisateur est-il un ADMIN ?
            if (user.role !== 'ADMIN') {
                console.warn(`Tentative de connexion admin par un non-admin: ${email}`);
                return NextResponse.json({ message: 'Accès non autorisé.' }, { status: 403 }); // 403 Forbidden
            }
            
            // 4. Vérifier le mot de passe
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordValid) {
                return NextResponse.json({ message: 'Identifiants invalides.' }, { status: 401 });
            }

            // 5. Créer un JWT (JSON Web Token) spécifique pour l'admin
            const token = await new SignJWT({ userId: user.id, role: user.role })
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('1h') // Token valide pour 1 heure
                .sign(ADMIN_JWT_SECRET);
            
            // 6. Stocker le token dans un cookie httpOnly et sécurisé
            const cookieStore = await cookies();
            cookieStore.set('admin-token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60, // 1 heure en secondes
                path: '/', // Important : le cookie n'est valable que pour les routes /admin
                sameSite: 'strict',
            });

            return NextResponse.json({ message: 'Connexion réussie.' });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Erreur API Admin Login:', error);
        return NextResponse.json({ message: 'Erreur interne du serveur.' }, { status: 500 });
    }
}
