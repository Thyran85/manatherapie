'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Search, ChevronDown, Video, BookOpen, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext'; // Ajouter cet import
import toast from 'react-hot-toast';

// Le CourseCard reste un sous-composant ici
const CourseCard = ({ course }) => {
    const { addToCart } = useCart();

    const handleAddToCart = () => {
        addToCart(course);
        toast.success(`${course.title} a été ajouté au panier !`);
    };
    return (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="relative z-[2] bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 group flex flex-col"
    >
        <div className="relative h-48">
            <Image src={course.image_url || '/images/placeholder.png'} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300"/>
            <div className={`absolute top-3 left-3 px-2 py-1 text-xs font-semibold text-white rounded-full flex items-center gap-1 ${course.type === 'video' ? 'bg-[#af4d30]' : 'bg-sky-500'}`}>
                {course.type === 'video' ? <Video size={12}/> : <BookOpen size={12}/>}
                <span>{course.type === 'video' ? 'Vidéo' : 'Ebook'}</span>
            </div>
        </div>
        <div className="p-5 flex flex-col flex-grow">
            <p className="text-sm text-[#af4d30] font-semibold mb-1">{course.category}</p>
            <h3 className="text-lg font-bold text-[#1f2937] mb-2 h-14">{course.title}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
                {/* Note: Les notes et avis ne sont pas encore en BDD, on les met en dur pour le style */}
                <span className="font-bold text-amber-500">4.8</span>
                <Star size={16} className="text-amber-400 fill-current"/>
                <span>(15 avis)</span>
            </div>
            <div className="mt-auto pt-4 border-t border-gray-100">
                <p className="text-2xl font-bold text-[#1f2937] mb-4">{course.price}€</p>
                <div className="grid grid-cols-2 gap-2">
                    <Link href={`/academie/${course.slug}`} className="text-center border border-[#1f2937]/20 text-[#1f2937] px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm">
                        Détails
                    </Link>
                     <button  onClick={handleAddToCart} className="flex items-center justify-center gap-2 bg-[#1f2937] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#af4d30] transition-colors text-sm">
                        <ShoppingCart size={16}/>
                        <span>Ajouter</span>
                    </button>
                </div>
            </div>
        </div>
    </motion.div>

);
};

// Le composant principal qui gère l'interactivité
export default function CoursesDisplay({ initialCourses }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');

    const categories = ['all', ...new Set(initialCourses.map(c => c.category))];
    
    const filteredCourses = initialCourses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || course.type === filterType;
        const matchesCategory = filterCategory === 'all' || course.category === filterCategory;
        return matchesSearch && matchesType && matchesCategory;
    });

    return (
        <>
            <section className="sticky top-[68px] z-30 bg-white/80 backdrop-blur-md py-4 border-y border-gray-200">
                <div className="container mx-auto px-6 flex flex-col lg:flex-row gap-4 items-center">
                    <div className="relative w-full lg:w-1/3">
                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input type="text" placeholder="Rechercher une formation..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C87A5E] transition" onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="w-full lg:w-2/3 flex flex-col sm:flex-row justify-start lg:justify-end gap-2">
                        <div className="flex-shrink-0 flex gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
                            <button onClick={() => setFilterType('all')} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition ${filterType === 'all' ? 'bg-white shadow-sm text-[#1f2937]' : 'text-gray-600'}`}>Tous</button>
                            <button onClick={() => setFilterType('video')} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition ${filterType === 'video' ? 'bg-white shadow-sm text-[#1f2937]' : 'text-gray-600'}`}>Vidéos</button>
                            <button onClick={() => setFilterType('ebook')} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition ${filterType === 'ebook' ? 'bg-white shadow-sm text-[#1f2937]' : 'text-gray-600'}`}>Ebooks</button>
                        </div>
                        <div className="relative w-full sm:w-48">
                            <select onChange={(e) => setFilterCategory(e.target.value)} className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-gray-500 focus:ring-2 focus:ring-[#C87A5E]">
                                {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'Toutes catégories' : cat}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"><ChevronDown size={20} /></div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-16 bg-[#FADDAA]">
                <div className="container mx-auto px-6">
                    <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        <AnimatePresence>
                            {filteredCourses.map(course => (
                                <CourseCard key={course.id} course={course} />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                    {filteredCourses.length === 0 && (
                        <div className="text-center py-16">
                            <p className="text-xl text-gray-500">Aucune formation ne correspond à votre recherche.</p>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}