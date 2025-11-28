import { randomBytes } from 'crypto';

/**
 * Génère un mot de passe aléatoire et sécurisé.
 * @param {number} length - La longueur du mot de passe souhaité.
 * @returns {string} Le mot de passe généré.
 */
export function generateTemporaryPassword(length = 10) {
    return randomBytes(Math.ceil(length / 2))
        .toString('hex') // Convertit en format hexadécimal
        .slice(0, length); // Coupe à la longueur désirée
}