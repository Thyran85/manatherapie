import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const userId = session.user.id;

    const { appointmentId } = await request.json();

    if (!appointmentId) {
        return NextResponse.json({ message: "ID de rendez-vous manquant." }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        // Étape cruciale de sécurité : on récupère les infos du RDV directement depuis la BDD,
        // on ne fait jamais confiance aux informations qui pourraient venir du frontend.
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
        
        const appointmentData = result.rows[0];
        const amountToPay = appointmentData.acompte || appointmentData.price;
        const serviceTitle = appointmentData.serviceTitle;
        const startTime = appointmentData.start_time;

        // Créer la session de paiement Stripe
        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'paypal'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: serviceTitle,
                        description: `Rendez-vous le ${new Date(startTime).toLocaleDateString('fr-FR')} à ${new Date(startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
                    },
                    unit_amount: Math.round(Number(amountToPay) * 100), // Montant en centimes, en s'assurant que c'est un nombre
                },
                quantity: 1,
            }],
            mode: 'payment',
            customer_email: session.user.email,
            success_url: `${process.env.NEXTAUTH_URL}/compte/rendez-vous?payment=success`,
            cancel_url: `${process.env.NEXTAUTH_URL}/compte/paiement/${appointmentId}?payment=canceled`,
            metadata: {
                appointmentId: appointmentId, // On passe l'ID du RDV à Stripe
            }
        });

        return NextResponse.json({ url: stripeSession.url });

    } catch (error) {
        console.error("Erreur API /api/checkout-session:", error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}