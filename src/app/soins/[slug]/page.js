// src/app/soins/[slug]/page.js
'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { servicesDetails } from '../servicesData';
import PageHero from '@/app/components/PageHero';
import BookingBar from '@/app/components/BookingBar';
import ContactCTA from '@/app/components/ContactCTA';
import ServiceFAQ from '@/app/components/ServiceFAQ';
import { CheckCircle, ArrowRight, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';


const QuoteSection = ({ quote }) => {
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ['start end', 'end start']
    });
    // On augmente l'amplitude du parallax
    const y = useTransform(scrollYProgress, [0, 1], ['-25%', '15%']);

    return (
        <section ref={targetRef} className="relative z-[2] h-[70vh] min-h-[500px] overflow-hidden">
            {/* Image avec parallax */}
            <motion.div style={{ y }} className="absolute inset-0">
                 <Image src={quote.bgImage} alt="Texture de fond inspirante" fill className="object-cover opacity-80"/>
            </motion.div>
             {/* Dégradé vignette pour la lisibilité */}
             <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/40 to-black/70"></div>
             <div className="relative h-full flex items-center justify-center">
                <motion.p 
                    style={{ textShadow: '0px 2px 15px rgba(0,0,0,0.5)' }} // Ombre portée
                    className="text-4xl md:text-5xl lg:text-6xl font-serif italic text-white max-w-4xl mx-auto text-center px-6 leading-tight"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                >
                    "{quote.text}"
                </motion.p>
             </div>
        </section>
    );
}

