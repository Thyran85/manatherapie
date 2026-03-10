import nodemailer from 'nodemailer';

// Crée un "transporteur" réutilisable avec la configuration SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true pour le port 465, false pour les autres
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
});

const formatDateTimeFr = (dateValue) => {
    if (!dateValue) return '';
    return new Date(dateValue).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Fonction pour envoyer l'email de réinitialisation de mot de passe
export async function sendPasswordResetEmail({ to, link }) {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: to,
        subject: 'Réinitialisation de votre mot de passe pour Manatherapie',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Bonjour,</h2>
                <p>Vous avez demandé une réinitialisation de votre mot de passe.</p>
                <p>Veuillez cliquer sur le lien ci-dessous pour choisir un nouveau mot de passe. Ce lien expirera dans 1 heure.</p>
                <a href="${link}" style="background-color: #C87A5E; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Réinitialiser mon mot de passe
                </a>
                <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.</p>
                <p>Cordialement,<br/>L'équipe Manatherapie</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email de réinitialisation envoyé à:', to);
    } catch (error) {
        console.error("Échec de l'envoi de l'email:", error);
        throw new Error("Impossible d'envoyer l'email de réinitialisation.");
    }
}

export async function sendAppointmentConfirmationEmail({ to, serviceTitle, appointmentDate }) {
    const formattedDate = new Date(appointmentDate).toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: to,
        subject: `Confirmation de votre rendez-vous : ${serviceTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Bonjour,</h2>
                <p>Votre paiement a été reçu et votre rendez-vous est confirmé !</p>
                <p><strong>Service :</strong> ${serviceTitle}</p>
                <p><strong>Date et heure :</strong> ${formattedDate}</p>
                <p>Vous pouvez gérer vos rendez-vous depuis votre espace client.</p>
                <p>Cordialement,<br/>L'équipe Manatherapie</p>
            </div>
        `,
    };

    try {
        console.log(`Tentative d'envoi de l'email de confirmation à ${to}`);
        const info = await transporter.sendMail(mailOptions);
        console.log('Email de confirmation envoyé avec succès ! Réponse:', info.response);
    } catch (error) {
        console.error("ERREUR lors de l'envoi de l'email de confirmation:", error);
        // On ne bloque pas le processus si l'email échoue, on logue simplement l'erreur
    }
}

export async function sendAppointmentRequestEmail({ to, serviceTitle, appointmentDate, paymentLink }) {
    const formattedDate = new Date(appointmentDate).toLocaleDateString('fr-FR', {
        weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: to,
        subject: `Votre demande de rendez-vous pour ${serviceTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Bonjour,</h2>
                <p>Nous avons bien reçu votre demande de rendez-vous pour le service <strong>${serviceTitle}</strong> prévu le <strong>${formattedDate}</strong>.</p>
                <p>Pour confirmer définitivement votre créneau, veuillez procéder au paiement via le lien sécurisé ci-dessous :</p>
                <a href="${paymentLink}" style="background-color: #C87A5E; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Finaliser le paiement
                </a>
                <p>Ce lien est valide pour une durée limitée. Passé ce délai, votre créneau pourrait être à nouveau disponible.</p>
                <p>Cordialement,<br/>L'équipe Manatherapie</p>
            </div>
        `,
    };

    try {
        console.log(`Tentative d'envoi de l'email de demande de RDV à ${to}`);
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("ERREUR lors de l'envoi de l'email de demande de RDV:", error);
    }
}

export async function sendWelcomeEmail({ to, name, password }) {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: to,
        subject: 'Bienvenue chez Manatherapie ! Votre accès à vos formations.',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Bonjour ${name},</h2>
                <p>Merci pour votre achat et bienvenue chez Manatherapie !</p>
                <p>Un compte client a été créé pour vous permettre d'accéder à vos formations.</p>
                <p>Voici vos identifiants de connexion :</p>
                <ul>
                    <li><strong>Email :</strong> ${to}</li>
                    <li><strong>Mot de passe temporaire :</strong> ${password}</li>
                </ul>
                <p>Nous vous recommandons fortement de changer ce mot de passe dès votre première connexion.</p>
                <a href="${process.env.NEXTAUTH_URL}/auth/login" style="background-color: #C87A5E; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Accéder à mon compte
                </a>
                <p>À très bientôt dans votre espace de formation !</p>
                <p>Cordialement,<br/>L'équipe Manatherapie</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email de bienvenue envoyé à:', to);
    } catch (error) {
        console.error("Échec de l'envoi de l'email de bienvenue:", error);
        // On ne bloque pas le processus si l'email échoue, mais on logue l'erreur.
    }
}

