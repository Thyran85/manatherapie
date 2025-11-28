// src/app/auth/login/page.js
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter,useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/compte'; // Par défaut, on va sur /compte


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // On utilise la fonction signIn de Next-Auth pour la connexion par email/mot de passe
        const result = await signIn('credentials', {
            redirect: false, // Important: on ne redirige pas automatiquement
            email: email,
            password: password,
        });

        setLoading(false);

        if (result.error) {
            setError('Email ou mot de passe incorrect.');
        } else if (result.ok) {
            router.push(callbackUrl); // Redirection manuelle en cas de succès
        }
    };


    return (
        <main className="relative z-[2]  min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <motion.div 
                    className="bg-white rounded-2xl shadow-xl p-8"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <div className="text-center mb-8">
                        <Link href="/" className="relative block h-20 w-20 mx-auto rounded-full overflow-hidden">
                                                <Image src="/images/logo.jpeg" alt="manatherapy logo" fill className="object-cover"/>
                                            </Link>

                        <h1 className="text-3xl font-bold text-[#1f2937] mt-4">Bon retour</h1>
                        <p className="text-gray-500">Connectez-vous pour continuer.</p>
                    </div>

                    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 }} }}>
                        <motion.button 
                            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }}} 
                            className="w-full flex items-center justify-center gap-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            onClick={() => signIn('google', { callbackUrl: callbackUrl })}
                        >
                            <Image src="/google-icon.png" width={20} height={20} alt="Google Icon"/>
                            <span className="font-semibold text-sm text-[#1f2937]">Continuer avec Google</span>
                        </motion.button>

                        <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 }}} className="flex items-center gap-4 my-6">
                            <div className="flex-grow h-px bg-gray-200"></div><span className="text-gray-400 text-xs uppercase">Ou</span><div className="flex-grow h-px bg-gray-200"></div>
                        </motion.div>

                        <motion.form onSubmit={handleSubmit} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }}} className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                                <input 
                                    type="email" 
                                    placeholder="Email" 
                                    className="w-full text-sm pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C87A5E] transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Mot de passe" 
                                    className="w-full text-sm pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C87A5E] transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1f2937]">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                            </div>
                            <div className="text-right">
    <Link href="/auth/forgot-password" className="text-xs font-semibold text-[#C87A5E] hover:underline">
        Mot de passe oublié ?
    </Link>
</div>
                            
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            
                            <button type="submit" disabled={loading} className="w-full bg-[#1f2937] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#C87A5E] transition-colors disabled:opacity-50">
                                {loading ? 'Connexion...' : 'Se Connecter'}
                            </button>
                        </motion.form>
                    </motion.div>
                </motion.div>
                
                <p className="text-center mt-6 text-sm text-gray-600">
                    Pas encore de compte ? <Link href="/auth/register" className="font-bold text-[#C87A5E] hover:underline">Inscrivez-vous</Link>
                </p>
            </div>
        </main>
    );
};

export default LoginPage;