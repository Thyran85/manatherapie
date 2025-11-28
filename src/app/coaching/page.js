// src/app/coaching/page.js
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import PageHero from '@/app/components/PageHero';
import CoachingTestimonials from '@/app/components/CoachingTestimonials';
import CoachingFAQSection from '@/app/components/CoachingFAQSection'; 
import TransformationSection from '@/app/components/TransformationSection'; 
import FloatingCtaButton from '@/app/components/FloatingCtaButton';
import ContactCTA from '@/app/components/ContactCTA';
import { Check, Video, MapPin, ArrowRight, Star, Users, Target, Clock } from 'lucide-react';

// --- Données enrichies pour la page ---
const forWhoItems = [
    { title: "Transition de Carrière", text: "Vous cherchez à donner un nouveau sens à votre vie professionnelle." },
    { title: "Manque de Confiance", text: "Vous doutez de vos capacités et sabotez vos propres projets." },
    { title: "Gestion du Stress", text: "Vous vous sentez submergé(e) et n'arrivez plus à prendre du recul." },
    { title: "Prise de Décision", text: "Vous êtes face à un choix important et avez peur de vous tromper." },
];

const processSteps = [
    { num: "01", title: "Séance Découverte (Offerte)", text: "Un appel de 30 minutes pour cerner votre besoin et confirmer que mon approche vous convient. C'est sans engagement." },
    { num: "02", title: "Définition de la Cible", text: "Lors de notre première séance, nous définissons un objectif clair, mesurable et inspirant. C'est notre boussole." },
    { num: "03", title: "Plan d'Action & Séances", text: "Nous co-créons un plan d'étapes. Chaque séance (1h) est un espace pour explorer, débloquer et avancer." },
    { num: "04", title: "Bilan & Autonomie", text: "À la fin de l'accompagnement, nous célébrons vos victoires et nous assurons que vous avez les outils pour continuer seul(e)." },
];

const testimonials = [
    { name: "Alexandre P.", role: "Entrepreneur", text: "Le coaching a été un véritable accélérateur. J'ai gagné une clarté incroyable sur ma stratégie et la confiance pour la mettre en œuvre." },
    { name: "Marie C.", role: "En Reconversion", text: "J'appréhendais les séances en ligne, mais Laura a une capacité d'écoute qui traverse l'écran. J'ai enfin osé lancer mon projet." },
    { name: "Julien R.", role: "Manager", text: "J'ai appris à mieux gérer mon stress et à communiquer avec mon équipe. L'impact a été immédiat et très positif." },
    { name: "Sophie L.", role: "Artiste", text: "Je procrastinais depuis des années. Le coaching m'a donné la structure et le 'coup de pied' bienveillant dont j'avais besoin." },
    { name: "Marc T.", role: "Étudiant", text: "Idéal pour préparer mes examens et gérer la pression. J'ai abordé mes oraux avec une sérénité que je ne me connaissais pas." },
    { name: "Émilie B.", role: "Jeune Maman", text: "Le coaching m'a aidée à retrouver un équilibre entre ma vie de mère et mes aspirations personnelles. C'était vital." },
    { name: "Thomas V.", role: "Sportif", text: "Un vrai plus pour la préparation mentale avant les compétitions. J'ai appris à visualiser le succès." },
    { name: "Laura D.", role: "Créatrice de contenu", text: "J'étais perdue dans mes idées. Les séances m'ont permis de structurer ma pensée et de créer une offre claire pour mon audience." },
];



