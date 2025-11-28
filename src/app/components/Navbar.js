
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ChevronDown, ShoppingCart, UserCircle } from 'lucide-react'; // Ajout de UserCircle
import { useSession } from 'next-auth/react'; // Hook pour connaître l'état de la session
import { useCart } from '@/context/CartContext';

const soinsSubMenu = [
    { title: "MANAXFACE (Visage)", href: "/soins/manaxface" },
    { title: "MANAXDRAIN (Corps)", href: "/soins/manaxdrain" },
    { title: "MANAXSCULPT (Remodelage)", href: "/soins/manaxsculpt" },
    { title: "MADÉROXDRAIN", href: "/soins/maderoxdrain" },
    { title: "MADÉROXICE", href: "/soins/maderoxice" },
    { title: "MANAFAST", href: "/soins/manafast" },
];

const NavLink = ({ href, children, isScrolled }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  const baseTextColor = isScrolled ? 'text-[#1f2937]' : 'text-white'; 
  const activeTextColor = isScrolled ? 'text-[#E35336]' : 'text-white'; 
  const hoverColor = isScrolled ? 'hover:text-[#E35336]' : 'hover:text-white/80';

  return (
    <Link 
      href={href} 
      className={`relative group font-medium transition-colors duration-300 ${isActive ? activeTextColor : baseTextColor} ${hoverColor}`}
    >
      {children}
      {isActive && !pathname.startsWith('/soins/') && (
                <motion.div className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#E35336]" layoutId="underline" transition={{ type: 'spring', stiffness: 300, damping: 25 }} />
            )}
    </Link>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSoinsOpen, setIsSoinsOpen] = useState(false); // État pour le sous-menu
  const pathname = usePathname();

  const { data: session, status } = useSession(); // Récupère la session
  const { cartItems } = useCart(); 

  const isAuthenticated = status === 'authenticated';
    const cartItemCount = cartItems.length;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isSoinsActive = pathname.startsWith('/soins');

 

  return (
    <nav className={`fixed w-full z-40 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-transparent'}`}>
      <div className="container mx-auto px-6 py-1 flex justify-between items-center">
        
        <Link href="/" className="relative h-12 w-12 md:h-14 md:w-14 rounded-full overflow-hidden">
    {/* On utilise une seule image car la source est la même */}
    <Image
        src="/images/logo.jpeg"
        alt="manatherapy logo"
        fill
        className="object-cover" // object-cover pour bien remplir le cercle
    />
</Link>

        <div className="hidden md:flex items-center space-x-7 text-sm">
          <NavLink href="/" isScrolled={isScrolled}>Accueil</NavLink>
          <motion.div 
            onHoverStart={() => setIsSoinsOpen(true)}
            onHoverEnd={() => setIsSoinsOpen(false)}
            className="relative"
          >
            <div className={`relative group font-medium transition-colors duration-300 flex items-center gap-1 cursor-pointer ${isSoinsActive ? (isScrolled ? 'text-[#af4d30]' : 'text-white') : (isScrolled ? 'text-[#1f2937]' : 'text-white')} hover:${isScrolled ? 'text-[#af4d30]' : 'text-white/80'}`}>
              Nos Soins
              <motion.div animate={{ rotate: isSoinsOpen ? 180 : 0 }}>
                <ChevronDown size={16} />
              </motion.div>
            </div>
            {isSoinsActive && (
                 <motion.div
                 className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#af4d30]"
                 layoutId="underline"
                 transition={{ type: 'spring', stiffness: 300, damping: 25 }}
               />
            )}
            <AnimatePresence>
              {isSoinsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute top-full mt-2 w-56 p-2 rounded-lg shadow-xl ${isScrolled ? 'bg-white' : 'bg-white/80 backdrop-blur-md'}`}
                >
                  <ul className="space-y-1">
                    {soinsSubMenu.map(item => (
                      <li key={item.href}>
                        <Link href={item.href} className="block px-4 py-2 text-sm text-[#1f2937] hover:bg-[#FADDAA] hover:text-[#af4d30] rounded-md transition-colors">
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <NavLink href="/academie" isScrolled={isScrolled}>Académie</NavLink>
          <NavLink href="/coaching" isScrolled={isScrolled}>Coaching</NavLink>
          <NavLink href="/contact" isScrolled={isScrolled}>Contact</NavLink>
        </div>

         <div className="hidden md:flex items-center space-x-4 text-sm">
                    {/* --- MODIFICATION 1 : Affichage conditionnel des boutons d'action --- */}
                    {isAuthenticated ? (
                        // Si l'utilisateur est authentifié
                        <Link 
                            href="/compte" 
                            title="Mon Compte"
                            className={`flex items-center gap-2 font-medium px-4 py-1.5 rounded-full border-2 transition-all duration-300 ${
                                isScrolled 
                                ? 'text-[#af4d30] border-[#af4d30] hover:bg-[#af4d30] hover:text-white' 
                                : 'text-white border-white hover:bg-white hover:text-[#af4d30]'
                            }`}
                        >
                            <UserCircle size={20} />
                            <span>Mon Compte</span>
                        </Link>
                    ) : (
                        // Si l'utilisateur n'est PAS authentifié
                        <>
                            <Link 
                                href="/auth/login" 
                                className={`font-medium px-4 py-1.5 rounded-full border-2 transition-all duration-300 ${
                                  isScrolled 
                                    ? 'text-[#af4d30] border-[#af4d30] hover:bg-[#af4d30] hover:text-white' 
                                    : 'text-white border-white hover:bg-white hover:text-[#af4d30]'
                                }`}
                            >
                                Se Connecter
                            </Link>
                            <a 
                                href="/auth/register" 
                                className={`font-medium px-4 py-2 rounded-full transition-all duration-300 transform hover:scale-105 ${
                                  isScrolled 
                                    ? 'bg-[#af4d30] text-white hover:bg-opacity-90'
                                    : 'bg-white text-[#af4d30] hover:bg-white/90'
                                }`}
                            >
                                S'inscrire
                            </a>
                        </>
                    )}
                    
                    {/* --- MODIFICATION 2 : Badge du panier dynamique --- */}
                    <Link 
                        href="/panier" 
                        className={`relative transition-colors duration-300 ${isScrolled ? 'text-gray-600 hover:text-[#af4d30]' : 'text-white hover:text-white/80'}`}
                        aria-label={`Panier contenant ${cartItemCount} article(s)`}
                    >
                        <ShoppingCart size={24} />
                        {cartItemCount > 0 && (
                            <div className="absolute -top-1 -right-2 w-5 h-5 bg-rose-500 text-white text-xs font-bold flex items-center justify-center rounded-full animate-pulse">
                                {cartItemCount}
                            </div>
                        )}
                    </Link>
                </div>

        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className={`focus:outline-none ${isScrolled ? 'text-[#1f2937]' : 'text-white'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path></svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-white shadow-lg overflow-hidden">
            <div className="px-6 pb-6 pt-2 flex flex-col space-y-4 text-center">
              <Link href="/" className="text-[#1f2937] hover:text-[#af4d30]">Accueil</Link>
              <Link href="/soins" className="text-[#1f2937] hover:text-[#af4d30]">Nos Soins</Link>
              <Link href="/academie" className="text-[#1f2937] hover:text-[#af4d30]">Académie</Link>
              <Link href="/coaching" className="text-[#1f2937] hover:text-[#af4d30]">Coaching</Link>
              <Link href="/contact" className="text-[#1f2937] hover:text-[#af4d30]">Contact</Link>
              <div className="border-t border-gray-200 pt-4 flex flex-col space-y-3">
                 <Link href="/auth/login" className="text-center text-[#1f2937] font-medium py-2 rounded-full bg-gray-100 hover:bg-gray-200">Se Connecter</Link>
                 <a href="/auth/register" className="text-center bg-[#af4d30] text-white px-5 py-2 rounded-full hover:bg-opacity-90">S'inscrire</a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;