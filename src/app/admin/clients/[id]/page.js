'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Check, X, Loader, AlertTriangle, Bell, BookOpen, Calendar } from 'lucide-react';

const fetcher = url => fetch(url).then(res => {
    if (!res.ok) throw new Error("Impossible de charger les données du client.");
    return res.json();
});

export default function AdminClientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id: clientId } = params;

    const { data, error, isLoading, mutate } = useSWR(clientId ? `/api/admin/clients/${clientId}` : null, fetcher);

    const [notificationMessage, setNotificationMessage] = useState('');

    const handleUpdateStatus = async (type, itemId, newStatus) => {
        const endpoint = type === 'course'
            ? `/api/admin/user-courses/${itemId}`
            : `/api/admin/appointments/${itemId}`;
        
        const promise = fetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });

        toast.promise(promise, {
            loading: 'Mise à jour en cours...',
            success: (res) => {
                if (!res.ok) throw new Error('La mise à jour a échoué.');
                mutate(); // Re-valide les données SWR pour rafraîchir l'UI
                return `Statut mis à jour avec succès !`;
            },
            error: 'Une erreur est survenue.',
        });
    };

    const handleSendNotification = async () => {
        if (!notificationMessage.trim()) {
            toast.error("Le message de notification ne peut pas être vide.");
            return;
        }
        const promise = fetch(`/api/admin/clients/${clientId}/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: notificationMessage }),
        });

        toast.promise(promise, {
            loading: 'Envoi de la notification...',
            success: (res) => {
                if (!res.ok) throw new Error("L'envoi a échoué.");
                setNotificationMessage(''); // Vider le champ
                return 'Notification envoyée !';
            },
            error: "L'envoi a échoué.",
        });
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader className="w-16 h-16 animate-spin text-[#af4d30]" /></div>;
    if (error) return <div className="text-center text-red-500 p-10"><AlertTriangle className="mx-auto h-10 w-10 mb-4" />{error.message}</div>;

    return (
        <div>
            <Toaster position="bottom-right" />
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Link href="/admin/clients" className="flex items-center gap-2 text-gray-500 hover:text-[#af4d30] font-semibold mb-6">
                    <ArrowLeft size={20} />
                    Retour à la liste des clients
                </Link>
                
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[#1f2937]">{data.profile.name}</h1>
                    <p className="text-gray-500">{data.profile.email}</p>
                </div>
            </motion.div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Colonne principale avec les listes */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Section Rendez-vous */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-2xl shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Calendar/> Rendez-vous</h2>
                        {data.appointments.length > 0 ? (
                            <div className="space-y-3">
                                {data.appointments.map(rdv => (
                                    <div key={rdv.id} className="p-3 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                                        <div>
                                            <p className="font-semibold">{rdv.title}</p>
                                            <p className="text-sm text-gray-500">{new Date(rdv.start_time).toLocaleString('fr-FR')}</p>
                                        </div>
                                        <div className="text-center">
                                            <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${rdv.status === 'confirmé' ? 'bg-green-100 text-green-700' : rdv.status === 'en attente' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{rdv.status}</span>
                                        </div>
                                        {rdv.status === 'en attente' && (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleUpdateStatus('appointment', rdv.id, 'annulé')} className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"><X size={16}/></button>
                                                <button onClick={() => handleUpdateStatus('appointment', rdv.id, 'confirmé')} className="p-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200"><Check size={16}/></button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-gray-500 text-center py-4">Aucun rendez-vous trouvé.</p>}
                    </motion.div>

                    {/* Section Formations */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><BookOpen/> Formations Achetées</h2>
                        {data.courses.length > 0 ? (
                            <div className="space-y-3">
                                {data.courses.map(course => (
                                    <div key={course.purchase_id} className="p-3 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-3 items-center gap-2">
                                        <p className="font-semibold">{course.title}</p>
                                        <div className="text-center">
                                            <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${course.status === 'accepté' ? 'bg-green-100 text-green-700' : course.status === 'en attente' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{course.status}</span>
                                        </div>
                                        {course.status === 'en attente' && (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleUpdateStatus('course', course.purchase_id, 'annulé')} className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"><X size={16}/></button>
                                                <button onClick={() => handleUpdateStatus('course', course.purchase_id, 'accepté')} className="p-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200"><Check size={16}/></button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-gray-500 text-center py-4">Aucune formation achetée.</p>}
                    </motion.div>
                </div>
                
                {/* Colonne latérale pour les actions */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-8">
                     <div className="bg-white p-6 rounded-2xl shadow-sm sticky top-28">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Bell/> Notifier le client</h2>
                        <textarea
                            className="w-full p-2 border rounded-lg h-32"
                            placeholder="Écrivez un message personnalisé pour le client..."
                            value={notificationMessage}
                            onChange={(e) => setNotificationMessage(e.target.value)}
                        ></textarea>
                        <button 
                            onClick={handleSendNotification}
                            className="w-full mt-4 bg-[#af4d30] text-white py-2 rounded-lg font-bold hover:bg-opacity-90 transition flex items-center justify-center gap-2">
                            <Send size={16}/> Envoyer la Notification
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}