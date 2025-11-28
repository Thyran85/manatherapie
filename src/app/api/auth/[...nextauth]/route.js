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
    timeout: 10000, // Augmente le délai d'attente à 10 secondes
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
            // L'utilisateur n'existe pas ou s'est inscrit via Google
            throw new Error("Utilisateur non trouvé ou mot de passe non défini.");
          }

          const isValid = await bcrypt.compare(credentials.password, user.password_hash);

          if (!isValid) {
            throw new Error("Mot de passe incorrect.");
          }
          
          return user; // Succès

        } catch (e) {
          console.error("Authorize error:", e.message);
          return null; // Important: retourner null en cas d'erreur
        } finally {
          client.release();
        }
      }
    })
  ],

  session: {
    strategy: "jwt", // JWT est plus flexible que "database"
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },

  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };