import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const currentUserId = session.user.id;

    const client = await pool.connect();
    try {
        await client.query(`
            UPDATE appointments
            SET status = 'annulé'
            WHERE status = 'en attente' AND start_time < NOW()
        `);
        const result = await client.query(`
            SELECT 
                a.id, a."userId", a.start_time, a.end_time, a.status,
                a.location, a.meet_link, s.title AS service_title, s.type AS service_type
            FROM appointments a
            JOIN services s ON a."serviceId" = s.id
            WHERE a."userId" = $1 OR a.status IN ('confirmé', 'en attente')
        `, [currentUserId]);

        const events = result.rows.map(event => {
            const userOwns = event.userId === currentUserId;

            if (!userOwns) {
                return {
                    id: event.id,
                    title: 'Créneau Réservé',
                    start: new Date(event.start_time), // S'assurer que les dates sont des objets Date
                    end: new Date(event.end_time),
                    status: 'occupé',
                    userOwns: false
                };
            }

             let finalStatus = event.status;
            if (event.status === 'confirmé' && new Date(event.end_time) < new Date()) {
                finalStatus = 'terminé';
            }

            // Pour les RDV de l'utilisateur, on renvoie toutes les infos
            return {
                id: event.id, title: event.service_title, start: new Date(event.start_time), end: new Date(event.end_time),
                status: finalStatus, // On utilise le statut final
                userOwns: true, type: event.service_type, location: event.location, meetLink: event.meet_link
            };
        });

        return NextResponse.json(events);

    } catch (error) {
        console.error("Erreur API /api/appointments:", error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}