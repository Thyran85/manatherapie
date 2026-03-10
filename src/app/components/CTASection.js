
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

const seeded = (seed) => {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
};

const FloatingParticle = ({ index }) => {
    const s1 = seeded(index + 1);
    const s2 = seeded(index + 11);
    const s3 = seeded(index + 23);
    const s4 = seeded(index + 47);
    const s5 = seeded(index + 71);
    const s6 = seeded(index + 97);
    const s7 = seeded(index + 131);

    const style = useMemo(() => ({
        position: 'absolute',
        top: `${s1 * 100}%`,
        left: `${s2 * 100}%`,
        width: `${s3 * 10 + 2}px`,
        height: `${s4 * 8 + 1}px`,
        backgroundColor: 'rgba(255, 247, 237, 0.5)',
        borderRadius: '50%',
      }), [s1, s2, s3, s4]);
    
      const animation = useMemo(() => ({
        x: [0, s5 * 40 - 20, 0],
        y: [0, s6 * 40 - 20, 0],
        scale: [1, s7 * 0.8 + 1, 1],
        opacity: [0, 1, 0],
      }), [s5, s6, s7]);
    
      return (
        <motion.div
          style={style}
          animate={animation}
          transition={{
            duration: s1 * 10 + 10,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'easeInOut'
          }}
        />
      );
};


const CTASection = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <section className="relative z-[20] py-24 bg-[#1f2937] overflow-hidden">
      <Image
        src="/images/cta-background.jpg"
        alt="Texture de fond apaisante"
        fill
        className="opacity-20 object-cover" 
      />

      {isMounted && (
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => <FloatingParticle key={i} index={i} />)}
        </div>
      )}

      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(200, 122, 94, 0.15) 0%, transparent 60%)'
        }}
      ></div>

      <motion.div 
        className="relative container mx-auto px-6 text-center flex flex-col items-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 1 }}
      >
        <motion.h2 
          className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
        >
          Votre transformation commence ici.
        </motion.h2>
        
        <motion.p 
          className="text-lg text-gray-300 max-w-xl mx-auto mb-10"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
        >
          Le plus grand voyage est celui que l'on fait à l'intérieur de soi. Permettez-nous de vous accompagner sur le premier pas.
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-4"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.6, ease: 'easeOut' }}
        >
          <Link 
            href="/soins" 
            className="bg-white text-[#1f2937] px-8 py-3 rounded-full text-base font-semibold transition-all duration-300 transform hover:scale-105 hover:bg-gray-200"
          >
            Réserver une Séance
          </Link>
          <Link 
            href="/academie" 
            className="bg-transparent border-2 border-white/50 text-white px-8 py-3 rounded-full text-base font-semibold transition-all duration-300 hover:bg-white hover:text-[#1f2937]"
          >
            Explorer nos Formations
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default CTASection;
