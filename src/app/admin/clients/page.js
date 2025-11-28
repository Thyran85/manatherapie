'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, User, BookOpen, Calendar, Clock, Loader } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function AdminClientsPage() {
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date_desc');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Debounce pour la recherche afin de ne pas appeler l'API à chaque frappe
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500); // 500ms de délai
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Fetch des données à chaque changement du terme de recherche (délayé) ou du tri
    useEffect(() => {
        const fetchClients = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({
                    search: debouncedSearchTerm,
                    sortBy: sortBy,
                });
                const response = await fetch(`/api/admin/clients?${params.toString()}`);
                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des clients.');
                }
                const data = await response.json();
                setClients(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchClients();
    }, [debouncedSearchTerm, sortBy]);

    return (
        <div>
            <Toaster position="bottom-right" />
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-[#1f2937] mb-8">Gestion des Clients</h1>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    {/* Barre de recherche et filtres */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="relative md:col-span-2">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                            <input
                                type="text"
                                placeholder="Rechercher par nom ou email..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#af4d30] focus:border-transparent transition"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="py-2 px-3 border rounded-lg bg-white focus:ring-2 focus:ring-[#af4d30] focus:border-transparent transition"
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                        >
                            <option value="date_desc">Plus récents d'abord</option>
                            <option value="date_asc">Plus anciens d'abord</option>
                            <option value="name_asc">Nom (A-Z)</option>
                            <option value="name_desc">Nom (Z-A)</option>
                        </select>
                    </div>

                    {/* Affichage des données */}
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader className="w-12 h-12 animate-spin text-[#af4d30]" />
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500 py-10">{error}</div>
                    ) : clients.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">Aucun client trouvé pour ces critères.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b text-gray-500">
                                    <tr>
                                        <th className="p-4">Nom / Email</th>
                                        <th className="p-4">Formations</th>
                                        <th className="p-4">Rendez-vous</th>
                                        <th className="p-4">Inscrit le</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.map(client => (
                                        <tr key={client.id} className="border-b hover:bg-gray-50 transition-colors">
                                            <td className="p-4">
                                                <Link href={`/admin/clients/${client.id}`} className="block hover:text-[#af4d30]">
                                                    <p className="font-bold text-gray-800">{client.name}</p>
                                                    <p className="text-sm text-gray-500">{client.email}</p>
                                                </Link>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <BookOpen size={16} className="text-green-600"/>
                                                    <span>{client.accepted_courses} <span className="text-gray-500">acceptée(s)</span></span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Clock size={14} className="text-amber-600"/>
                                                    <span>{client.pending_courses} <span className="text-gray-500">en attente</span></span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={16} className="text-green-600"/>
                                                    <span>{client.confirmed_appointments} <span className="text-gray-500">confirmé(s)</span></span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Clock size={14} className="text-amber-600"/>
                                                    <span>{client.pending_appointments} <span className="text-gray-500">en attente</span></span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {new Date(client.created_at).toLocaleDateString('fr-FR')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}