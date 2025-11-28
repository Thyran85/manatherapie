import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
const ADMIN_JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// La fonction ne reçoit plus l'objet cookies, mais directement la valeur du token.
async function verifyTokenAndGetAdminId(tokenValue) {
    if (!tokenValue) return null;

    try {
        const { payload } = await jwtVerify(tokenValue, ADMIN_JWT_SECRET);
        if (payload.role !== 'ADMIN') return null;
        return payload.userId;
    } catch (e) {
        return null;
    }
}

// --- FONCTION GET ---
export async function GET() {
    // Étape 1: Toute la logique de lecture du cookie se passe ICI.
    const tokenCookie = cookies().get('admin-token');
    const tokenValue = tokenCookie?.value; // On extrait la valeur (string).

    // Étape 2: On passe uniquement la valeur à notre fonction de vérification.
    const adminId = await verifyTokenAndGetAdminId(tokenValue);
    
    if (!adminId) {
        return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const client = await pool.connect();
    try {
        const result = await client.query(
            'SELECT name, email FROM users WHERE id = $1 AND role = $2',
            [adminId, 'ADMIN']
        );
        if (result.rows.length === 0) {
            return NextResponse.json({ message: "Administrateur non trouvé" }, { status: 404 });
        }
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error("Erreur API GET /api/admin/profile:", error);
        return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 });
    } finally {
        client.release();
    }
}

// --- FONCTION PUT ---
export async function PUT(request) {
    // On répète le même schéma correct.
    const tokenCookie = cookies().get('admin-token');
    const tokenValue = tokenCookie?.value;
    const adminId = await verifyTokenAndGetAdminId(tokenValue);

    if (!adminId) {
        return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { name, email } = await request.json();
    if (!name || !email) {
        return NextResponse.json({ message: "Le nom et l'email sont requis." }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        await client.query(
            'UPDATE users SET name = $1, email = $2 WHERE id = $3',
            [name, email, adminId]
        );
        return NextResponse.json({ message: "Profil mis à jour avec succès." });
    } catch (error) {
        if (error.code === '23505') { 
            return NextResponse.json({ message: "Cet email est déjà utilisé par un autre compte." }, { status: 409 });
        }
        console.error("Erreur API PUT /api/admin/profile:", error);
        return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 });
    } finally {
        client.release();
    }
}