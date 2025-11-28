import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

// Protégée par le middleware /api/admin/*
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status');
    
    const client = await pool.connect();
    try {
        // Étape 1: Mettre à jour automatiquement les statuts obsolètes
        await client.query(`
            UPDATE appointments SET status = 'annulé'
            WHERE status = 'en attente' AND start_time < NOW()
        `);

        // Étape 2: Récupérer tous les rendez-vous avec les informations jointes
        let query = `
            SELECT 
                a.id,
                a.start_time,
                a.end_time,
                a.status,
                s.title as service_title,
                s.type as service_type,
                s.price as service_price,
                s.acompte as service_acompte,
                u.name as client_name,
                u.email as client_email,
                p.status as payment_status
            FROM appointments a
            JOIN services s ON a."serviceId" = s.id
            JOIN users u ON a."userId" = u.id
            LEFT JOIN payments p ON a.id = p."appointmentId"
            WHERE (u.name ILIKE $1 OR s.title ILIKE $1)
        `;
        const queryParams = [`%${search}%`];
        let paramIndex = 2;

        if (statusFilter && statusFilter !== 'all') {
            query += ` AND a.status = $${paramIndex++}`;
            queryParams.push(statusFilter);
        }
        
        query += ` ORDER BY a.start_time DESC`;

        const { rows } = await client.query(query, queryParams);

        // Étape 3: Traiter les données pour le frontend (logique du statut "terminé")
        const events = rows.map(event => {
            let finalStatus = event.status;
            // 'confirmé' est le statut après paiement, 'accepté' est le statut après validation manuelle (si pas de paiement)
            if ((event.status === 'confirmé' || event.status === 'accepté') && new Date(event.end_time) < new Date()) {
                finalStatus = 'terminé';
            }

            return {
                id: event.id,
                title: `${event.service_title} - ${event.client_name}`,
                start: event.start_time,
                end: event.end_time,
                status: finalStatus,
                // Informations supplémentaires pour la modale
                clientName: event.client_name,
                clientEmail: event.client_email,
                service: event.service_title,
                serviceType: event.service_type,
                price: event.service_price,
                acompte: event.service_acompte,
                paymentStatus: event.payment_status || 'en attente de paiement' // "en attente" si pas de paiement enregistré
            };
        });

        return NextResponse.json(events);
    } catch (error) {
        console.error("Erreur API GET /admin/appointments:", error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}