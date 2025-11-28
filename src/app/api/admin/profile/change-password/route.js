import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
const ADMIN_JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function verifyTokenAndGetAdminId(tokenValue) {
    if (!tokenValue) return null;
    try {
        const { payload } = await jwtVerify(tokenValue, ADMIN_JWT_SECRET);
        if (payload.role !== 'ADMIN') return null;
        return payload.userId;
    } catch (e) { return null; }
}

export async function PUT(request) {
    // Schéma correct appliqué ici aussi.
    const tokenCookie = cookies().get('admin-token');
    const tokenValue = tokenCookie?.value;
    const adminId = await verifyTokenAndGetAdminId(tokenValue);

    if (!adminId) {
        return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
        return NextResponse.json({ message: "Tous les champs sont requis." }, { status: 400 });
    }
    if (newPassword.length < 8) {
        return NextResponse.json({ message: "Le nouveau mot de passe doit faire au moins 8 caractères." }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
        return NextResponse.json({ message: "Les nouveaux mots de passe ne correspondent pas." }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        const result = await client.query('SELECT password_hash FROM users WHERE id = $1', [adminId]);
        if (result.rows.length === 0) {
            return NextResponse.json({ message: "Utilisateur non trouvé." }, { status: 404 });
        }
        const currentPasswordHash = result.rows[0].password_hash;

        const isPasswordValid = await bcrypt.compare(currentPassword, currentPasswordHash);
        if (!isPasswordValid) {
            return NextResponse.json({ message: "Le mot de passe actuel est incorrect." }, { status: 403 });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        await client.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [newPasswordHash, adminId]
        );

        return NextResponse.json({ message: "Mot de passe mis à jour avec succès." });

    } catch (error) {
        console.error("Erreur API PUT /api/admin/profile/change-password:", error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}