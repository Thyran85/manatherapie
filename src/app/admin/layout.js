'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname,useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Calendar, Video, BarChart2, Tag, User, LogOut,Book } from 'lucide-react';
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

    // La fonction de déconnexion est maintenant à l'intérieur du composant
    const handleLogout = async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        router.replace('/admin/login');
        router.refresh();
    };

    // On n'affiche pas le layout sur la page de login
    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <div className=" bg-gray-100 min-h-screen">
            <div className="relative z-2 flex">
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
                <main className="flex-1 lg:ml-64 p-6 lg:p-10">
                    {children}
                </main>
            </div>
        </div>
    );
}
