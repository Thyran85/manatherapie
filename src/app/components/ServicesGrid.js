// src/app/components/ServicesGrid.js
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

const servicesList = [
    { title: "MANAXFACE", category: "Drainage Visage", description: "Pour un visage visiblement dégonflé, lifté et lumineux.", link: "/soins/manaxface", bookingLink: "/compte/rendez-vous", imageSrc: "/images/hero-manaxface.jpg" },
    { title: "MANAXDRAIN", category: "Drainage Corps", description: "Détoxifiez votre organisme, luttez contre la rétention d'eau.", link: "/soins/manaxdrain", bookingLink: "/compte/rendez-vous", imageSrc: "/images/hero-manaxdrain.jpg" },
    { title: "MANAXSCULPT", category: "Remodelage Manuel", description: "'Cassez' la cellulite adipeuse et tonifiez votre peau.", link: "/soins/manaxsculpt", bookingLink: "/compte/rendez-vous", imageSrc: "/images/hero-manaxsculpt.jpg" },
    { title: "MADÉROXDRAIN", category: "Madero & Drainage", description: "Double action anti-cellulite pour une perte de centimètres visible.", link: "/soins/maderoxdrain", bookingLink: "/compte/rendez-vous", imageSrc: "/images/hero-maderoxdrain.jpg" },
    { title: "MADÉROXICE", category: "Madero & Cryo", description: "Effet tenseur et raffermissant immédiat grâce au choc thermique.", link: "/soins/maderoxice", bookingLink: "/compte/rendez-vous", imageSrc: "/images/hero-maderoxice.jpg" },
    { title: "MANAFAST", category: "Soin Express", description: "Un protocole intensif de 25 minutes sur une zone ciblée.", link: "/soins/manafast", bookingLink: "/compte/rendez-vous", imageSrc: "/images/hero-manafast.jpg" },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.2 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" }}
};

const ServicesGrid = () => {
    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-6">
                <motion.div 
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-[#1f2937] mb-4">Découvrez nos Rituels de Soin</h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">Chaque prestation est une expérience unique, pensée pour votre bien-être absolu.</p>
                </motion.div>

                <motion.div 
                    className="relative z-[2] grid grid-cols-1 md:grid-cols-2 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                >
                    {servicesList.map((service) => (
                        <motion.div key={service.title} variants={itemVariants}>
                            <div className="group relative block rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 h-96">
                                
                                <div className="absolute inset-0 h-3/5 group-hover:h-full transition-all duration-700 ease-in-out">
                                    <Image
                                        src={service.imageSrc}
                                        alt={service.title}
                                        layout="fill"
                                        objectFit="cover"
                                        className="scale-105 group-hover:scale-100 transition-transform duration-700"
                                    />
                                    {/* --- DÉGRADÉ CRÈME POUR LA LISIBILITÉ --- */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#FFF7ED]/90 via-[#FFF7ED]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 p-8 bg-[#FFF7ED] group-hover:bg-transparent transition-colors duration-500">
                                    <div className="transition-transform duration-700 ease-in-out group-hover:-translate-y-8">
                                        <p className="font-semibold text-[#af4d30] mb-1">{service.category}</p>
                                        <h3 className="text-3xl font-bold text-[#1f2937]">{service.title}</h3>
                                        
                                        <div className="h-0 opacity-0 group-hover:h-auto group-hover:opacity-100 transition-all duration-500">
                                            <p className="mt-2 text-[#1f2937]/80">
                                                {service.description}
                                            </p>
                                            <div className="mt-6 flex gap-4">
                                                <Link href={service.bookingLink} className="bg-[#af4d30] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#1f2937] transition-all duration-300 transform hover:scale-105">
                                                    Réserver
                                                </Link>
                                                <Link href={service.link} className="border border-[#1f2937]/50 text-[#1f2937] px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#1f2937] hover:text-white transition-all duration-300">
                                                    En savoir plus
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default ServicesGrid;