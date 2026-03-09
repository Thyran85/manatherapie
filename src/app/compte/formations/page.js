'use client';

import { useState, useMemo,useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { courses } from '@/app/academie/academyData';
import { PlayCircle, Download, Search, Video, BookOpen, Clock, X } from 'lucide-react';

const purchasedCourses = [
    { ...courses[0], status: 'terminé' }, // Formation déjà validée
    { ...courses[3], status: 'terminé' },
    { ...courses[5], status: 'en attente' }, // Nouvelle formation en attente
];
const recommendedCourses = courses.filter(c => !purchasedCourses.find(pc => pc.id === c.id)).slice(0, 4);

// Mini-carte pour les recommandations
const RecommendedCourseCard = ({ course }) => (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group">
        <div className="relative h-40">
            <Image src={course.image_url || '/images/placeholder.png'} alt={course.title} fill className="object-cover"/>
        </div>
        <div className="p-4">
            <h4 className="font-bold text-md mb-2 truncate">{course.title}</h4>
            <div className="flex justify-between items-center">
                <p className="text-lg font-bold text-[#1f2937]">{course.price}</p>
                <Link href={`/academie/${course.slug}`} className="text-sm font-semibold text-[#af4d30] hover:underline">Voir</Link>
            </div>
        </div>
    </div>
);


export default function FormationsPage() {

    const [purchasedCourses, setPurchasedCourses] = useState([]);
    const [recommendedCourses, setRecommendedCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // États pour les filtres
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // 1. Récupérer les formations achetées par l'utilisateur
                const purchasedRes = await fetch('/api/compte/formations');
                if (!purchasedRes.ok) throw new Error('Impossible de charger vos formations.');
                const purchasedData = await purchasedRes.json();
                setPurchasedCourses(purchasedData);

                // 2. Récupérer TOUTES les formations pour les recommandations
                const allCoursesRes = await fetch('/api/formations');
                const allCoursesData = await allCoursesRes.json();

                // Filtrer pour ne recommander que les cours non achetés
                const purchasedIds = new Set(purchasedData.map(c => c.id));
                setRecommendedCourses(allCoursesData.filter(c => !purchasedIds.has(c.id)).slice(0, 4));

            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []); // Se déclenche une seule fois au chargement

    const filteredPurchased = useMemo(() => purchasedCourses.filter(c => 
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterType === 'all' || c.type === filterType)
    ), [searchTerm, filterType, purchasedCourses]);

    if (isLoading) return <div className="text-center py-10">Chargement de votre bibliothèque...</div>;
    if (error) return <div className="text-center py-10 text-red-500">Erreur : {error}</div>;

    return (
        <div>
            <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-[#1f2937] mb-8">
                Mes Formations
            </motion.h1>

            {/* --- Section des formations achetées --- */}
            <div className="relative z-2  bg-white p-6 rounded-2xl shadow-sm">
                <h2 className="text-xl font-bold mb-6">Ma Bibliothèque</h2>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                     <div className="relative grow">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input type="text" placeholder="Rechercher dans mes formations..." className="w-full pl-10 pr-4 py-2 border rounded-lg" onChange={e => setSearchTerm(e.target.value)}/>
                    </div>
                    <div className="shrink-0 flex gap-1 bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setFilterType('all')} className={`px-3 py-1 rounded-md text-sm font-semibold transition ${filterType === 'all' ? 'bg-white shadow-sm text-[#1f2937]' : 'text-gray-600'}`}>Tous</button>
                        <button onClick={() => setFilterType('video')} className={`px-3 py-1 rounded-md text-sm font-semibold transition ${filterType === 'video' ? 'bg-white shadow-sm text-[#1f2937]' : 'text-gray-600'}`}><Video size={16} className="inline mr-1"/> Vidéos</button>
                        <button onClick={() => setFilterType('ebook')} className={`px-3 py-1 rounded-md text-sm font-semibold transition ${filterType === 'ebook' ? 'bg-white shadow-sm text-[#1f2937]' : 'text-gray-600'}`}><BookOpen size={16} className="inline mr-1"/> Ebooks</button>
                    </div>
                </div>
                
                <div className="space-y-4">
                    {filteredPurchased.length > 0 ? filteredPurchased.map(course => (
                        <div key={course.id} className={`p-4 rounded-lg flex flex-col sm:flex-row items-center gap-4 transition-colors ${course.status === 'en attente' ? 'bg-amber-50' : (course.status === 'refusé' ? 'bg-red-50' : 'bg-gray-50')}`}>
                            <div className="relative h-16 w-full sm:w-28 rounded-md overflow-hidden shrink-0">
                                <Image src={course.image_url || '/images/placeholder.png'} alt={course.title} fill className="object-cover"/>
                            </div>
                            <div className="grow text-center sm:text-left">
                                <h3 className="font-bold">{course.title}</h3>
                                <p className="text-sm text-gray-500">{course.category}</p>
                            </div>
                            <div className="flex items-center justify-center gap-2 shrink-0">
                                {course.status === 'accepté' ? (
                                    <>
                                        {course.type === 'video' ? (
                                            <a href={course.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#af4d30] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-opacity-90">
                                                <PlayCircle size={16}/><span>Regarder</span>
                                            </a>
                                        ) : (
                                            <a href={course.file_url} download className="flex items-center gap-2 bg-gray-200 text-[#1f2937] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-300">
                                                <Download size={16}/><span>Télécharger</span>
                                            </a>
                                        )}
                                    </>
                                ) : course.status === 'en attente' ? (
                                    <span className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                                        <Clock size={16}/>
                                        Vérification...
                                    </span>
                                ) : ( // Statut 'refusé'
                                     <span className="flex items-center gap-2 text-sm font-semibold text-red-700">
                                        <X size={16}/>
                                        Achat refusé
                                    </span>
                                )}
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-gray-500 py-8">
                            {purchasedCourses.length === 0 ? "Vous n'avez encore acheté aucune formation." : "Aucune formation ne correspond à vos filtres."}
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-12">
                <h2 className="text-xl font-bold mb-6">Continuer à vous former</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {recommendedCourses.map(course => (
                        <RecommendedCourseCard key={course.id} course={course} />
                    ))}
                </div>
                <div className="text-center mt-8">
                    <Link href="/academie" className="bg-[#1f2937] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#af4d30] transition-colors">
                        Voir tout le catalogue
                    </Link>
                </div>
            </div>
        </div>
    );
}
