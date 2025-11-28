import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

// La signature de la fonction GET ne prend que 'request'
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const userId = session.user.id;
    
    // --- CORRECTION MAJEURE ICI ---
    // On extrait l'ID du rendez-vous directement depuis l'URL de la requête.
    const url = new URL(request.url);
    const appointmentId = url.pathname.split('/').pop(); // Prend le dernier segment de l'URL

    if (!appointmentId) {
        return NextResponse.json({ message: "ID de rendez-vous manquant." }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT 
                a.start_time,
                s.title as "serviceTitle",
                s.price,
                s.acompte
            FROM appointments a 
            JOIN services s ON a."serviceId" = s.id
            WHERE a.id = $1 AND a."userId" = $2 AND a.status = 'en attente'
        `, [appointmentId, userId]);

        if (result.rows.length === 0) {
            return NextResponse.json({ message: "Rendez-vous non trouvé ou déjà payé." }, { status: 404 });
        }

        const data = result.rows[0];

        return NextResponse.json({
            startTime: data.start_time,
            serviceTitle: data.serviceTitle,
            isAcompte: !!data.acompte && Number(data.acompte) > 0,
            amountToPay: data.acompte || data.price,
        });

    } catch (error) {
        console.error(`Erreur API /api/appointments/${appointmentId}:`, error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}