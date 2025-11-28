'use client';

import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, Edit, X, MapPin, AlertTriangle } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import toast, { Toaster } from 'react-hot-toast';

// On peut définir le composant LoadingSpinner ici pour éviter les problèmes d'import
const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-8"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-[#af4d30]"></div></div>
);

const fetcher = url => fetch(url).then(res => {
    if (!res.ok) throw new Error('Erreur de chargement des données.');
    return res.json();
});

// --- MODALE POUR ÉDITER LES INFOS ---
const EditProfileModal = ({ isOpen, setIsOpen, user }) => {
    const [formData, setFormData] = useState({});
    
    useEffect(() => {
        if (user) setFormData({ name: user.name || '', email: user.email || '', phone: user.phone || '', address: user.address || '' });
    }, [user, isOpen]);
    
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Mise à jour...');
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            toast.success('Profil mis à jour !', { id: toastId });
            mutate('/api/profile');
            setIsOpen(false);
        } catch (err) {
            toast.error(err.message, { id: toastId });
        }
    };
    
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/30" /></Transition.Child>
                <div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                            <Dialog.Title as="h3" className="text-xl font-bold flex justify-between items-center">Modifier mes informations <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-100"><X size={20}/></button></Dialog.Title>
                            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                <div><label className="text-sm font-medium">Nom complet</label><input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 w-full p-2 border rounded-md"/></div>
                                <div><label className="text-sm font-medium">Email</label><input type="email" name="email" value={formData.email || ''} onChange={handleChange} required className="mt-1 w-full p-2 border rounded-md"/></div>
                                <div><label className="text-sm font-medium">Adresse</label><input type="text" name="address" value={formData.address || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md"/></div>
                                <div><label className="text-sm font-medium">Téléphone</label><input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md"/></div>
                                <div className="mt-6 flex justify-end gap-2">
                                    <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200">Annuler</button>
                                    <button type="submit" className="px-4 py-2 text-sm text-white bg-[#af4d30] rounded-md hover:bg-opacity-90">Enregistrer</button>
                                </div>
                            </form>
                        </Dialog.Panel>
                    </Transition.Child>
                </div></div>
            </Dialog>
        </Transition>
    );
};

const EditPasswordModal = ({ isOpen, setIsOpen }) => {
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    
    const handleChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwords.newPassword.length < 8) { toast.error("Le nouveau mot de passe doit faire au moins 8 caractères."); return; }
        if (passwords.newPassword !== passwords.confirmPassword) { toast.error("Les nouveaux mots de passe ne correspondent pas."); return; }
        
        const toastId = toast.loading('Mise à jour du mot de passe...');
        try {
            const res = await fetch('/api/profile/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Une erreur est survenue.');
            
            toast.success('Mot de passe mis à jour avec succès !', { id: toastId });
            setIsOpen(false);
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Vider les champs
        } catch (err) {
            toast.error(err.message, { id: toastId });
        }
    };
    
    return (
        // LA STRUCTURE COMPLÈTE EST MAINTENANT PRÉSENTE
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 flex justify-between items-center">
                                    Changer le mot de passe
                                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-100"><X size={20}/></button>
                                </Dialog.Title>
                                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                    <div><label className="text-sm font-medium text-gray-700">Mot de passe actuel</label><input type="password" name="currentPassword" value={passwords.currentPassword} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md"/></div>
                                    <div><label className="text-sm font-medium text-gray-700">Nouveau mot de passe</label><input type="password" name="newPassword" value={passwords.newPassword} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md"/></div>
                                    <div><label className="text-sm font-medium text-gray-700">Confirmer le nouveau</label><input type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md"/></div>
                                    <div className="mt-6 flex justify-end gap-2">
                                        <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200">Annuler</button>
                                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#1f2937] border border-transparent rounded-md hover:bg-opacity-90">Mettre à jour</button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

// --- COMPOSANT PRINCIPAL DE LA PAGE ---
export default function ProfilPage() {
    const { data: user, error, isLoading } = useSWR('/api/profile', fetcher);
    
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
    
    const handlePreferenceChange = async (e) => {
        const { name, checked } = e.target;
        const key = name === 'notif-newsletter' ? 'newsletter_subscribed' : 'reminders_subscribed';

        mutate('/api/profile', { ...user, [key]: checked }, false); // Mise à jour optimiste

        try {
            const res = await fetch('/api/profile/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value: checked }),
            });
            if (!res.ok) throw new Error('Erreur serveur');
            toast.success('Préférences mises à jour.');
        } catch {
            toast.error('Erreur lors de la mise à jour.');
            mutate('/api/profile'); // Revalider pour revenir à l'état du serveur
        }
    };

    if (isLoading) return <LoadingSpinner />;
    if (error) return <div className="text-red-500 p-8 text-center"><AlertTriangle className="mx-auto h-8 w-8 mb-2"/>{error.message}</div>;

    return (
        <div>
            <Toaster position="bottom-right"/>
            <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-[#1f2937] mb-8">Mon Profil</motion.h1>

            <div className="space-y-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Mes Informations</h2>
                        <button onClick={() => setProfileModalOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-[#af4d30] hover:underline"><Edit size={16}/> Modifier</button>
                    </div>
                    <div className="space-y-4 text-gray-700">
                        <div className="flex items-center gap-4"><User className="text-gray-400"/><span className="font-semibold w-24">Nom :</span><span>{user.name || 'Non renseigné'}</span></div>
                        <div className="flex items-center gap-4"><Mail className="text-gray-400"/><span className="font-semibold w-24">Email :</span><span>{user.email || 'Non renseigné'}</span></div>
                        <div className="flex items-center gap-4"><Phone className="text-gray-400"/><span className="font-semibold w-24">Téléphone :</span><span>{user.phone || 'Non renseigné'}</span></div>
                        <div className="flex items-center gap-4"><MapPin className="text-gray-400"/><span className="font-semibold w-24">Adresse :</span><span>{user.address || 'Non renseignée'}</span></div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Sécurité</h2>
                        <button onClick={() => setPasswordModalOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-[#af4d30] hover:underline"><Edit size={16}/> Changer le mot de passe</button>
                    </div>
                </div>
                
                <div className="bg-white p-8 rounded-2xl shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Préférences de Notification</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label htmlFor="notif-reminders" className="cursor-pointer">Recevoir les rappels de RDV par e-mail</label>
                            <input type="checkbox" name="notif-reminders" id="notif-reminders" checked={!!user.reminders_subscribed} onChange={handlePreferenceChange} className="h-4 w-4 rounded text-[#af4d30] focus:ring-[#af4d30]"/>
                        </div>
                        <div className="flex justify-between items-center">
                            <label htmlFor="notif-newsletter" className="cursor-pointer">S'inscrire à la newsletter</label>
                            <input type="checkbox" name="notif-newsletter" id="notif-newsletter" checked={!!user.newsletter_subscribed} onChange={handlePreferenceChange} className="h-4 w-4 rounded text-[#af4d30] focus:ring-[#af4d30]"/>
                        </div>
                    </div>
                </div>
            </div>

            <EditProfileModal isOpen={isProfileModalOpen} setIsOpen={setProfileModalOpen} user={user} />
            <EditPasswordModal isOpen={isPasswordModalOpen} setIsOpen={setPasswordModalOpen} />
        </div>
    );
}