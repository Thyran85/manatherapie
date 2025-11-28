// src/middleware.js
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { jwtVerify } from 'jose';

const USER_SECRET = process.env.NEXTAUTH_SECRET;
const ADMIN_SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req) {
    const { pathname } = req.nextUrl;

    // --- LOGIQUE DE PROTECTION POUR TOUT L'ÉCOSYSTÈME ADMIN (Pages ET API) ---
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        // Les pages/routes de login sont des exceptions
        if (pathname === '/admin/login' || pathname === '/api/admin/login') {
            return NextResponse.next();
        }

        const adminToken = req.cookies.get('admin-token')?.value;

        if (!adminToken) {
            const url = req.nextUrl.clone();
            url.pathname = '/admin/login';
            // Pour les requêtes API, on renvoie une erreur JSON, pas une redirection.
            if (pathname.startsWith('/api/admin')) {
                return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
            }
            return NextResponse.redirect(url);
        }

        try {
            const { payload } = await jwtVerify(adminToken, ADMIN_SECRET_KEY);
            if (payload.role !== 'ADMIN') throw new Error("Rôle non autorisé");
            
            // Si le token est valide, on laisse passer la requête.
            return NextResponse.next();

        } catch (error) {
            const url = req.nextUrl.clone();
            url.pathname = '/admin/login';
            if (pathname.startsWith('/api/admin')) {
                return NextResponse.json({ message: 'Token invalide ou expiré' }, { status: 401 });
            }
            const response = NextResponse.redirect(url);
            response.cookies.delete('admin-token'); // Nettoyer le cookie invalide
            return response;
        }
    }

    // --- LOGIQUE DE PROTECTION POUR L'ESPACE CLIENT ---
    if (pathname.startsWith('/compte') || pathname.startsWith('/api/compte')) {
        const sessionToken = await getToken({ req, secret: USER_SECRET });
        if (!sessionToken) {
            const url = req.nextUrl.clone();
            url.pathname = '/auth/login';
             if (pathname.startsWith('/api/compte')) {
                return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
            }
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

// Mettre à jour le matcher pour inclure les routes API
export const config = {
    matcher: [
        '/admin/:path*', 
        '/api/admin/:path*',
        '/compte/:path*',
        '/api/compte/:path*',
    ],
};