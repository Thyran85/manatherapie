'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const SetPasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { update } = useSession();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }
        if (password !== confirm) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/set-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Erreur lors de la mise à jour.');
            // Force le rafraîchissement de la session pour supprimer needsPassword
            await update({ needsPassword: false });
            router.push('/compte');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative z-[2] min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <motion.div
                    className="bg-white rounded-2xl shadow-xl p-8"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <div className="text-center mb-8">
                        <Link href="/" className="relative block h-20 w-20 mx-auto rounded-full overflow-hidden">
                            <Image src="/images/logo.jpeg" alt="manatherapy logo" fill className="object-cover" />
                        </Link>
                        <div className="flex justify-center mt-4 mb-3">
                            <div className="bg-[#fdf5f2] p-3 rounded-full">
                                <KeyRound size={32} className="text-[#C87A5E]" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-[#1f2937]">Définissez votre mot de passe</h1>
                        <p className="text-gray-500 text-sm mt-2">
                            Votre compte a été créé via Google.<br />
                            Créez un mot de passe pour vous connecter aussi avec votre email.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Nouveau mot de passe"
                                className="w-full text-sm pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C87A5E] transition-all"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1f2937]">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Confirmer le mot de passe"
                                className="w-full text-sm pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C87A5E] transition-all"
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                required
                            />
                        </div>

                        <p className="text-xs text-gray-400">Minimum 8 caractères.</p>

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#1f2937] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#C87A5E] transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Enregistrement…' : 'Enregistrer mon mot de passe'}
                        </button>

                        <p className="text-center text-sm text-gray-500">
                            Vous pouvez aussi{' '}
                            <Link href="/compte" className="text-[#C87A5E] font-semibold hover:underline">
                                passer cette étape
                            </Link>{' '}
                            et le faire plus tard depuis votre compte.
                        </p>
                    </form>
                </motion.div>
            </div>
        </main>
    );
};

export default SetPasswordPage;
