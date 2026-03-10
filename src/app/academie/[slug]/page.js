'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Check, Video, BookOpen, BarChart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useSession } from 'next-auth/react';

// (Ce composant peut être extrait dans son propre fichier si vous le souhaitez)
const SimilarCourseCard = ({ course }) => (
    <Link href={`/academie/${course.slug}`} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow group">
        <div className="relative h-40 overflow-hidden">
            <Image src={course.image_url || '/images/placeholder.png'} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300"/>
        </div>
        <div className="p-4">
            <h3 className="font-bold text-md mb-1 truncate">{course.title}</h3>
            <p className="text-lg font-bold text-[#1f2937]">{course.price}€</p>
        </div>
    </Link>
);

export default function CourseDetailPage({ params }) {
    const { slug } = use(params);
    const [course, setCourse] = useState(null);
    const [similarCourses, setSimilarCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { addToCart } = useCart();
    const { data: session } = useSession();

    useEffect(() => {
        const fetchCourseData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch les détails du cours principal
                const courseRes = await fetch(`/api/formations/${slug}`);
                if (!courseRes.ok) throw new Error('Formation non trouvée.');
                const courseData = await courseRes.json();
                setCourse(courseData);

                // Fetch des formations similaires (par catégorie)
                const similarRes = await fetch(`/api/formations?category=${courseData.category}`);
                const allSimilar = await similarRes.json();
                // Exclure le cours actuel et en prendre 4
                setSimilarCourses(allSimilar.filter(c => c.slug !== slug).slice(0, 4));

            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCourseData();
    }, [slug]); // Se redéclenche si le slug change

    if (isLoading) return <div className="text-center py-20">Chargement de la formation...</div>;
    if (error) return <div className="text-center py-20 text-red-500">Erreur: {error}</div>;
    if (!course) return null;

    const handleBuyNow = async () => {
        // Pour l'instant, on redirige vers le panier avec le cours déjà ajouté.
        // On pourrait plus tard créer une page de checkout direct.
        addToCart(course);
        window.location.href = session ? '/compte/panier' : '/panier';
    };

    return (
        <main>
            <section className="relative z-2 bg-[#1f2937] text-white py-16">
                <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                     <Image src={course.image_url} alt={course.title} width={500} height={300} className="w-full rounded-lg object-cover shadow-lg"/>
                    <div className="lg:col-span-2">
                        <p className="font-semibold text-[#C87A5E]">{course.category}</p>
                        <h1 className="text-4xl md:text-5xl font-bold my-4">{course.title}</h1>
                        <p className="text-lg text-gray-300 max-w-3xl">{course.description}</p>
                        <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-amber-400">4.8</span>
                                <Star size={16} className="text-amber-400 fill-current"/>
                            </div>
                            <span>(15 avis)</span>
                            <span className="text-gray-400">Créé par {course.author}</span>
                        </div>
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="border border-gray-200 rounded-lg p-6 mb-8">
                            <h2 className="text-2xl font-bold mb-4">Ce que vous allez apprendre</h2>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                {course.what_you_learn.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3"><Check size={20} className="text-green-500 mt-1 shrink-0"/><span>{item}</span></li>
                                ))}
                            </ul>
                        </motion.div>

                        <div className="mb-8">
                            <h2 className="text-2xl font-bold mb-4">Contenu de la formation</h2>
                            <div className="border border-gray-200 rounded-lg">
                                {course.modules.map((mod, i) => (
                                    <div key={i} className="border-b last:border-b-0 border-gray-200">
                                        <div className="p-4 bg-gray-50 flex justify-between items-center">
                                            <span className="font-semibold">{i+1}. {mod.title}</span>
                                            <span className="text-sm text-gray-500">{mod.duration}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative z-2">
                        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="lg:sticky top-28">
                             <div className="rounded-lg shadow-2xl overflow-hidden border border-gray-200">
                                 <Image src={course.image_url} alt={course.title} width={500} height={300} className="w-full object-cover"/>
                                <div className="p-6 bg-white">
                                    <p className="text-4xl font-bold mb-4">{course.price}€</p>
                                    <div className="space-y-3">
                                        <button className="w-full text-center block bg-[#af4d30] text-white py-3 rounded-lg font-bold hover:bg-[#b56b50] transition-colors" onClick={handleBuyNow} >Acheter maintenant</button>
                                        <button className="w-full text-center block border-2 border-[#1f2937] text-[#1f2937] py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors" onClick={() => addToCart(course)} >Ajouter au panier</button>
                                    </div>
                                    <p className="text-xs text-center text-gray-500 mt-2">Garantie satisfait ou remboursé 30 jours</p>
                                </div>
                                 <div className="p-6 bg-gray-50 border-t border-gray-200">
                                    <h3 className="font-bold mb-3 text-[#1f2937]">Cette formation inclut :</h3>
                                    <ul className="space-y-2 text-sm text-gray-700">
                                        <li className="flex items-center gap-2"><Video size={16}/>{course.duration} de contenu</li>
                                        <li className="flex items-center gap-2"><BookOpen size={16}/>Accès illimité à vie</li>
                                        <li className="flex items-center gap-2"><BarChart size={16}/>Niveau {course.level}</li>
                                    </ul>
                                </div>
                             </div>
                        </motion.div>
                    </div>
                </div>
            </div>
            
            <section className="py-16 bg-gray-50 border-t border-gray-200">
                 <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold mb-8">Formations similaires</h2>
                     <div className="relative z-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {similarCourses.map(c => <SimilarCourseCard key={c.id} course={c} />)}
                     </div>
                 </div>
            </section>
        </main>
    );
}
