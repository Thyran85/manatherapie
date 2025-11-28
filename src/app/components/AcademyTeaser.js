import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';

// Fonction pour récupérer les formations les plus populaires (les 10 dernières créées)
async function getBestSellers() {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    try {
        // On appelle notre API avec le paramètre 'limit'
        const res = await fetch(`${baseUrl}/api/formations?limit=10`, {
            // Mettre les données en cache pour la performance. 
            // Elles seront rafraîchies toutes les heures.
            next: { revalidate: 3600 },
        });

        if (!res.ok) {
            console.error("Impossible de charger les formations pour AcademyTeaser");
            return [];
        }
        return res.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

// Le composant est maintenant 'async', c'est un Server Component.
const AcademyTeaser = async () => {
    const bestSellers = await getBestSellers();

    // Si aucune formation n'est trouvée, on peut choisir de ne rien afficher.
    if (bestSellers.length === 0) {
        return null;
    }

    return (
        <section className="py-24 bg-[#FADDAA]">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-4xl font-bold text-[#1f2937] mb-4">Devenez votre propre expert(e)</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">Nos formations les plus populaires, conçues pour vous donner les clés de votre bien-être.</p>
            </div>
            <div className="relative overflow-hidden z-[20]">
                <div className="marquee-container-coaching z-[20]">
                    {/* On duplique la liste pour un effet de défilement infini */}
                    <div className="marquee-track-coaching" style={{ animationDuration: `${bestSellers.length * 58}s` }}>
                        {[...bestSellers, ...bestSellers, ...bestSellers, ...bestSellers, ...bestSellers, ...bestSellers, ...bestSellers, ...bestSellers, ...bestSellers, ...bestSellers, ...bestSellers].map((course, i) => (
                            <Link href={`/academie/${course.slug}`} key={`${course.id}-${i}`} className="flex-shrink-0 w-80 z-[20] mx-4 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-500 group">
                                <div className="relative h-48">
                                    <Image 
                                        src={course.image_url || '/images/placeholder.png'} 
                                        alt={course.title} 
                                        fill 
                                        sizes="(max-width: 768px) 100vw, 320px"
                                        className="object-cover rounded-t-2xl"
                                    />
                                </div>
                                <div className="p-5 text-left">
                                    <p className="text-sm text-[#af4d30] font-semibold">{course.category}</p>
                                    <h3 className="font-bold text-lg my-1 truncate">{course.title}</h3>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                        {/* Données statiques pour le style, car non stockées en BDD */}
                                        <Star size={16} className="text-amber-400 fill-current"/>
                                        <span>4.9</span>
                                        <span>(avis)</span>
                                    </div>
                                    <p className="text-2xl font-bold text-[#1f2937] mt-3">{Number(course.price).toFixed(2)}€</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="text-center mt-12 mb-4">
                     <Link href="/academie" className="bg-[#af4d30] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#b56b50] transition-colors">
                        Explorer toutes les formations
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default AcademyTeaser;