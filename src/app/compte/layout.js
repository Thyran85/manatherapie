'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, Video, User, Bell, LogOut, Menu, ShoppingCart } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion'; // Importer AnimatePresence
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useCart } from '@/context/CartContext';

const READ_STORAGE_KEY = 'compte_notification_read_ids';


// On extrait le menu dans son propre composant pour le réutiliser
const SideNav = () => {
    const pathname = usePathname();
    const { cartItems } = useCart(); // Récupérer les items du panier
    const cartItemCount = cartItems.length;
    const [notificationsBadge, setNotificationsBadge] = useState(null);

    const loadReadIds = useCallback(() => {
        if (typeof window === 'undefined') return new Set();
        try {
            const raw = window.localStorage.getItem(READ_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
        } catch {
            return new Set();
        }
    }, []);

    const refreshNotificationsBadge = useCallback(async () => {
        try {
            const res = await fetch('/api/compte/notifications', { cache: 'no-store' });
            if (!res.ok) {
                setNotificationsBadge(null);
                return;
            }
            const notifications = await res.json();
            const readIds = loadReadIds();
            const unreadCount = (Array.isArray(notifications) ? notifications : []).filter(
                (notif) => !readIds.has(String(notif.id))
            ).length;
            setNotificationsBadge(unreadCount > 0 ? unreadCount : null);
        } catch {
            setNotificationsBadge(null);
        }
    }, [loadReadIds]);

    useEffect(() => {
        refreshNotificationsBadge();

        const onNotificationsUpdated = () => refreshNotificationsBadge();
        window.addEventListener('notifications-updated', onNotificationsUpdated);
        window.addEventListener('focus', onNotificationsUpdated);

        return () => {
            window.removeEventListener('notifications-updated', onNotificationsUpdated);
            window.removeEventListener('focus', onNotificationsUpdated);
        };
    }, [refreshNotificationsBadge]);

    const navItems = [
    { name: "Tableau de Bord", href: "/compte", icon: <LayoutDashboard/> },
    { name: "Mes Rendez-vous", href: "/compte/rendez-vous", icon: <Calendar/> },
    { name: "Mes Formations", href: "/compte/formations", icon: <Video/> },
    { name: "Mon Profil", href: "/compte/profil", icon: <User/> },
    { name: "Notifications", href: "/compte/notifications", icon: <Bell/>, badge: notificationsBadge },
    { 
            name: "Mon Panier", 
            href: "/compte/panier", 
            icon: <ShoppingCart/>, 
            badge: cartItemCount > 0 ? cartItemCount : null 
        },
];
    

const handleLogout = () => {
    signOut({ callbackUrl: '/auth/login' }); // On dit à Next-Auth de déconnecter et de rediriger
};


    return (
        <div className="  bg-white border-r border-gray-200 h-full p-6 flex flex-col justify-between">
            <div className="">
                <div className="mb-10">
                    <Link href="/" className="relative block h-16 w-16 mx-auto rounded-full overflow-hidden">
                        <Image src="/images/logo.jpeg" alt="manatherapy logo" fill className="object-cover"/>
                    </Link>
                </div>
                 <nav className="space-y-2">
                    {navItems.map(item => (
                        <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${pathname === item.href ? 'bg-[#af4d30] text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-[#1f2937]'}`}>
                            {item.icon}
                            <span className="font-semibold">{item.name}</span>
                            {/* Le rendu du badge est conditionnel */}
                            {item.badge && (
                                <span className="ml-auto bg-rose-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>
            </div>
            <div>
                <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-red-500 hover:bg-red-50 font-semibold transition-colors">
    <LogOut/>
    <span>Déconnexion</span>
</button>
            </div>
        </div>
    );
};




export default function AccountLayout({ children }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="relative z-2  bg-gray-50 min-h-screen">
            <div className="flex">
                {/* --- Barre latérale pour grands écrans, maintenant STICKY --- */}
                <aside className="w-64 shrink-0 hidden lg:block sticky top-0 h-screen">
                    <SideNav />
                </aside>
                
                {/* --- Menu mobile (hamburger) --- */}
                <div className="lg:hidden fixed top-4 left-4 z-50">
                     <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white rounded-full shadow-md text-gray-800">
                        <Menu />
                    </button>
                </div>
                <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div 
                        className="lg:hidden fixed inset-0 z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                         <div className="absolute inset-0 bg-black/30" onClick={() => setIsMobileMenuOpen(false)}></div>
                         <motion.div 
                            className="relative w-64 h-full"
                            initial={{ x: "-100%" }}
                            animate={{ x: "0%" }}
                            exit={{ x: "-100%" }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                         >
                            <SideNav />
                         </motion.div>
                    </motion.div>
                )}
                </AnimatePresence>

                {/* --- Contenu Principal --- */}
                <main className="flex-1 p-4 sm:p-6 lg:p-10 pt-16 sm:pt-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