export async function sendAppointmentStatusEmail({ to, clientName, serviceTitle, appointmentDate, status }) {
    const formattedDate = formatDateTimeFr(appointmentDate);
    const isConfirmed = status === 'confirmé';
    const statusLabel = isConfirmed ? 'confirmé' : 'annulé';

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject: `Mise à jour de votre rendez-vous : ${serviceTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Bonjour ${clientName || ''},</h2>
                <p>Le statut de votre rendez-vous a été mis à jour.</p>
                <p><strong>Service :</strong> ${serviceTitle}</p>
                <p><strong>Date et heure :</strong> ${formattedDate}</p>
                <p><strong>Nouveau statut :</strong> ${statusLabel}</p>
                <p>Cordialement,<br/>L'équipe Manatherapie</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Échec de l'envoi de l'email de statut du rendez-vous:", error);
    }
}

export async function sendAppointmentMeetLinkEmail({ to, clientName, serviceTitle, appointmentDate, meetLink }) {
    const formattedDate = formatDateTimeFr(appointmentDate);

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject: `Lien de votre session : ${serviceTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Bonjour ${clientName || ''},</h2>
                <p>Le lien de votre session est maintenant disponible.</p>
                <p><strong>Service :</strong> ${serviceTitle}</p>
                <p><strong>Date et heure :</strong> ${formattedDate}</p>
                <a href="${meetLink}" style="background-color: #C87A5E; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Rejoindre la session
                </a>
                <p style="margin-top: 12px;">Si le bouton ne fonctionne pas, copiez ce lien: ${meetLink}</p>
                <p>Cordialement,<br/>L'équipe Manatherapie</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Échec de l'envoi de l'email du lien de session:", error);
    }
}

export async function sendCourseStatusEmail({ to, clientName, courseTitle, status }) {
    const isAccepted = status === 'accepté';
    const statusLabel = isAccepted ? 'accepté' : 'refusé';

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject: `Mise à jour de votre formation : ${courseTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Bonjour ${clientName || ''},</h2>
                <p>Le statut de votre achat de formation a été mis à jour.</p>
                <p><strong>Formation :</strong> ${courseTitle}</p>
                <p><strong>Nouveau statut :</strong> ${statusLabel}</p>
                <p>Vous pouvez consulter votre espace client pour voir les détails.</p>
                <p>Cordialement,<br/>L'équipe Manatherapie</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Échec de l'envoi de l'email de statut de formation:", error);
    }
}

export async function sendVerificationEmail({ to, code }) {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject: 'Vérifiez votre adresse email — Manatherapie',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #1f2937;">Vérification de votre email</h2>
                <p>Bonjour,</p>
                <p>Merci de vous être inscrit sur <strong>Manatherapie</strong>. Pour activer votre compte, veuillez saisir le code ci-dessous sur la page de vérification :</p>
                <div style="text-align: center; margin: 32px 0;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #C87A5E; background: #fdf5f2; padding: 16px 24px; border-radius: 10px; border: 2px dashed #C87A5E;">${code}</span>
                </div>
                <p style="color: #6b7280; font-size: 14px;">Ce code est valable pendant <strong>15 minutes</strong>. Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
                <p>Cordialement,<br/>L'équipe Manatherapie</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email de vérification envoyé à:', to);
    } catch (error) {
        console.error("Échec de l'envoi de l'email de vérification:", error);
        throw new Error("Impossible d'envoyer l'email de vérification.");
    }
}

export async function sendAdminClientNotificationEmail({ to, clientName, message }) {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject: 'Nouveau message de l’administration Manatherapie',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Bonjour ${clientName || ''},</h2>
                <p>Vous avez reçu un nouveau message de l’administration :</p>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px;">
                    ${message}
                </div>
                <p style="margin-top: 12px;">Vous pouvez aussi retrouver cette notification dans votre espace client.</p>
                <p>Cordialement,<br/>L'équipe Manatherapie</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Échec de l'envoi de l'email de notification admin client:", error);
        throw new Error("Impossible d'envoyer l'email de notification.");
    }
}
