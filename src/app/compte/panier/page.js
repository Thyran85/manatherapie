'use client'; // <-- LA CORRECTION EST ICI

import { motion } from 'framer-motion';
import CartPageClient from '@/app/components/CartPageClient'; // Importer notre composant

export default function PanierComptePage() {
    return (
        <div>
             <motion.h1 
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="text-3xl font-bold text-[#1f2937] mb-8"
            >
                Mon Panier
            </motion.h1>

            <CartPageClient />
        </div>
    );
}