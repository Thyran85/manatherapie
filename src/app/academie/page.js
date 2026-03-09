
import Image from 'next/image';
import CoursesDisplay from './CoursesDisplay'; // On importe notre composant client

// Cette fonction s'exécute sur le serveur pour récupérer les données une seule fois.
async function getCourses() {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    try {
        const res = await fetch(`${baseUrl}/api/formations`, {
            // 'no-store' est important pour que les nouvelles formations apparaissent immédiatement.
            cache: 'no-store', 
        });
        if (!res.ok) {
            console.error("Réponse API non OK:", res.status, res.statusText);
            throw new Error('Impossible de charger les formations.');
        }
        return res.json();
    } catch (error) {
        console.error("Erreur lors du fetch des formations:", error);
        return []; // Renvoyer un tableau vide est une sécurité pour éviter un crash.
    }
}

// Le Server Component. Pas de 'async' directement sur l'export default si on utilise motion.
// Mais ici, c'est la page, donc pas de motion.
export default async function AcademyPage() {
    // 1. Récupération des données côté serveur
    const courses = await getCourses();

    // 2. Rendu de la partie statique de la page
    return (
        <main>
            <div className="bg-[#FFF7ED]"></div>

            <section className="relative z-2 py-24 text-center bg-gray-800 text-white">
                <Image
                    src="/images/hero-academie-bg.jpg"
                    alt="Apprentissage et bien-être"
                    fill
                    className="object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#1f2937]/50 to-transparent"></div>
                <div className="relative container mx-auto px-6">
                    {/* On peut utiliser motion ici car c'est juste pour l'animation d'entrée, pas d'état */}
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">
                        Votre Académie du Bien-être
                    </h1>
                    <p className="text-lg text-gray-200 max-w-2xl mx-auto">
                        Apprenez, grandissez et transformez votre vie à votre rythme.
                    </p>
                </div>
            </section>

            {/* 3. On passe les données initiales au composant client qui gérera l'interactivité */}
            <CoursesDisplay initialCourses={courses} />
        </main>
    );
}