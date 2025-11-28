'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import Image from 'next/image';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        const res = await fetch('/api/auth/request-reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        const data = await res.json();
        setLoading(false);

        if (!res.ok) {
            setError(data.message || "Une erreur s'est produite.");
        } else {
            setMessage(data.message);
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
                        <h1 className="text-3xl font-bold text-[#1f2937]">Mot de passe oublié ?</h1>
                        <p className="text-gray-500 mt-2">Pas de souci. Entrez votre email et nous vous enverrons un lien pour le réinitialiser.</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full text-sm pl-10 pr-4 py-3 bg-gray-50 rounded-lg"/>
                        </div>
                        {message && <p className="text-green-600 text-sm text-center">{message}</p>}
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <button type="submit" disabled={loading} className="w-full bg-[#1f2937] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#C87A5E] disabled:opacity-50">
                            {loading ? 'Envoi...' : 'Envoyer le lien'}
                        </button>
                    </form>
                    <p className="text-center mt-6 text-sm">
                        <Link href="/auth/login" className="font-bold text-[#C87A5E] hover:underline">Retour à la connexion</Link>
                    </p>
                </motion.div>
            </div>
        </main>
    );
};


export default ForgotPasswordPage;