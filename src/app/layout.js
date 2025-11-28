'use client'; 

import { League_Spartan } from "next/font/google"; 
import Image from "next/image";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { usePathname } from 'next/navigation'; 
import SiteBackground from "./components/SiteBackground"; 
import AuthProvider from './components/AuthProvider';
import { CartProvider } from '@/context/CartContext'; 
import { Toaster } from 'react-hot-toast';

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  weight: ['400', '600', '700', '800']
});


export default function RootLayout({ children }) {
   const pathname = usePathname(); 
  const isFullLayoutPage = !pathname.startsWith('/auth') && !pathname.startsWith('/compte') && !pathname.startsWith('/admin');
  return (
    <html lang="fr">
      <body className={leagueSpartan.className}> 
        <AuthProvider>
          <CartProvider> 
            <Toaster 
                            position="top-center"
                            reverseOrder={false}
                        />
        <SiteBackground />
       <div className="flex flex-col min-h-screen">
           {isFullLayoutPage && <Navbar />}
          <main className="flex-grow"> 
            {children}
          </main>
           {isFullLayoutPage && <Footer />}
        </div>
        </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}