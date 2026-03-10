-- Script de migration : Vérification email
-- À exécuter UNE SEULE FOIS dans la base de données manatherapie_db
-- Commande: psql $POSTGRES_URL -f migration_auth.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS verification_code_expires TIMESTAMPTZ;

-- Marquer tous les comptes existants comme vérifiés
-- (ils se sont inscrits avant l'introduction de la vérification email)
UPDATE users SET email_verified = TRUE WHERE email_verified = FALSE;

-- Vérification
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('email_verified', 'verification_code', 'verification_code_expires');
