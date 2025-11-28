'use client';

import { useState, useEffect } from 'react';
import { BarChart, DollarSign, Users, Video, Loader, AlertTriangle } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';

// Enregistrement des composants Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement);

// --- COMPOSANTS ---

const StatCard = ({ icon, title, value, isLoading }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4 mb-2">
            {icon}
            <p className="text-gray-500">{title}</p>
        </div>
        {isLoading ? (
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse mt-1"></div>
        ) : (
            <p className="text-4xl font-bold">{value}</p>
        )}
    </div>
);

const SkeletonLoader = () => (
    <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="h-32 bg-gray-200 rounded-2xl"></div>
            <div className="h-32 bg-gray-200 rounded-2xl"></div>
            <div className="h-32 bg-gray-200 rounded-2xl"></div>
            <div className="h-32 bg-gray-200 rounded-2xl"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-80 bg-gray-200 rounded-2xl"></div>
            <div className="h-80 bg-gray-200 rounded-2xl"></div>
        </div>
    </div>
);

// --- PAGE PRINCIPALE ---

export default function StatsPage() {
    const [statsData, setStatsData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/admin/stats');
                if (!response.ok) {
                    throw new Error('Impossible de charger les statistiques.');
                }
                const data = await response.json();
                setStatsData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []); // Se lance une seule fois au chargement de la page

    // Préparation des données pour les graphiques (uniquement si les données sont chargées)
    const barData = {
        labels: statsData?.topCourses?.chart?.labels || [],
        datasets: [{
            label: '# de Ventes',
            data: statsData?.topCourses?.chart?.data || [],
            backgroundColor: 'rgba(175, 77, 48, 0.6)',
            borderColor: '#af4d30',
            borderWidth: 1,
            borderRadius: 5,
        }]
    };

    const lineData = {
        labels: statsData?.monthlyRevenue?.chart?.labels || [],
        datasets: [{
            label: 'Revenus Mensuels (€)',
            data: statsData?.monthlyRevenue?.chart?.data || [],
            borderColor: '#af4d30',
            backgroundColor: 'rgba(175, 77, 48, 0.1)',
            fill: true,
            tension: 0.4,
        }]
    };

    if (isLoading) {
        return (
            <div>
                <h1 className="text-3xl font-bold mb-8">Statistiques de Vente</h1>
                <SkeletonLoader />
            </div>
        );
    }

    if (error) {
        return <div className="text-center text-red-500 p-10"><AlertTriangle className="mx-auto h-10 w-10 mb-4" />{error}</div>;
    }
    
    // S'assurer que statsData existe avant de rendre le contenu
    if (!statsData) return null;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Statistiques de Vente</h1>
            
            {/* Cartes de KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard icon={<DollarSign/>} title="Revenu Total" value={statsData.keyMetrics.totalRevenue}/>
                <StatCard icon={<Users/>} title="Clients Actifs" value={statsData.keyMetrics.activeClients}/>
                <StatCard icon={<Video/>} title="Formations Vendues" value={statsData.keyMetrics.coursesSold}/>
                <StatCard icon={<BarChart/>} title="Taux de Conversion" value={statsData.keyMetrics.conversionRate}/>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <h2 className="text-xl font-bold mb-4">Top 5 des Formations (par ventes)</h2>
                    <div className="h-[350px]">
                        <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }}/>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <h2 className="text-xl font-bold mb-4">Revenus par Mois (6 derniers mois)</h2>
                    <div className="h-[350px]">
                        <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }}/>
                    </div>
                </div>
            </div>

             {/* Liste textuelle du Top 5 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm">
                <h2 className="text-xl font-bold mb-4">Classement des Formations</h2>
                {statsData.topCourses.list.length > 0 ? (
                    <ul className="space-y-3">
                        {statsData.topCourses.list.map((course, index) => (
                             <li key={index} className="flex justify-between items-center p-2 rounded-md transition-colors hover:bg-gray-50">
                                <span>{index + 1}. {course.title}</span>
                                <strong className="text-[#af4d30]">{course.sales_count} ventes</strong>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 text-center py-4">Aucune vente de formation enregistrée pour le moment.</p>
                )}
            </div>
        </div>
    );
}