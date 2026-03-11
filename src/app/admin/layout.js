'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Calendar, Video, BarChart2, User, LogOut, Book, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import './admin.css';


const navItems = [
    { name: "Dashboard", href: "/admin", icon: <LayoutDashboard/> },
    { name: "Clients", href: "/admin/clients", icon: <Users/> },
    { name: "Rendez-vous", href: "/admin/rendez-vous", icon: <Calendar/> },
    { name: "Formations", href: "/admin/formations", icon: <Video/> },
    { name: "Statistiques", href: "/admin/statistiques", icon: <BarChart2/> },
    { name: "Blog", href: "/admin/blog", icon: <Book/> },
];

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter(); // On peut maintenant appeler useRouter ici
    const isLoginPage = pathname === '/admin/login';
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAuthChecked, setIsAuthChecked] = useState(false);

    // La fonction de déconnexion est maintenant à l'intérieur du composant
    const handleLogout = async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        router.replace('/admin/login');
        router.refresh();
    };

    useEffect(() => {
        if (isLoginPage) return;
        let isMounted = true;
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/admin/profile', { cache: 'no-store' });
                if (!res.ok) throw new Error('Unauthorized');
                if (isMounted) setIsAuthChecked(true);
            } catch (err) {
                router.replace('/admin/login');
            }
        };
        checkAuth();
        return () => {
            isMounted = false;
        };
    }, [isLoginPage, router]);

    // On n'affiche pas le layout sur la page de login
    if (isLoginPage) {
        return <>{children}</>;
    }

    if (!isAuthChecked) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500">
                Vérification de la session...
            </div>
        );
    }

    return (
        <div className="bg-gray-100 min-h-screen overflow-x-hidden">
            <div className="relative z-2 flex min-w-0">
                {/* Mobile top bar */}
                <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 lg:hidden">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
                        aria-label="Ouvrir le menu"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="relative h-8 w-8 rounded-full overflow-hidden">
                            <Image src="/images/logo.jpeg" alt="manatherapy logo" fill className="object-cover" />
                        </div>
                        <div className="leading-tight">
                            <p className="text-sm font-bold">manatherapy</p>
                            <p className="text-[10px] text-gray-500">ADMIN</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-md text-red-500 hover:bg-red-50"
                        aria-label="Déconnexion"
                    >
                        <LogOut size={18} />
                    </button>
                </div>

                {/* Mobile drawer */}
                <div className={`fixed inset-0 z-40 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}>
                    <div
                        className="absolute inset-0 bg-black/30"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-hidden="true"
                    />
                    <aside className="absolute left-0 top-0 h-full w-72 bg-white p-6 flex flex-col justify-between shadow-xl">
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="relative h-10 w-10 rounded-full overflow-hidden">
                                        <Image src="/images/logo.jpeg" alt="manatherapy logo" fill className="object-cover" />
                                    </div>
                                    <div>
                                        <p className="font-bold">manatherapy</p>
                                        <p className="text-xs text-gray-500">ADMIN</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
                                    aria-label="Fermer le menu"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <nav className="space-y-2">
                                {navItems.map(item => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${pathname === item.href ? 'bg-[#af4d30] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        {item.icon}
                                        <span className="font-semibold">{item.name}</span>
                                    </Link>
                                ))}
                            </nav>
                        </div>
                        <div className="space-y-2">
                            <Link
                                href="/admin/profil"
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${pathname === '/admin/profil' ? 'bg-gray-100' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <User /> <span className="font-semibold">Mon Compte</span>
                            </Link>
                            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-red-500 hover:bg-red-50 font-semibold">
                                <LogOut /> <span>Déconnexion</span>
                            </button>
                        </div>
                    </aside>
                </div>

                {/* Desktop sidebar */}
                <aside className="fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 p-6 flex-col justify-between hidden lg:flex">
                    <div>
                        <div className="mb-10 text-center">
                            <Link href="/admin" className="relative block h-16 w-16 mx-auto rounded-full overflow-hidden">
                                <Image src="/images/logo.jpeg" alt="manatherapy logo" fill className="object-cover"/>
                                <p className="font-bold text-lg">manatherapy</p>
                                <p className="text-xs text-gray-500">ADMIN</p>
                            </Link>
                        </div>
                        <nav className="space-y-2">
                            {navItems.map(item => (
                                <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${pathname === item.href ? 'bg-[#af4d30] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                                    {item.icon}
                                    <span className="font-semibold">{item.name}</span>
                                </Link>
                            ))}
                        </nav>
                    </div>
                    <div className="space-y-2">
                         <Link href="/admin/profil" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${pathname === '/admin/profil' ? 'bg-gray-100' : 'text-gray-600 hover:bg-gray-100'}`}>
                            <User/> <span className="font-semibold">Mon Compte</span>
                         </Link>
                         <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-red-500 hover:bg-red-50 font-semibold">
                            <LogOut/> <span>Déconnexion</span>
                         </button>
                    </div>
                </aside>
                <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-10 pt-20 lg:pt-10 min-w-0 w-full overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
