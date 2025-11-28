'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext'; 
import { X, Plus, Minus, Tag } from 'lucide-react';
import { useSession } from 'next-auth/react';


export default function PanierPage() {
    const { cartItems, removeFromCart, clearCart } = useCart();
    const { data: session } = useSession(); // Récupérer la session client
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // États pour le formulaire de nouvel utilisateur
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0);
    const total = subtotal;

    const handleCheckout = async () => {
        setIsLoading(true);
        setError(null);
        
        // On ne peut acheter qu'une formation à la fois pour simplifier
        if (cartItems.length !== 1) {
            setError("Pour le moment, veuillez n'acheter qu'une seule formation à la fois.");
            setIsLoading(false);
            return;
        }

        const courseId = cartItems[0].id;
        
        let body = { courseId };

        // Si l'utilisateur n'est pas connecté, on ajoute ses détails
        if (!session) {
            if (!name || !email) {
                setError("Veuillez renseigner votre nom et votre email.");
                setIsLoading(false);
                return;
            }
            body.userDetails = { name, email };
        }

        try {
            const response = await fetch('/api/formations/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Une erreur est survenue.');
            }
            
            // Si Stripe est activé dans le futur, data.url contiendra l'URL de paiement
            if (data.url) {
                window.location.href = data.url;
            } else {
                // Pour notre simulation de paiement
                alert(data.message);
                clearCart();
                // Rediriger vers la page des formations du compte
                window.location.href = '/compte/formations';
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <main className=" bg-[#afd30]">
            <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center text-center overflow-hidden">
                {/* Fond avec le motif animé */}
                <div className="absolute inset-0 animate-pattern-scroll"></div>
                {/* Superposition sombre */}
                <div className="absolute inset-0 bg-[#1f2937]/80"></div>
                
                <div className="relative container mx-auto px-6">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-bold text-white mb-3"
                    >
                        Votre Panier
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-gray-300"
                    >
                        Vérifiez vos articles avant de finaliser votre commande.
                    </motion.p>
                </div>
            </section>
            <div className="bg-gray-50 py-16">
                <div className="container mx-auto px-6">
                    {cartItems.length === 0 ? (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-4">Votre panier est vide.</h2>
                            <Link href="/academie" className="text-[#af4d30] font-semibold hover:underline">
                                Découvrir nos formations
                            </Link>
                        </div>
                    ) : (
                        <div className="relative z-[2] grid grid-cols-1 lg:grid-cols-3 gap-12">
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
                                <div className="bg-white rounded-2xl shadow-sm">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="flex items-center p-6 border-b">
                                            <Image src={item.image_url} alt={item.title} width={96} height={96} className="rounded-lg object-cover"/>
                                            <div className="ml-6 flex-grow">
                                                <h3 className="font-bold">{item.title}</h3>
                                            </div>
                                            <p className="font-bold w-20 text-right">{(Number(item.price) || 0).toFixed(2)}€</p>
                                            <button onClick={() => removeFromCart(item.id)} className="ml-6 text-gray-400 hover:text-red-500"><X size={20}/></button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <div className="bg-white rounded-2xl shadow-sm p-8 sticky top-28">
                                    <h2 className="text-2xl font-bold mb-6">Récapitulatif</h2>
                                    {/* Formulaire pour les nouveaux utilisateurs */}
                                    {!session && (
                                        <div className="mb-6 space-y-4">
                                             <p className="text-sm text-gray-600">Vous n'êtes pas connecté. Renseignez vos informations pour créer votre compte.</p>
                                            <input type="text" placeholder="Votre nom complet" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border rounded-lg" required />
                                            <input type="email" placeholder="Votre adresse email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border rounded-lg" required />
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span>{total.toFixed(2)}€</span>
                                    </div>
                                    {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
                                    <button onClick={handleCheckout} disabled={isLoading} className="w-full text-center mt-6 bg-[#af4d30] text-white py-3 rounded-lg font-bold hover:bg-opacity-90 transition disabled:bg-gray-400">
                                        {isLoading ? 'Traitement...' : 'Procéder au paiement'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}