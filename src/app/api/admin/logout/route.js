import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('admin-token');
        return NextResponse.json({ message: 'Déconnexion réussie.' });
    } catch (error) {
        return NextResponse.json({ message: 'Erreur interne.' }, { status: 500 });
    }
}
