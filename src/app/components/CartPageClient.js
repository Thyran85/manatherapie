'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { X, Tag } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export default function CartPageClient() {
    const { cartItems, removeFromCart, clearCart } = useCart();
    const { data: session } = useSession();
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0);
    const total = subtotal;

    const handleCheckout = async () => {
        setIsLoading(true);
        setError(null);
        
        if (cartItems.length === 0) {
            setError("Votre panier est vide.");
            setIsLoading(false);
            return;
        }
        
        // Pour l'instant, on gère l'achat d'un seul article à la fois
        if (cartItems.length > 1) {
            setError("Pour le moment, veuillez n'acheter qu'une seule formation à la fois.");
            setIsLoading(false);
            return;
        }

        const courseId = cartItems[0].id;
        let body = { courseId };

        if (!session) {
            if (!name || !email) {
                setError("Veuillez renseigner votre nom et votre email.");
                setIsLoading(false);
                return;
            }
            body.userDetails = { name, email };
        }

        const toastId = toast.loading('Traitement de votre commande...');

        try {
            const response = await fetch('/api/formations/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Une erreur est survenue.');
            
            if (data.url) {
                toast.success('Redirection vers la page de paiement...', { id: toastId });
                window.location.href = data.url;
            } else {
                toast.success(data.message || 'Commande validée !', { id: toastId });
                clearCart();
                window.location.href = '/compte/formations';
            }

        } catch (err) {
            toast.error(err.message, { id: toastId });
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 py-16">
            <div className="container mx-auto px-6">
                {cartItems.length === 0 ? (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-bold mb-4">Votre panier est vide.</h2>
                        <p className="text-gray-600 mb-8">Il semble que vous n'ayez encore ajouté aucune formation.</p>
                        <Link href="/academie" className="bg-[#af4d30] text-white px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition-colors">
                            Découvrir nos formations
                        </Link>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-600 mb-8">Vous avez {cartItems.length} article(s) dans votre panier.</p>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
                                <div className="bg-white rounded-2xl shadow-sm">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="flex items-center p-4 sm:p-6 border-b">
                                            <Image src={item.image_url || '/images/placeholder.png'} alt={item.title} width={96} height={96} className="rounded-lg object-cover w-16 h-16 sm:w-24 sm:h-24"/>
                                            <div className="ml-4 sm:ml-6 flex-grow">
                                                <h3 className="font-bold text-md sm:text-lg">{item.title}</h3>
                                            </div>
                                            <p className="font-bold w-20 text-right text-md sm:text-lg">{(Number(item.price) || 0).toFixed(2)}€</p>
                                            <button onClick={() => removeFromCart(item.id)} className="ml-4 sm:ml-6 text-gray-400 hover:text-red-500"><X size={20}/></button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <div className="bg-white rounded-2xl shadow-sm p-8 sticky top-28">
                                    <h2 className="text-2xl font-bold mb-6">Récapitulatif</h2>
                                    {!session && (
                                        <div className="mb-6 space-y-4 border-b pb-6">
                                            <p className="text-sm text-gray-600">Vous n'êtes pas connecté. Renseignez vos informations pour créer votre compte lors du paiement.</p>
                                            <input type="text" placeholder="Votre nom complet" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border rounded-lg" required />
                                            <input type="email" placeholder="Votre adresse email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border rounded-lg" required />
                                        </div>
                                    )}
                                    <div className="flex justify-between items-baseline font-bold text-[#1f2937]">
                                        <span className="text-lg">Total</span>
                                        <span className="text-3xl">{total.toFixed(2)}€</span>
                                    </div>
                                    {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
                                    <button onClick={handleCheckout} disabled={isLoading} className="w-full text-center mt-6 bg-[#af4d30] text-white py-3 rounded-lg font-bold hover:bg-opacity-90 transition disabled:bg-gray-400">
                                        {isLoading ? 'Traitement...' : 'Procéder au paiement'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}