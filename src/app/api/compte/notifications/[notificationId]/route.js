import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    const { notificationId } = await params;
    if (!notificationId) {
        return NextResponse.json({ message: 'ID notification manquant.' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        const result = await client.query(
            `DELETE FROM notifications
             WHERE id = $1 AND "userId" = $2
             RETURNING id`,
            [notificationId, session.user.id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ message: 'Notification non trouvée.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Notification supprimée.' });
    } catch (error) {
        console.error(`Erreur API DELETE /api/compte/notifications/${notificationId}:`, error);
        return NextResponse.json({ message: 'Erreur interne du serveur.' }, { status: 500 });
    } finally {
        client.release();
    }
}