export default function SoinDetailPage() {
    const params = useParams();
    const { slug } = params;
    const service = servicesDetails[slug];

    // Si le service n'existe pas dans nos données
    if (!service) {
        return (
            <div className="text-center py-24">
                <h1 className="text-4xl font-bold">Service non trouvé</h1>
                <p className="mt-4">Ce service n'existe pas. Veuillez retourner à la page des soins.</p>
                <Link href="/soins" className="mt-6 inline-block bg-[#E35336] text-white px-6 py-2 rounded-full">
                    Voir tous les soins
                </Link>
            </div>
        );
    }

     const handleScrollToPricing = (event) => {
        event.preventDefault(); // Empêche le comportement par défaut du lien
        const pricingSection = document.getElementById('tarifs-section');
        if (pricingSection) {
            pricingSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start' // Aligne le haut de la section avec le haut de la vue
            });
        }
    };

    const mainPrice = service.pricing.options[0]?.price || 'Sur devis';

    return (
        <main>

             {mainPrice !== "Sur devis" && (
              <BookingBar 
                price={mainPrice} 
                targetId="tarifs-section"
              />
            )}
            
            <PageHero title={service.title} text={service.subtitle} imageSrc={service.heroImage} />

            {/* Section Introduction */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
                        <h2 className="text-3xl font-bold text-[#1f2937] mb-6">En quoi consiste ce soin ?</h2>
                        <p className="text-lg text-gray-600 leading-relaxed">{service.introText}</p>
                    </motion.div>
                    <motion.div className="relative z-[2] h-96 rounded-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
                        <Image src={service.gallery[0]} alt={service.title} fill className="object-cover"/>
                    </motion.div>
                </div>
            </section>

             <section className="py-24 bg-[#FADDAA]">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center text-[#1f2937] mb-4">Ce soin est fait pour vous si...</h2>
                    <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-12">Vous vous reconnaîtrez peut-être dans l'une de ces situations.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {service.idealFor.map((item, index) => (
                            <motion.div key={index} className="relative z-[2] bg-white p-6 rounded-2xl shadow-sm border border-transparent hover:border-gray-200 hover:shadow-lg transition-all" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                                <div className="flex items-start gap-4">
                                    <div className="bg-[#af4d30]/10 p-2 rounded-full">
                                        <CheckCircle size={24} className="text-[#af4d30]" />
                                    </div>
                                    <p className="font-semibold text-gray-800 text-lg mt-1">{item}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
            

{service.subServices && service.subServices.length > 0 && (
    <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-[#1f2937] mb-12 text-center">Nos Protocoles Spécifiques en {service.title}</h2>
            <div className="space-y-8 max-w-4xl mx-auto">
                {service.subServices.map(sub => (
                    <motion.div 
                        key={sub.id} 
                        id={sub.id}
                        className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="relative grid grid-cols-1 md:grid-cols-3 items-center min-h-[180px]">
                            {/* --- Colonne de l'image (à droite) --- */}
                            <div className="md:col-span-1 h-48 md:h-full relative overflow-hidden">
                                <Image 
                                    src={sub.image} // Assurez-vous d'ajouter sub.image dans vos données
                                    alt={sub.title} 
                                    fill 
                                    className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/10"></div>
                            </div>
                            
                            {/* --- Colonne du texte (à gauche) --- */}
                            <div className="md:col-span-2 p-8 bg-[#FFF7ED]">
                                <h3 className="text-2xl font-bold text-[#1f2937] mb-2">{sub.title}</h3>
                                <p className="text-gray-600 mb-4">{sub.text}</p>
                                <div className="flex items-end justify-between">
                                    <p className="text-3xl font-bold text-[#1f2937]">{sub.price}</p>
                                    <Link href="/compte/rendez-vous" className="inline-block bg-[#C87A5E] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#1f2937] transition-colors">
                                        Réserver
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
)}

<QuoteSection quote={service.quote} />

           

            {/* Section Bienfaits */}
             <section className="py-30 bg-white">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-[#1f2937] mb-12">Les Bienfaits Clés</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {service.benefits.map((benefit, index) => (
                             <motion.div key={index} className="relative z-[2] bg-gray-50 p-8 rounded-2xl text-center" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                                <Award className="mx-auto text-[#af4d30] mb-4" size={40} />
                                <h3 className="text-lg font-bold text-[#1f2937]">{benefit}</h3>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* Section Déroulement (Timeline) */}
           <section className="py-10 bg-gray-50">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold text-[#1f2937] mb-16 text-center">Le Déroulement de la Séance</h2>
                    {service.process.map((step, index) => (
                         <motion.div 
                            key={index}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20"
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.8 }}
                         >
                            <div className={`relative z-[2] h-80 rounded-2xl overflow-hidden ${index % 2 === 0 ? 'lg:order-2' : ''}`}>
                                <Image src={step.image} alt={step.title} fill className="object-cover"/>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="text-4xl font-bold text-[#af4d30]/50">0{index + 1}</div>
                                <div>
                                    <h3 className="text-2xl font-bold text-[#1f2937] mb-2">{step.title}</h3>
                                    <p className="text-gray-600">{step.description}</p>
                                </div>
                            </div>
                         </motion.div>
                    ))}
                </div>
            </section>

              <section className="py-24 bg-white">
                <div className="w-full"> {/* Conteneur pleine largeur */}
                    <div className="relative">
                        <Swiper
                            modules={[Navigation, Pagination, EffectCoverflow]}
                            effect="coverflow"
                            grabCursor={true}
                            centeredSlides={true}
                            slidesPerView={'auto'}
                            loop={true}
                            coverflowEffect={{
                                rotate: 30,
                                stretch: 0,
                                depth: 100,
                                modifier: 1,
                                slideShadows: false,
                            }}
                            navigation={{
                                nextEl: '.swiper-button-next-gallery',
                                prevEl: '.swiper-button-prev-gallery',
                            }}
                            pagination={{ clickable: true }}
                            className="cinematic-swiper !py-8"
                        >
                            {service.fullGallery.map((img, index) => (
                               <SwiperSlide key={index} className="!w-[500px] !max-w-[600px] sm:!max-w-[320px] md:!max-w-[400px]">
                                    <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg">
                                        <Image src={img} alt={`Galerie ${service.title} ${index + 1}`} fill className="object-cover"/>
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                        {/* Flèches de navigation personnalisées */}
                        <div className="swiper-button-prev-gallery absolute left-4 md:left-16 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/70 hover:bg-white transition shadow-md cursor-pointer text-[#1f2937]"><ChevronLeft size={32}/></div>
                        <div className="swiper-button-next-gallery absolute right-4 md:right-16 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/70 hover:bg-white transition shadow-md cursor-pointer text-[#1f2937]"><ChevronRight size={32}/></div>
                    </div>
                </div>
            </section>

            <section id="tarifs-section" className="py-24 bg-[#FADDAA]">
    <div className="container mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold text-center text-[#1f2937] mb-4">Choisissez votre parcours</h2>
            <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-12">{service.pricing.details}</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto items-end">
                {service.pricing.options.map((opt, i) => {
                    const isPopular = service.pricing.options.length > 1 && i === 1; // Le 2ème est populaire
                    
                    return (
                        <motion.div 
                            key={i}
                            className={`relative z-[2] bg-white rounded-2xl shadow-lg p-8 text-center border-2 ${isPopular ? 'border-[#E35336]' : 'border-transparent'}`}
                            whileHover={{ y: -10, scale: 1.02 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                        >
                            {isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#E35336] text-white px-4 py-1 rounded-full text-sm font-semibold">
                                    Populaire
                                </div>
                            )}
                            <h3 className="text-xl font-bold text-[#1f2937] mb-2">{opt.name}</h3>
                            <p className="text-5xl font-extrabold text-[#1f2937] mb-6">{opt.price}</p>
                            
                            <Link 
                                href="/compte/rendez-vous" 
                                className={`w-full block px-6 py-3 rounded-lg font-semibold transition-colors duration-300 ${isPopular ? 'bg-[#af4d30] text-white hover:bg-[#D0482B]' : 'bg-gray-100 text-[#1f2937] hover:bg-gray-200'}`}
                            >
                                Choisir cette option
                            </Link>
                        </motion.div>
                    )
                })}
            </div>
        </motion.div>
    </div>
</section>

            

            <ServiceFAQ /> 

            <ContactCTA />
            
            {/* CTA Flottant pour la réservation */}
            <motion.div 
                className="fixed bottom-6 right-6 z-20"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ type: 'spring', stiffness: 100 }}
            >
                <Link href="/compte/rendez-vous" className="bg-[#af4d30] text-white px-6 py-4 rounded-full font-semibold shadow-lg hover:bg-[#b56b50] transition-colors flex items-center gap-2">
                    Réserver ce Soin
                </Link>
            </motion.div>
        </main>
    );
}