export default function CoachingPage() {
    return (
        <main>
            <PageHero 
                title="Révélez Votre Potentiel"
                text="Le coaching n'est pas une thérapie. C'est un partenariat stratégique pour construire activement la vie à laquelle vous aspirez."
                imageSrc="/images/hero-coaching-bg.jpg"
            />

            {/* --- Section 1: "Pour Qui ?" avec un design de cartes --- */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-[#1f2937] mb-4">Vous vous reconnaissez ?</h2>
                    <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-12">Le coaching est un levier puissant si vous êtes dans l'une de ces situations :</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {forWhoItems.map((item, i) => (
                            <motion.div key={i} className="relative z-[2] bg-[#FADDAA] p-6 rounded-2xl text-center border-t-4 border-[#af4d30]" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                                <h3 className="text-xl font-bold text-[#1f2937] mb-2">{item.title}</h3>
                                <p className="text-gray-700">{item.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* --- Section 2: Mon Approche (plus détaillée) --- */}
            <section className="py-24 bg-gray-50">
                <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        whileInView={{ opacity: 1, scale: 1 }} 
                        viewport={{ once: true }} 
                        className="relative z-[2] w-full aspect-square max-w-md mx-auto rounded-full overflow-hidden"
                    >
                        <Image src="/images/approach-image.jpg" alt="Portrait de la coach" fill className="object-cover"/>
                    </motion.div>
                    <div className="text-lg text-gray-700 space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#1f2937]">Mon Approche : Un Catalyseur de Changement</h2>
                        <p>Mon rôle n'est pas de vous donner des réponses, mais de vous poser les bonnes questions. Celles qui ouvrent des portes, qui créent des déclics et qui vous mettent en mouvement. Je suis votre partenaire de réflexion, votre miroir bienveillant et votre booster de motivation.</p>
                        <ul className="space-y-3">
                            <li className="flex gap-3"><Users className="text-[#af4d30] flex-shrink-0"/><span><strong className="text-[#1f2937]">Co-création :</strong> Nous travaillons ensemble. Vous êtes l'expert(e) de votre vie, je suis l'experte du processus.</span></li>
                            <li className="flex gap-3"><Target className="text-[#af4d30] flex-shrink-0"/><span><strong className="text-[#1f2937]">Orienté Action :</strong> Chaque séance se termine par des actions concrètes à mettre en place. Pas de blabla, que du résultat.</span></li>
                            <li className="flex gap-3"><Clock className="text-[#af4d30] flex-shrink-0"/><span><strong className="text-[#1f2937]">Cadre Défini :</strong> Un accompagnement dure en moyenne 3 à 6 mois. C'est un sprint, pas un marathon, pour un maximum d'impact.</span></li>
                        </ul>
                    </div>
                </div>
            </section>

            <TransformationSection />

            {/* --- Section 3: Le Déroulement (Timeline améliorée) --- */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-[#1f2937] mb-16">Un Processus en 4 Étapes Claires</h2>
                    <div className="relative max-w-4xl mx-auto">
                        <div className="absolute top-8 left-8 bottom-8 w-1 bg-[#af4d30] rounded-full"></div>
                        {processSteps.map((step, i) => (
                            <motion.div key={i} className="relative z-[2] pl-20 pb-12" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }}>
                                <div className="absolute top-0 left-0 w-16 h-16 flex items-center justify-center rounded-full bg-[#af4d30] text-white text-2xl font-bold border-8 border-white">
                                    {step.num}
                                </div>
                                <h3 className="text-2xl font-bold text-[#1f2937] mb-2">{step.title}</h3>
                                <p className="text-gray-600">{step.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Section 4: Les Formules (CTA clair) --- */}
            <section className="py-24 bg-[#FADDAA]">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-[#1f2937] mb-12">Prêt(e) à passer à l'action ?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {/* Carte En Ligne */}
                        <motion.div whileHover={{ scale: 1.03 }} className="relative z-[2] bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col">
                            <div className="p-8">
                                <Video className="text-[#af4d30] mb-4" size={40}/>
                                <h3 className="text-2xl font-bold mb-2">Coaching en Ligne</h3>
                                <p className="text-gray-600 mb-6 flex-grow">La flexibilité du digital, la profondeur de l'échange. Où que vous soyez, nous avançons ensemble via Zoom ou Meet.</p>
                            </div>
                            <div className="mt-auto p-8 pt-0">
                                <Link href="/compte/rendez-vous" className="block w-full text-center bg-[#1f2937] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#af4d30] transition-colors">
                                    Réserver ma séance découverte (En Ligne)
                                </Link>
                            </div>
                        </motion.div>
                        {/* Carte Présentiel */}
                         <motion.div whileHover={{ scale: 1.03 }} className="relative z-[2] bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col">
                            <div className="p-8">
                                <MapPin className="text-[#af4d30] mb-4" size={40}/>
                                <h3 className="text-2xl font-bold mb-2">Coaching en Présentiel</h3>
                                <p className="text-gray-600 mb-6 flex-grow">La puissance de la rencontre. Retrouvez-moi dans un espace confidentiel pour un travail en profondeur.</p>
                            </div>
                            <div className="mt-auto p-8 pt-0">
                                <Link href="/compte/rendez-vous" className="block w-full text-center bg-[#1f2937] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#af4d30] transition-colors">
                                    Réserver ma séance découverte (Présentiel)
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- Section 5: Témoignages (Marquee) --- */}
             <section className="py-24 bg-white overflow-hidden">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-[#1f2937] mb-12">Ils ont osé le changement. Pourquoi pas vous ?</h2>
                </div>
                <CoachingTestimonials testimonials={testimonials} />
            </section>

           
             <CoachingFAQSection />

             <ContactCTA />

             <FloatingCtaButton 
                href="/compte/rendez-vous"
                text="Réserver ma séance découverte"
            />

        </main>
    );
}