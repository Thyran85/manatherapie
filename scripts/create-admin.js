#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const loadLocalEnv = () => {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
};

loadLocalEnv();

const args = process.argv.slice(2);
const cli = {};
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : '';
    cli[key] = value;
    if (value) i += 1;
  }
}

const email = cli.email || process.env.ADMIN_EMAIL;
const password = cli.password || process.env.ADMIN_PASSWORD;
const displayName = cli.name || process.env.ADMIN_NAME || 'Admin';
const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('POSTGRES_URL est manquant dans l’environnement.');
  process.exit(1);
}

if (!email || !password) {
  console.error('Usage: node scripts/create-admin.js --email <email> --password <password> [--name "Nom"]');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Le mot de passe doit faire au moins 8 caractères.');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const colsResult = await client.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'users'`
    );
    const columns = new Set(colsResult.rows.map((r) => r.column_name));
    const nameColumn = columns.has('name') ? 'name' : (columns.has('full_name') ? 'full_name' : null);

    if (!nameColumn || !columns.has('email') || !columns.has('password_hash') || !columns.has('role')) {
      throw new Error('La table users doit contenir: email, password_hash, role et name/full_name.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Politique: un seul admin dans tout le système.
    const admins = await client.query(`SELECT id, email FROM users WHERE role = 'ADMIN' ORDER BY id ASC`);
    const targetByEmail = await client.query('SELECT id FROM users WHERE email = $1', [email]);

    let userId;
    if (admins.rows.length > 1) {
      throw new Error('Plusieurs admins détectés en base. Nettoyez la table users pour ne garder qu\'un seul role=ADMIN.');
    }

    if (admins.rows.length === 1) {
      userId = admins.rows[0].id;
      const otherUserHasEmail =
        targetByEmail.rows.length > 0 && targetByEmail.rows[0].id !== userId;
      if (otherUserHasEmail) {
        throw new Error(`L'email ${email} est déjà utilisé par un autre compte.`);
      }

      await client.query(
        `UPDATE users
         SET ${nameColumn} = $1, email = $2, password_hash = $3, role = 'ADMIN'
         WHERE id = $4`,
        [displayName, email, passwordHash, userId]
      );
      console.log(`Admin unique mis à jour: ${email} (id=${userId})`);
    } else if (targetByEmail.rows.length > 0) {
      userId = targetByEmail.rows[0].id;
      await client.query(
        `UPDATE users
         SET ${nameColumn} = $1, password_hash = $2, role = 'ADMIN'
         WHERE id = $3`,
        [displayName, passwordHash, userId]
      );
      console.log(`Admin unique activé: ${email} (id=${userId})`);
    } else {
      const created = await client.query(
        `INSERT INTO users (${nameColumn}, email, password_hash, role)
         VALUES ($1, $2, $3, 'ADMIN')
         RETURNING id`,
        [displayName, email, passwordHash]
      );
      userId = created.rows[0].id;
      console.log(`Admin unique créé: ${email} (id=${userId})`);
    }

    await client.query('COMMIT');
  } finally {
    try { await client.query('ROLLBACK'); } catch (_) {}
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error('Erreur create-admin:', error.message);
  process.exit(1);
});
