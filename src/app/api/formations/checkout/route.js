import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getToken } from 'next-auth/jwt';
import bcrypt from 'bcryptjs';
import Stripe from 'stripe';
import { generateTemporaryPassword } from '@/lib/utils';
import { sendWelcomeEmail } from '@/lib/mail'; // Assurez-vous que le chemin est correct
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Nécessaire pour getToken

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

/**
 * @description Gère la création d'une session de paiement pour une formation.
 * @method POST
 */
export async function POST(request) {
    const client = await pool.connect();
    try {
        const { courseId, userDetails } = await request.json();

        if (!courseId) {
            return NextResponse.json({ message: "ID de la formation manquant." }, { status: 400 });
        }

        // Étape 1 : Récupérer les informations de la formation depuis la BDD (source de confiance)
        const courseResult = await client.query('SELECT id, title, price FROM courses WHERE id = $1', [courseId]);
        if (courseResult.rows.length === 0) {
            return NextResponse.json({ message: "Formation non trouvée." }, { status: 404 });
        }
        const course = courseResult.rows[0];

        // Étape 2 : Identifier l'utilisateur (connecté ou non)
        const session = await getToken({ req: request, secret: authOptions.secret });
        let userId;
        let userEmail;
        let isNewUser = false;
        let welcomeEmailPayload = null;
        
        await client.query('BEGIN'); // Début de la transaction

        if (session) {
            // --- SCÉNARIO 1 : L'UTILISATEUR EST CONNECTÉ ---
            userId = session.sub; // 'sub' est l'ID de l'utilisateur dans le token Next-Auth
            userEmail = session.email;
        } else {
            // --- SCÉNARIO 2 : L'UTILISATEUR N'EST PAS CONNECTÉ ---
            if (!userDetails || !userDetails.name || !userDetails.email) {
                await client.query('ROLLBACK');
                return NextResponse.json({ message: "Nom et email requis." }, { status: 400 });
            }
            userEmail = userDetails.email;

            const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [userEmail]);
            if (existingUser.rows.length > 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ message: "Un compte existe déjà avec cet email. Veuillez vous connecter." }, { status: 409 });
            }

            const tempPassword = generateTemporaryPassword();
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            const newUserResult = await client.query(
                'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
                [userDetails.name, userEmail, hashedPassword, 'CLIENT']
            );
            userId = newUserResult.rows[0].id;
            isNewUser = true;
            welcomeEmailPayload = { to: userEmail, name: userDetails.name, password: tempPassword };
        }

        // Étape 3 : Vérifier si l'utilisateur a déjà acheté ce cours
        const existingPurchase = await client.query(
            'SELECT id FROM user_courses WHERE "userId" = $1 AND "courseId" = $2',
            [userId, courseId]
        );

        if (existingPurchase.rows.length > 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: "Vous possédez déjà cette formation." }, { status: 409 });
        }

        // Étape 4 : Insérer l'achat dans la BDD avec le statut 'en attente'
        // Ce statut sera mis à jour par le webhook Stripe après un paiement réussi.
        await client.query(
            'INSERT INTO user_courses ("userId", "courseId", status) VALUES ($1, $2, $3)',
            [userId, courseId, 'en attente']
        );

        await client.query('COMMIT'); // On valide la transaction BDD
        
        // --- SECTION PAIEMENT (PRÊTE POUR STRIPE) ---
        const USE_STRIPE = false; // <<< METTRE À `true` QUAND STRIPE SERA PRÊT

        if (USE_STRIPE) {
            const stripeSession = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'eur',
                        product_data: { name: course.title },
                        unit_amount: Math.round(Number(course.price) * 100),
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                customer_email: userEmail,
                success_url: `${process.env.NEXTAUTH_URL}/compte/formations?payment=success`,
                cancel_url: `${process.env.NEXTAUTH_URL}/academie/${course.slug}?payment=canceled`,
                metadata: {
                    userId: userId,
                    courseId: courseId,
                    isNewUser: isNewUser.toString()
                }
            });
            return NextResponse.json({ url: stripeSession.url });

        } else {
            // --- SIMULATION DE PAIEMENT RÉUSSI (QUAND STRIPE EST DÉSACTIVÉ) ---
            console.log("SIMULATION DE PAIEMENT: Le paiement est considéré comme réussi.");
            
            // Ici, on envoie l'email de bienvenue directement si c'est un nouvel utilisateur.
            // En production, cette logique serait dans le webhook Stripe.
            if (isNewUser && welcomeEmailPayload) {
                await sendWelcomeEmail(welcomeEmailPayload);
            }
            
            // On pourrait aussi envoyer un email de confirmation d'achat ici.
            
            return NextResponse.json({ 
                success: true, 
                message: "Paiement simulé avec succès ! Votre formation est en attente de validation." 
            });
        }

    } catch (error) {
        await client.query('ROLLBACK'); // Assurer l'annulation en cas d'erreur
        console.error("Erreur API /formations/checkout:", error);
        return NextResponse.json({ message: "Erreur interne du serveur." }, { status: 500 });
    } finally {
        client.release();
    }
}