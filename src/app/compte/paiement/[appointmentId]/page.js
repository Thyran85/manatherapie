'use client';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { CheckCircle, CreditCard, Loader, AlertTriangle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const fetcher = url => fetch(url).then(res => res.json());

export default function PaiementPage() {
    const router = useRouter();
    const { appointmentId } = useParams();
    
    // On récupère les détails du RDV à payer
    const { data: appointment, error } = useSWR(`/api/appointments/${appointmentId}`, fetcher);
    
    const handlePayment = async () => {
        const toastId = toast.loading("Préparation du paiement...");
        try {
            // On appelle une nouvelle API pour créer la session Stripe
            const res = await fetch('/api/checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointmentId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            toast.success("Redirection...", { id: toastId });
            router.push(data.url); // Redirection vers Stripe
        } catch (err) {
            toast.error(err.message || "Impossible de lancer le paiement.", { id: toastId });
        }
    };

    if (error) return <div className="p-8 text-center"><AlertTriangle className="mx-auto h-12 w-12 text-red-400" />Erreur de chargement.</div>;
    if (!appointment) return <div className="p-8 text-center"><Loader className="mx-auto h-12 w-12 animate-spin" />Chargement...</div>;

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <Toaster />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
            >
                <div className="text-center">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                    <h1 className="text-3xl font-bold text-gray-800 mt-4">Confirmez votre Rendez-vous</h1>
                    <p className="text-gray-500 mt-2">Veuillez vérifier les détails et procéder au paiement pour confirmer votre créneau.</p>
                </div>

                <div className="mt-8 space-y-4 border-t border-b py-6">
                    <div className="flex justify-between"><span className="text-gray-600">Service</span><span className="font-semibold">{appointment.serviceTitle}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Date</span><span className="font-semibold">{new Date(appointment.startTime).toLocaleDateString('fr-FR')}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Heure</span><span className="font-semibold">{new Date(appointment.startTime).toLocaleTimeString('fr-FR')}</span></div>
                </div>

                <div className="mt-6">
                    <div className="flex justify-between items-baseline font-bold text-gray-800">
                        <span>{appointment.isAcompte ? 'Acompte à payer' : 'Total à payer'}</span>
                        <span className="text-3xl">{Number(appointment.amountToPay).toFixed(2)}€</span>
                    </div>
                </div>
                
                <button onClick={handlePayment} className="w-full mt-8 bg-[#af4d30] text-white py-3 rounded-lg font-bold hover:bg-opacity-90 flex items-center justify-center gap-2">
                    <CreditCard size={20} />
                    Payer maintenant
                </button>
            </motion.div>
        </main>
    );
}