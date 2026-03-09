import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        // Supprimer le cookie en le définissant avec une date d'expiration passée
        const cookieStore = await cookies();
        cookieStore.set('token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            expires: new Date(0), // Date dans le passé
            path: '/',
        });

        return NextResponse.json({ message: 'Déconnexion réussie.' }, { status: 200 });
    } catch (error) {
        console.error('Erreur API Déconnexion:', error);
        return NextResponse.json({ message: 'Erreur interne du serveur.' }, { status: 500 });
    }
}
