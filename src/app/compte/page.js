'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import moment from 'moment';

const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-[#af4d30]"></div>
    </div>
);

const fetcher = url => fetch(url).then(res => {
    if (!res.ok) throw new Error('Erreur de chargement des données du tableau de bord.');
    return res.json();
});

export default function DashboardPage() {

     const { data, error, isLoading } = useSWR('/api/dashboard', fetcher);

    if (isLoading) return <LoadingSpinner />;
    if (error) return (
        <div className="text-red-500 p-8 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 mb-2"/>{error.message}
        </div>
    );

    const { userName, nextAppointment, coursesCount, recentActivity, recentInvoices } = data;

    return (
        <div className="min-w-0 w-full overflow-hidden">
             <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-2xl sm:text-3xl font-bold text-[#1f2937] mb-6 sm:mb-8">
                Bonjour, {userName}!
            </motion.h1>

            <div className="relative z-[2]  grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* --- Carte Prochain Rendez-vous --- */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
                    <h2 className="font-bold text-xl mb-4">Votre prochain rendez-vous</h2>
                    {nextAppointment ? (
                        <div className="bg-gray-50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                            <div className="bg-[#af4d30] text-white p-3 sm:p-4 rounded-lg w-fit"><Calendar size={24}/></div>
                            <div>
                                <p className="font-bold text-lg">{nextAppointment.title}</p>
                                <p className="text-gray-600 flex items-center gap-2 text-sm sm:text-base">
                                    <Clock size={16}/> {moment(nextAppointment.start_time).format('dddd D MMMM [à] HH:mm')}
                                </p>
                                {nextAppointment.meet_link && <p className="text-sm text-blue-500 mt-1">Lien de la session disponible</p>}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">Vous n'avez aucun rendez-vous à venir.</p>
                        </div>
                    )}
                    <Link href="/compte/rendez-vous" className="mt-4 inline-block font-semibold text-[#af4d30] hover:underline">
                        Gérer tous mes rendez-vous →
                    </Link>
                </motion.div>

                {/* --- Carte Statistique Formations --- */}
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
                    <h2 className="font-bold text-xl mb-4">Vos Formations</h2>
                     <div className="text-center">
                        <p className="text-5xl sm:text-6xl font-extrabold text-[#af4d30]">{coursesCount}</p>
                        <p className="text-gray-600">Formations acquises</p>
                    </div>
                    <Link href="/compte/formations" className="mt-4 block text-center font-semibold text-[#af4d30] hover:underline">
                        Accéder à ma bibliothèque →
                    </Link>
                </motion.div>
            </div>

              <div className="mt-10 sm:mt-12 bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
                <h2 className="font-bold text-xl mb-4">Ma dernière activité</h2>
                {recentActivity && recentActivity.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                        {recentActivity.map((activity, index) => (
                            <li key={index} className="py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                                <p className="text-gray-800">{activity.message}</p>
                                <span className="text-sm text-gray-500">{moment(activity.created_at).fromNow()}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500">Aucune activité récente.</p>
                )}
                 <Link href="/compte/notifications" className="mt-4 inline-block font-semibold text-sm text-[#af4d30] hover:underline">
                    Voir toutes les notifications →
                </Link>
            </div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white mt-8 p-4 sm:p-6 rounded-2xl shadow-sm">
                <h2 className="font-bold text-xl mb-4">Mes Factures Récentes</h2>
                {recentInvoices && recentInvoices.length > 0 ? (
                    <div className="space-y-2 text-sm">
                        {recentInvoices.map((invoice, index) => (
                            <a href="#" key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-gray-600 hover:text-[#af4d30]">
                                <span>Facture du {moment(invoice.created_at).format('D MMM YYYY')} - {Number(invoice.amount).toFixed(2)}€</span>
                                <span>Télécharger</span>
                            </a>
                        ))}
                    </div>
                ) : (
                     <p className="text-sm text-gray-500">Aucune facture disponible.</p>
                )}
            </motion.div>


            {/* --- Suggestions et Accès Rapides --- */}
            <div className="mt-8">
                 <h2 className="font-bold text-xl mb-4">Accès rapide</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <Link href="/compte/rendez-vous" className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
                        <h3 className="font-bold text-lg">Prendre un nouveau rendez-vous</h3>
                        <p className="text-gray-500 text-sm">Consultez les disponibilités et réservez votre prochain soin ou coaching.</p>
                     </Link>
                     <Link href="/academie" className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
                         <h3 className="font-bold text-lg">Découvrir de nouvelles formations</h3>
                         <p className="text-gray-500 text-sm">Explorez le catalogue complet de l'académie pour continuer à vous former.</p>
                     </Link>
                 </div>
            </div>
        </div>
    );
}
