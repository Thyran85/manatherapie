import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import Stripe from 'stripe';
import { sendAppointmentConfirmationEmail } from '@/lib/mail';

// Initialisation de Stripe (assurez-vous que STRIPE_SECRET_KEY est dans .env.local)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// Clé secrète générée par la CLI Stripe (assurez-vous qu'elle est dans .env.local)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

// La fonction POST qui reçoit les notifications de Stripe
export async function POST(request) {
    let event;

    // Étape 1 : Vérifier la signature du webhook pour la sécurité
    // C'est crucial pour s'assurer que la requête vient bien de Stripe et pas d'un acteur malveillant.
    try {
        const signature = request.headers.get('stripe-signature');
        const body = await request.text();
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        console.error(`⚠️  Erreur de vérification du webhook Stripe : ${err.message}`);
        // Si la signature n'est pas valide, on rejette la requête.
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Étape 2 : Gérer l'événement spécifique qui nous intéresse
    // 'checkout.session.completed' est envoyé par Stripe quand un paiement est réussi.
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // On récupère les informations que nous avons nous-mêmes stockées lors de la création de la session de paiement.
        const appointmentId = session.metadata.appointmentId;
        const paymentIntentId = session.payment_intent;
        const amount = session.amount_total / 100; // Stripe envoie en centimes, on convertit en euros.
        const paymentStatus = session.payment_status;

        // On ne procède que si le statut du paiement est bien "paid" (payé).
        if (paymentStatus === 'paid' && appointmentId) {
            const client = await pool.connect();
            try {
                // On utilise une transaction pour s'assurer que toutes les opérations réussissent ou échouent ensemble.
                await client.query('BEGIN');

                // A. Mettre à jour le statut du rendez-vous de 'en attente' à 'confirmé'.
                // On récupère en même temps les infos nécessaires pour les notifications.
                const appointmentUpdateResult = await client.query(
                    `UPDATE appointments 
                     SET status = 'confirmé' 
                     WHERE id = $1 AND status = 'en attente'
                     RETURNING "userId", "serviceId", start_time`,
                    [appointmentId]
                );
                
                // Si la requête n'a rien retourné, c'est peut-être que le webhook a déjà été traité.
                // C'est une sécurité pour éviter les doubles traitements.
                if (appointmentUpdateResult.rows.length === 0) {
                    console.warn(`Webhook reçu pour un rendez-vous déjà traité ou non trouvé : ${appointmentId}`);
                    await client.query('ROLLBACK');
                    return NextResponse.json({ received: true, message: 'Déjà traité.' });
                }

                const { userId, serviceId, start_time } = appointmentUpdateResult.rows[0];

                // B. Enregistrer la transaction dans notre table 'payments' pour garder une trace.
                await client.query(
                    'INSERT INTO payments ("appointmentId", stripe_payment_intent_id, amount, status) VALUES ($1, $2, $3, $4)',
                    [appointmentId, paymentIntentId, amount, 'succeeded']
                );
                
                // C. Créer une notification interne qui s'affichera dans la cloche du site.
                const serviceRes = await client.query('SELECT title FROM services WHERE id = $1', [serviceId]);
                const serviceTitle = serviceRes.rows[0].title;
                const message = `Votre rendez-vous pour "${serviceTitle}" du ${new Date(start_time).toLocaleDateString('fr-FR')} est confirmé.`;
                await client.query(
                    'INSERT INTO notifications ("userId", message, link) VALUES ($1, $2, $3)',
                    [userId, message, '/compte/rendez-vous']
                );

                // On valide toutes les opérations dans la base de données.
                await client.query('COMMIT');
                
                // D. (Hors transaction) Envoyer l'email de confirmation externe.
                const userRes = await client.query('SELECT email FROM users WHERE id = $1', [userId]);
                if (userRes.rows.length > 0) {
                    await sendAppointmentConfirmationEmail({ 
                        to: userRes.rows[0].email, 
                        serviceTitle: serviceTitle, 
                        appointmentDate: start_time 
                    });
                }

            } catch (err) {
                // En cas d'erreur à n'importe quelle étape, on annule tout.
                await client.query('ROLLBACK');
                console.error('Erreur dans le webhook Stripe lors de la mise à jour de la BDD:', err);
                // On renvoie une erreur 500 pour que Stripe sache que quelque chose a mal tourné et puisse réessayer plus tard.
                return NextResponse.json({ error: 'Database Error' }, { status: 500 });
            } finally {
                client.release();
            }
        }
    }

    // Étape 3 : Renvoyer une réponse de succès à Stripe
    // Il est crucial de renvoyer une réponse 200 OK pour dire à Stripe "J'ai bien reçu la notification, n'essaie plus de me l'envoyer".
    return NextResponse.json({ received: true });
}