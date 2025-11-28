'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

// Un composant interne pour utiliser les hooks client
function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }
        if (!token) {
            setError("Token de réinitialisation manquant ou invalide.");
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password }),
        });

        const data = await res.json();
        setLoading(false);

        if (!res.ok) {
            setError(data.message || "Une erreur s'est produite.");
        } else {
            setMessage(data.message);
            setTimeout(() => router.push('/auth/login'), 3000);
        }
    };

    return (
        <main className="relative z-[2] min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                 <motion.div 
                    className="bg-white rounded-2xl shadow-xl p-8"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className="text-center mb-8">
                        <Link href="/" className="relative block h-20 w-20 mx-auto rounded-full overflow-hidden">
                                                                        <Image src="/images/logo.jpeg" alt="manatherapy logo" fill className="object-cover"/>
                                                                    </Link>
                        <h1 className="text-3xl font-bold text-[#1f2937]">Réinitialiser le mot de passe</h1>
                        <p className="text-gray-500 mt-2">Choisissez un nouveau mot de passe sécurisé.</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                            <input type={showPassword ? "text" : "password"} placeholder="Nouveau mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full text-sm pl-10 pr-4 py-3 bg-gray-50 rounded-lg"/>
                             <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1f2937]">
                                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                            </button>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                            <input  type={showConfirmPassword ? "text" : "password"} placeholder="Confirmer le mot de passe" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full text-sm pl-10 pr-4 py-3 bg-gray-50 rounded-lg"/>
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1f2937]">
                                {showConfirmPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                            </button>
                        </div>
                        
                        {message && <p className="text-green-600 text-sm text-center">{message}</p>}
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                        <button type="submit" disabled={loading || !token} className="w-full bg-[#1f2937] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#C87A5E] disabled:opacity-50">
                            {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </main>
    );
}

// Le composant principal exporté utilise Suspense pour le rendu côté serveur
export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}