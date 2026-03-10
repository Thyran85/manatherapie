'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyEmailContent() {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef([]);
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';

    useEffect(() => {
        if (resendCooldown > 0) {
            const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [resendCooldown]);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newCode = [...code];
        for (let i = 0; i < pasted.length; i++) newCode[i] = pasted[i];
        setCode(newCode);
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fullCode = code.join('');
        if (fullCode.length < 6) {
            setError('Veuillez saisir les 6 chiffres du code.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: fullCode }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Erreur de vérification.');
            setSuccess(true);
            setTimeout(() => router.push('/auth/login?status=verified'), 2500);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setResendLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Erreur lors de l\'envoi.');
            setResendCooldown(60);
        } catch (err) {
            setError(err.message);
        } finally {
            setResendLoading(false);
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
                                <ShieldCheck size={32} className="text-[#C87A5E]" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-[#1f2937]">Vérifiez votre email</h1>
                        <p className="text-gray-500 text-sm mt-2">
                            Un code à 6 chiffres a été envoyé à<br />
                            <span className="font-semibold text-[#1f2937]">{email}</span>
                        </p>
                    </div>

                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-6"
                        >
                            <div className="text-4xl mb-3">✅</div>
                            <p className="text-green-600 font-semibold text-lg">Email vérifié !</p>
                            <p className="text-gray-500 text-sm mt-1">Redirection vers la connexion…</p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                                {code.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={el => inputRefs.current[i] = el}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={e => handleChange(i, e.target.value)}
                                        onKeyDown={e => handleKeyDown(i, e)}
                                        className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-[#C87A5E] focus:ring-2 focus:ring-[#C87A5E]/20 outline-none transition-all bg-gray-50"
                                        autoFocus={i === 0}
                                    />
                                ))}
                            </div>

                            {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#1f2937] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#C87A5E] transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Vérification…' : 'Vérifier mon email'}
                            </button>

                            <div className="text-center mt-5">
                                <p className="text-gray-500 text-sm">Vous n'avez pas reçu le code ?</p>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={resendLoading || resendCooldown > 0}
                                    className="mt-1 flex items-center gap-1.5 mx-auto text-sm font-semibold text-[#C87A5E] hover:underline disabled:opacity-50 disabled:no-underline"
                                >
                                    <RefreshCw size={14} className={resendLoading ? 'animate-spin' : ''} />
                                    {resendCooldown > 0
                                        ? `Renvoyer dans ${resendCooldown}s`
                                        : resendLoading ? 'Envoi…' : 'Renvoyer le code'}
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
                <p className="text-center mt-6 text-sm text-gray-600">
                    <Link href="/auth/register" className="font-bold text-[#C87A5E] hover:underline">← Retour à l'inscription</Link>
                </p>
            </div>
        </main>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense>
            <VerifyEmailContent />
        </Suspense>
    );
}
