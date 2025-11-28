import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sendAppointmentRequestEmail } from '@/lib/mail'; // On ajoutera cette fonction

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    const userId = session.user.id;

    const { serviceSlug, startTime, notes } = await request.json();
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const serviceResult = await client.query('SELECT id, duration_minutes FROM services WHERE slug = $1', [serviceSlug]);
        if (serviceResult.rows.length === 0) throw new Error("Service non trouvé.");
        const service = serviceResult.rows[0];

        const endTime = new Date(new Date(startTime).getTime() + service.duration_minutes * 60000);

        const conflictResult = await client.query('SELECT id FROM appointments WHERE status != \'annulé\' AND (start_time, end_time) OVERLAPS ($1, $2)', [startTime, endTime]);
        if (conflictResult.rows.length > 0) throw new Error("Ce créneau n'est plus disponible.");

        const newAppointmentResult = await client.query(
            `INSERT INTO appointments ("userId", "serviceId", start_time, end_time, status, notes) VALUES ($1, $2, $3, $4, 'en attente', $5) RETURNING id`,
            [userId, service.id, startTime, endTime, notes]
        );
        const appointmentId = newAppointmentResult.rows[0].id;

        // CRÉATION DE LA NOTIFICATION "EN ATTENTE"
        const serviceInfo = await client.query('SELECT title FROM services WHERE id = $1', [service.id]);
        const message = `Votre demande de RDV pour "${serviceInfo.rows[0].title}" a été enregistrée. Veuillez finaliser le paiement.`;
        await client.query(
            'INSERT INTO notifications ("userId", message, link) VALUES ($1, $2, $3)',
            [userId, message, `/compte/paiement/${appointmentId}`]
        );

        await client.query('COMMIT');
        
        const paymentLink = `${process.env.NEXTAUTH_URL}/compte/paiement/${appointmentId}`;
await sendAppointmentRequestEmail({ 
    to: session.user.email,
    serviceTitle: serviceInfo.rows[0].title,
    appointmentDate: startTime,
    paymentLink: paymentLink
});
        return NextResponse.json({ appointmentId: appointmentId });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Erreur API /api/appointments/create:", error);
        return NextResponse.json({ message: error.message || "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}