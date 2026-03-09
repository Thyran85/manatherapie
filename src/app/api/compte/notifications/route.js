import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    const client = await pool.connect();
    try {
        const { rows } = await client.query(
            `SELECT id, message, link, created_at
             FROM notifications
             WHERE "userId" = $1
             ORDER BY created_at DESC`,
            [session.user.id]
        );

        return NextResponse.json(rows);
    } catch (error) {
        console.error('Erreur API GET /api/compte/notifications:', error);
        return NextResponse.json({ message: 'Erreur interne du serveur.' }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function DELETE() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    const client = await pool.connect();
    try {
        await client.query('DELETE FROM notifications WHERE "userId" = $1', [session.user.id]);
        return NextResponse.json({ message: 'Toutes les notifications ont été supprimées.' });
    } catch (error) {
        console.error('Erreur API DELETE /api/compte/notifications:', error);
        return NextResponse.json({ message: 'Erreur interne du serveur.' }, { status: 500 });
    } finally {
        client.release();
    }
}
