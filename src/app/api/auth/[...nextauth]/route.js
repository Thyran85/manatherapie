import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { Pool } from "pg";
import PostgresAdapter from "@auth/pg-adapter";
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export const authOptions = {
  adapter: PostgresAdapter(pool),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      httpOptions: {
        timeout: 10000,
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Données invalides.");
        }

        const client = await pool.connect();
        try {
          const result = await client.query('SELECT * FROM users WHERE email = $1', [credentials.email]);
          const user = result.rows[0];

          if (!user || !user.password_hash) {
            // L'utilisateur n'existe pas ou s'est inscrit via Google (sans mot de passe)
            throw new Error("Utilisateur non trouvé ou mot de passe non défini.");
          }

          // Vérification de l'email obligatoire avant connexion
          if (!user.email_verified) {
            throw new Error("EMAIL_NOT_VERIFIED");
          }

          const isValid = await bcrypt.compare(credentials.password, user.password_hash);

          if (!isValid) {
            throw new Error("Mot de passe incorrect.");
          }
          
          return user;

        } catch (e) {
          console.error("Authorize error:", e.message);
          throw e; // On relance l'erreur pour qu'elle soit accessible côté client
        } finally {
          client.release();
        }
      }
    })
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },

  callbacks: {
    async signIn({ user, account }) {
      // Pour les connexions Google : on s'assure que email_verified est TRUE dans la DB
      // (NextAuth via l'adapter créera l'utilisateur s'il n'existe pas)
      if (account?.provider === 'google') {
        try {
          const client = await pool.connect();
          try {
            await client.query(
              'UPDATE users SET email_verified = TRUE WHERE email = $1',
              [user.email]
            );
          } finally {
            client.release();
          }
        } catch (e) {
          console.error("Erreur mise à jour email_verified Google:", e.message);
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }

      // Detect si c'est une connexion Google et que le user n'a pas de password_hash
      if (account?.provider === 'google') {
        try {
          const client = await pool.connect();
          try {
            const result = await client.query('SELECT password_hash FROM users WHERE email = $1', [token.email]);
            const dbUser = result.rows[0];
            token.needsPassword = !dbUser?.password_hash;
          } finally {
            client.release();
          }
        } catch (e) {
          console.error("Erreur vérification password_hash:", e.message);
          token.needsPassword = false;
        }
      }

      // Permettre de réinitialiser needsPassword après que le user a défini son mot de passe
      if (account === null && token.needsPassword) {
        try {
          const client = await pool.connect();
          try {
            const result = await client.query('SELECT password_hash FROM users WHERE email = $1', [token.email]);
            token.needsPassword = !result.rows[0]?.password_hash;
          } finally {
            client.release();
          }
        } catch (e) {
          console.error("Erreur refresh needsPassword:", e.message);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.needsPassword = token.needsPassword ?? false;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };