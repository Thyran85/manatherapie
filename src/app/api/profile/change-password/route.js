import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

export async function PUT(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword || newPassword.length < 8) {
        return NextResponse.json({ message: "Veuillez fournir un mot de passe actuel et un nouveau mot de passe de 8 caractères minimum." }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        const userResult = await client.query('SELECT password_hash FROM users WHERE id = $1', [session.user.id]);
        if (userResult.rows.length === 0) return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
        
        const user = userResult.rows[0];
        if (!user.password_hash) {
            return NextResponse.json({ message: "Vous ne pouvez pas changer le mot de passe d'un compte créé via un fournisseur externe (ex: Google)." }, { status: 400 });
        }
        
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordValid) {
            return NextResponse.json({ message: "Le mot de passe actuel est incorrect." }, { status: 403 });
        }
        
        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        
        await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, session.user.id]);

        return NextResponse.json({ message: "Mot de passe mis à jour avec succès." });
    } catch (error) {
        console.error("Erreur API /api/profile/change-password:", error);
        return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 });
    } finally {
        client.release();
    }
}