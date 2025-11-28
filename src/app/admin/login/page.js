'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault(); // Empêche le rechargement de la page
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Échec de la connexion.');
            }
            
            // Si la connexion réussit, on redirige vers le tableau de bord admin
            window.location.href = '/admin'; 
            // router.refresh(); // N'est pas toujours nécessaire, la redirection suffit souvent

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <motion.div 
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="relative z-[2] w-full max-w-md p-8 space-y-8 bg-white shadow-lg rounded-2xl"
            >
                <div className="text-center">
                    <Link href="/" className="relative block h-16 w-16 mx-auto rounded-full overflow-hidden">
                        <Image src="/images/logo.jpeg" alt="manatherapy logo" fill className="object-cover"/>
                    </Link>
                    <h2 className="mt-6 text-3xl font-bold text-[#1f2937]">Espace Administrateur</h2>
                    <p className="mt-2 text-gray-600">Connectez-vous pour gérer votre activité.</p>
                </div>
                {/* --- LA CORRECTION EST ICI --- */}
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="sr-only">Email</label>
                        <input id="email" name="email" type="email" autoComplete="email" required className="w-full px-4 py-3 border border-gray-200 rounded-lg" placeholder="Adresse e-mail" value={email}
                               onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">Mot de passe</label>
                        <input id="password" name="password" type="password" autoComplete="current-password" required className="w-full px-4 py-3 border border-gray-200 rounded-lg" placeholder="Mot de passe" value={password}
                               onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div>
                        <button type="submit" disabled={loading} className="w-full py-3 px-4 text-white font-semibold bg-[#af4d30] rounded-lg hover:bg-opacity-90 transition disabled:opacity-50">
                            {loading ? 'Connexion...' : 'Se Connecter'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}