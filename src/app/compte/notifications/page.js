'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle, XCircle, Video, Trash2, BellOff, Mail } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast'

const READ_STORAGE_KEY = 'compte_notification_read_ids';

const getNotificationVisual = (notif) => {
    const text = (notif.message || '').toLowerCase();
    if (text.includes('email')) return { icon: <Mail className="text-indigo-500" />, tone: 'mail', title: 'Message Admin' };
    if (text.includes('annulé')) return { icon: <XCircle className="text-red-500" />, tone: 'danger' };
    if (text.includes('lien') || text.includes('session') || text.includes('meet')) return { icon: <Video className="text-blue-500" />, tone: 'info' };
    if (text.includes('confirmé') || text.includes('accepté')) return { icon: <CheckCircle className="text-green-500" />, tone: 'success' };
    return { icon: <Calendar className="text-amber-500" />, tone: 'neutral' };
};

const formatRelativeFr = (dateValue) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);

    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffH < 24) return `Il y a ${diffH} h`;
    if (diffD === 1) return 'Hier';
    if (diffD < 7) return `Il y a ${diffD} jours`;
    return date.toLocaleDateString('fr-FR');
};

export default function NotificationsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [readMap, setReadMap] = useState({});

    const loadReadMap = () => {
        try {
            const raw = window.localStorage.getItem(READ_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(parsed)) return {};
            return parsed.reduce((acc, id) => {
                acc[String(id)] = true;
                return acc;
            }, {});
        } catch {
            return {};
        }
    };

    const syncReadMap = (nextReadMap) => {
        setReadMap(nextReadMap);
        try {
            const ids = Object.keys(nextReadMap).filter((id) => nextReadMap[id]);
            window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(ids));
        } catch {}
        window.dispatchEvent(new Event('notifications-updated'));
    };

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/compte/notifications');
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Impossible de charger les notifications.');
            setNotifications(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        syncReadMap(loadReadMap());
        fetchNotifications();
    }, []);

    const mappedNotifications = useMemo(() => {
        return notifications.map((notif) => {
            const visual = getNotificationVisual(notif);
            const createdAt = notif.created_at;
            const isNew = createdAt
                ? (Date.now() - new Date(createdAt).getTime()) < 24 * 60 * 60 * 1000
                : false;
            return {
                ...notif,
                ...visual,
                timeLabel: formatRelativeFr(createdAt),
                fullDateLabel: createdAt ? new Date(createdAt).toLocaleString('fr-FR') : '',
                title: visual.title || (
                    visual.tone === 'danger' ? 'Rendez-vous Annulé' :
                    visual.tone === 'info' ? 'Lien de Session' :
                    visual.tone === 'success' ? 'Mise à Jour Confirmée' :
                    'Notification'
                ),
                actionLabel: 'Ouvrir la page',
                isNew: isNew && !readMap[notif.id],
                text: notif.message,
            };
        });
    }, [notifications, readMap]);

    const deleteNotification = async (id) => {
        try {
            const res = await fetch(`/api/compte/notifications/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Suppression impossible.');
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            syncReadMap(
                Object.keys(readMap).reduce((acc, key) => {
                    if (String(id) !== key) acc[key] = readMap[key];
                    return acc;
                }, {})
            );
            toast.success("Notification supprimée.");
        } catch (error) {
            toast.error(error.message);
        }
    };

    const markAllAsRead = () => {
        const allRead = { ...readMap };
        notifications.forEach((n) => { allRead[n.id] = true; });
        syncReadMap(allRead);
        toast.success("Toutes les notifications ont été marquées comme lues.");
    };

    const deleteAll = async () => {
        try {
            const res = await fetch('/api/compte/notifications', { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Suppression impossible.');
            setNotifications([]);
            syncReadMap({});
            toast.success("Toutes les notifications ont été supprimées.");
        } catch (error) {
            toast.error(error.message);
        }
    };

    const openNotification = (notif) => {
        const nextReadMap = { ...readMap, [String(notif.id)]: true };
        syncReadMap(nextReadMap);

        if (!notif.link) {
            toast('Notification marquée comme lue.');
            return;
        }

        if (notif.link === pathname) {
            toast.success('Notification marquée comme lue.');
            return;
        }

        router.push(notif.link);
    };

    return (
        <div>
            <div className="relative z-[2] flex justify-between items-center mb-8">
                <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-[#1f2937]">
                    Notifications
                </motion.h1>
                <div className="flex gap-4">
                    <button onClick={markAllAsRead} className="text-sm font-semibold text-gray-500 hover:text-[#af4d30] flex items-center gap-1"><BellOff size={16}/> Tout marquer comme lu</button>
                    <button onClick={deleteAll} className="text-sm font-semibold text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 size={16}/> Vider</button>
                </div>
            </div>

            <div className="relative z-[2] bg-white rounded-2xl shadow-sm">
                <ul className="divide-y divide-gray-200">
                    <AnimatePresence>
                    {isLoading ? (
                        <li className="p-8 text-center text-gray-500">Chargement des notifications...</li>
                    ) : mappedNotifications.length > 0 ? mappedNotifications.map((notif, i) => (
                        <motion.li 
                            key={notif.id} 
                            className={`p-6 flex items-start gap-4 transition-colors ${notif.isNew ? 'bg-[#FADDAA]/20' : 'hover:bg-gray-50'}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <div className="flex-shrink-0 mt-1">{notif.icon}</div>
                            <div className="flex-grow">
                                <p className="text-sm font-bold text-[#1f2937]">{notif.title}</p>
                                <p className="text-gray-800 mt-1">{notif.text}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {notif.timeLabel}{notif.fullDateLabel ? ` • ${notif.fullDateLabel}` : ''}
                                </p>
                                {notif.link && notif.tone !== 'mail' && (
                                    <button
                                        type="button"
                                        onClick={() => openNotification(notif)}
                                        className="mt-2 inline-block bg-[#af4d30] text-white px-3 py-1 rounded-full text-xs font-bold hover:bg-opacity-80"
                                    >
                                        {notif.actionLabel}
                                    </button>
                                )}
                                {notif.tone === 'mail' && (
                                    <p className="mt-2 text-xs font-semibold text-indigo-600">
                                        Email envoyé par l'administration.
                                    </p>
                                )}
                            </div>
                            {notif.isNew && <div className="w-2.5 h-2.5 bg-[#af4d30] rounded-full flex-shrink-0 mt-1.5 animate-pulse"></div>}
                            <div className="flex-shrink-0 ml-4">
                                <button onClick={() => deleteNotification(notif.id)} className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </motion.li>
                    )) : (
                            <p className="text-center text-gray-500 p-8">Vous n'avez aucune notification.</p>
                        )}
                    </AnimatePresence>
                </ul>
            </div>
        </div>
    );
}
