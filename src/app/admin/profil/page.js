'use client';

import { motion } from 'framer-motion';
import { User, Mail, Lock, Edit, X, AlertTriangle } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Importer le useRouter
import toast, { Toaster } from 'react-hot-toast';

// --- (Les composants Modal restent identiques, pas besoin de les modifier) ---
const ProfileSkeleton = () => (
    <div className="animate-pulse">
        <div className="bg-white p-8 rounded-2xl shadow-sm">
            <div className="h-6 w-48 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
                <div className="h-6 w-full bg-gray-200 rounded"></div>
                <div className="h-6 w-full bg-gray-200 rounded"></div>
            </div>
        </div>
    </div>
);

const EditAdminProfileModal = ({ isOpen, setIsOpen, currentUser, onProfileUpdate }) => {
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setFormData({ name: currentUser.name || '', email: currentUser.email || '' });
        }
    }, [currentUser, isOpen]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading('Mise à jour du profil...');
        try {
            const response = await fetch('/api/admin/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Une erreur est survenue.');
            toast.success('Profil mis à jour avec succès !', { id: toastId });
            onProfileUpdate();
            setIsOpen(false);
        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}><Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/30" /></Transition.Child>
            <div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl">
                        <Dialog.Title as="h3" className="text-xl font-bold flex justify-between items-center text-[#1f2937]">Modifier le profil<button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500"><X size={20}/></button></Dialog.Title>
                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                            <div><label className="text-sm font-medium text-gray-700">Nom d'administrateur</label><input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#af4d30]"/></div>
                            <div><label className="text-sm font-medium text-gray-700">Email de connexion</label><input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#af4d30]"/></div>
                            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setIsOpen(false)} className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Annuler</button><button type="submit" disabled={isLoading} className="px-5 py-2 text-sm font-semibold text-white bg-[#af4d30] rounded-lg hover:bg-opacity-90 disabled:bg-gray-400">{isLoading ? 'Enregistrement...' : 'Enregistrer'}</button></div>
                        </form>
                    </Dialog.Panel>
                </Transition.Child>
            </div></div>
        </Dialog></Transition>
    );
};

const EditAdminPasswordModal = ({ isOpen, setIsOpen }) => {
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => { setPasswords({ ...passwords, [e.target.name]: e.target.value }); };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwords.newPassword.length < 8) { toast.error("Le nouveau mot de passe doit faire au moins 8 caractères."); return; }
        if (passwords.newPassword !== passwords.confirmPassword) { toast.error("Les nouveaux mots de passe ne correspondent pas."); return; }

        setIsLoading(true);
        const toastId = toast.loading('Mise à jour du mot de passe...');
        try {
            const response = await fetch('/api/admin/profile/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(passwords),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Une erreur est survenue.');
            toast.success('Mot de passe mis à jour avec succès !', { id: toastId });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setIsOpen(false);
        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}><Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/30" /></Transition.Child>
            <div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl">
                        <Dialog.Title as="h3" className="text-xl font-bold flex justify-between items-center text-[#1f2937]">Changer le mot de passe<button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500"><X size={20}/></button></Dialog.Title>
                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                            <div><label className="text-sm font-medium text-gray-700">Mot de passe actuel</label><input type="password" name="currentPassword" value={passwords.currentPassword} onChange={handleChange} required placeholder="••••••••" className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#af4d30]"/></div>
                            <div><label className="text-sm font-medium text-gray-700">Nouveau mot de passe</label><input type="password" name="newPassword" value={passwords.newPassword} onChange={handleChange} required placeholder="••••••••" className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#af4d30]"/></div>
                            <div><label className="text-sm font-medium text-gray-700">Confirmer le nouveau mot de passe</label><input type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handleChange} required placeholder="••••••••" className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#af4d30]"/></div>
                            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setIsOpen(false)} className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Annuler</button><button type="submit" disabled={isLoading} className="px-5 py-2 text-sm font-semibold text-white bg-[#af4d30] rounded-lg hover:bg-opacity-90 disabled:bg-gray-400">{isLoading ? 'Mise à jour...' : 'Mettre à jour'}</button></div>
                        </form>
                    </Dialog.Panel>
                </Transition.Child>
            </div></div>
        </Dialog></Transition>
    );
};


// --- PAGE PRINCIPALE ---
export default function AdminProfilePage() {
    const [adminData, setAdminData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
    
    const router = useRouter(); // Initialiser le router

    const fetchAdminProfile = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/profile');
            
            // LA CORRECTION PRINCIPALE EST ICI
            if (response.status === 401) {
                // Si non autorisé, rediriger vers la page de login
                router.push('/admin/login');
                return; // Arrêter l'exécution de la fonction
            }

            if (!response.ok) {
                throw new Error("Impossible de récupérer les informations du profil.");
            }
            
            const data = await response.json();
            setAdminData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchAdminProfile();
    }, [fetchAdminProfile]); // Se lance au chargement

    if (isLoading) {
        return (
             <div>
                <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-[#1f2937] mb-8">
                    Mon Compte Administrateur
                </motion.h1>
                <ProfileSkeleton />
            </div>
        );
    }

    if (error) {
        return <div className="text-center text-red-500 p-10"><AlertTriangle className="mx-auto h-10 w-10 mb-4" />{error}</div>;
    }
    
    // Si la redirection a lieu, adminData sera null, donc on ne rend rien.
    if (!adminData) return null;

    return (
        <div>
            <Toaster position="bottom-right" />
            <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-[#1f2937] mb-8">
                Mon Compte Administrateur
            </motion.h1>

            <div className="space-y-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Informations du Compte</h2>
                        <button onClick={() => setProfileModalOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-[#af4d30] hover:underline">
                            <Edit size={16}/> Modifier
                        </button>
                    </div>
                    <div className="space-y-4 text-gray-700">
                        <div className="flex items-center gap-4"><User className="text-gray-400"/><span className="font-semibold w-24">Nom :</span><span>{adminData.name}</span></div>
                        <div className="flex items-center gap-4"><Mail className="text-gray-400"/><span className="font-semibold w-24">Email :</span><span>{adminData.email}</span></div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Sécurité</h2>
                            <p className="text-sm text-gray-500 mt-1">Il est recommandé de changer votre mot de passe régulièrement.</p>
                        </div>
                        <button onClick={() => setPasswordModalOpen(true)} className="flex-shrink-0 flex items-center gap-2 text-sm font-semibold text-[#af4d30] hover:underline">
                            <Edit size={16}/> Changer le mot de passe
                        </button>
                    </div>
                </div>
            </div>

            <EditAdminProfileModal 
                isOpen={isProfileModalOpen} 
                setIsOpen={setProfileModalOpen}
                currentUser={adminData}
                onProfileUpdate={fetchAdminProfile}
            />
            <EditAdminPasswordModal 
                isOpen={isPasswordModalOpen} 
                setIsOpen={setPasswordModalOpen}
            />
        </div>
    );
}
