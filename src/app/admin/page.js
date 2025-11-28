'use client';

import { useState, useEffect } from 'react'; // On importe les hooks de base de React
import moment from 'moment';
import 'moment/locale/fr';
import { motion } from 'framer-motion';
import { DollarSign, Users, Calendar, Video, Clock, CheckCircle, X, Check, Loader, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

moment.locale('fr');

const StatCard = ({ icon, title, value, color, isLoading }) => (
    <div className={`bg-white p-6 rounded-2xl shadow-sm flex items-center gap-6 border-l-4 ${color}`}>
        <div className={`p-3 rounded-full bg-opacity-10 ${color.replace('border-', 'bg-')}`}>{icon}</div>
        <div>
            {isLoading ? (
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            ) : (
                <p className="text-3xl font-bold">{value}</p>
            )}
            <p className="text-gray-500">{title}</p>
        </div>
    </div>
);

export default function AdminDashboard() {
    // Étape 1: Remplacer useSWR par des états manuels
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Étape 2: Créer notre propre fonction pour récupérer les données
    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/admin/dashboard');
            if (!response.ok) {
                throw new Error("Erreur réseau ou serveur.");
            }
            const jsonData = await response.json();
            setData(jsonData); // Mettre à jour les données
            setError(null);    // Nettoyer les erreurs précédentes
        } catch (err) {
            setError(err.message); // Stocker le message d'erreur
        }
    };

    // Étape 3: Utiliser useEffect pour le chargement initial et le rafraîchissement
    useEffect(() => {
        // Fonction pour le chargement initial qui gère l'état de chargement global
        const initialLoad = async () => {
            setIsLoading(true);
            await fetchDashboardData();
            setIsLoading(false);
        };

        initialLoad();

        // Mettre en place un intervalle pour rafraîchir les données toutes les 30 secondes
        const intervalId = setInterval(() => {
            fetchDashboardData(); // On rafraîchit sans montrer le loader principal
        }, 30000);

        // Nettoyer l'intervalle quand le composant est retiré de l'écran
        return () => clearInterval(intervalId);
    }, []); // Le tableau vide [] assure que cet effet ne se lance qu'une fois au montage

    const handleUpdateAppointmentStatus = (id, newStatus) => {
        const promise = fetch(`/api/admin/appointments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });

        toast.promise(promise, {
            loading: 'Mise à jour...',
            success: (res) => {
                if (!res.ok) throw new Error('La mise à jour a échoué.');
                // On appelle notre fonction manuelle pour rafraîchir les données
                fetchDashboardData();
                return `Rendez-vous ${newStatus}.`;
            },
            error: 'La mise à jour a échoué.',
        });
    };

    if (isLoading) {
        // Affiche un loader simple pendant le tout premier chargement
        return <div className="flex justify-center items-center h-screen"><Loader className="w-16 h-16 animate-spin text-[#af4d30]" /></div>;
    }

    if (error) {
        return <div className="text-center text-red-500 p-10"><AlertTriangle className="mx-auto h-10 w-10 mb-4" />{error}</div>;
    }

    // Si les données ne sont pas encore arrivées (même après le loading), on n'affiche rien pour éviter un crash
    if (!data) {
        return null; 
    }

    const recentActivityIcon = (type) => {
        switch(type) {
            case 'new_client': return <Users size={16} className="text-blue-500"/>;
            case 'new_purchase': return <Video size={16} className="text-indigo-500"/>;
            default: return <CheckCircle size={16} className="text-gray-500"/>;
        }
    };

    return (
        <div>
            <Toaster position="bottom-right" />
            <h1 className="text-3xl font-bold mb-8">Tableau de Bord</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard icon={<DollarSign/>} title="Revenus (30j)" value={`${data.stats.revenue}€`} color="border-green-500"/>
                <StatCard icon={<Users/>} title="Nouveaux Clients (30j)" value={data.stats.newClients} color="border-blue-500"/>
                <StatCard icon={<Calendar/>} title="RDV en attente" value={data.stats.pendingAppointments} color="border-amber-500"/>
                <StatCard icon={<Video/>} title="Formations vendues (30j)" value={data.stats.coursesSold} color="border-indigo-500"/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm">
                    <h2 className="text-xl font-bold mb-4">Actions rapides : {`${data.quickActions.pendingAppointments.length} RDV en attente`}</h2>
                    <div className="space-y-3">
                        {data.quickActions.pendingAppointments.length > 0 ? data.quickActions.pendingAppointments.map(rdv => (
                             <div key={rdv.id} className="grid grid-cols-1 md:grid-cols-4 items-center p-3 bg-gray-50 rounded-lg gap-2">
                                <div className="col-span-2">
                                    <p className="font-bold">{rdv.service}</p>
                                    <p className="text-sm text-gray-500">{rdv.clientName}</p>
                                </div>
                                <p className="text-sm text-gray-600">{moment(rdv.date).format('D MMM YYYY, HH:mm')}</p>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => handleUpdateAppointmentStatus(rdv.id, 'annulé')} className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200" title="Annuler"><X size={16}/></button>
                                    <button onClick={() => handleUpdateAppointmentStatus(rdv.id, 'confirmé')} className="p-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200" title="Accepter"><Check size={16}/></button>
                                </div>
                            </div>
                        )) : <p className="text-gray-500 text-center py-4">Aucun rendez-vous en attente.</p>}
                    </div>
                    <Link href="/admin/rdv" className="mt-4 inline-block font-semibold text-sm text-[#af4d30] hover:underline">
                        Voir tous les rendez-vous →
                    </Link>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <h2 className="text-xl font-bold mb-4">Activité récente</h2>
                    <ul className="space-y-3">
                        {data.recentActivity.map((activity, index) => (
                            <li key={index} className="flex items-start gap-3 text-sm">
                                <span className="mt-1">{recentActivityIcon(activity.type)}</span>
                                <div>
                                    <span>
                                        {activity.type === 'new_client' && `Nouveau client : `}
                                        {activity.type === 'new_purchase' && `Nouvel achat : `}
                                        <strong>{activity.primaryText}</strong>
                                    </span>
                                    {activity.secondaryText && <span className="text-gray-500 block text-xs">par {activity.secondaryText}</span>}
                                </div>
                            </li>
                        ))}
                         {data.recentActivity.length === 0 && <p className="text-gray-500 text-center py-4">Aucune activité récente.</p>}
                    </ul>
                </div>
            </div>
        </div>
    );
}