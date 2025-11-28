'use client';

import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import { motion } from 'framer-motion';
import { useState, Fragment, useMemo,useEffect } from 'react';
import { Calendar, List, Search, Check, X, User, Clock, AlertTriangle, CreditCard, Euro, Loader } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import toast, { Toaster } from 'react-hot-toast';
import useSWR, { mutate } from 'swr';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('fr');
const localizer = momentLocalizer(moment);

const messages = { today: "Aujourd'hui", previous: '‹', next: '›', month: 'Mois', week: 'Semaine', day: 'Jour', agenda: 'Agenda' };

// --- MODAL DE DÉTAIL ---
const AdminAppointmentDetailModal = ({ event, isOpen, setIsOpen, onStatusChange }) => {
    const [meetLink, setMeetLink] = useState('');

    useEffect(() => {
        // Pré-remplir le champ si un lien existe déjà
        if (event?.meetLink) {
            setMeetLink(event.meetLink);
        } else {
            setMeetLink('');
        }
    }, [event]);

    if (!event) return null;

    const handleStatusChange = (newStatus) => {
        const promise = fetch(`/api/admin/appointments/${event.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        
        toast.promise(promise, {
            loading: 'Mise à jour du statut...',
            success: (res) => {
                if (!res.ok) throw new Error('La mise à jour a échoué.');
                onStatusChange(); // Rafraîchir la liste
                setIsOpen(false);
                return `Rendez-vous ${newStatus}.`;
            },
            error: 'La mise à jour a échoué.',
        });
    };

    const handleSendLink = () => {
        if (!meetLink || !meetLink.startsWith('http')) {
            toast.error('Veuillez entrer un lien valide (ex: https://...).');
            return;
        }
        const promise = fetch(`/api/admin/appointments/${event.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ meet_link: meetLink }),
        });

        toast.promise(promise, {
            loading: 'Envoi du lien...',
            success: (res) => {
                if (!res.ok) throw new Error("L'envoi a échoué.");
                onStatusChange(); // Rafraîchir
                setIsOpen(false);
                return 'Lien envoyé et enregistré !';
            },
            error: "L'envoi du lien a échoué.",
        });
    };
    
    // On considère que les coachings sont de type "Live"
    const isLiveCoaching = event.serviceType && (event.serviceType.toLowerCase() === 'live' || event.serviceType.toLowerCase() === 'coaching');
    const isConfirmed = event.status === 'confirmé';
    const amount = isLiveCoaching ? event.price : event.acompte;
    const amountLabel = isLiveCoaching ? 'Total' : 'Acompte';

    return (
         <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
                <div className="fixed inset-0 bg-black/30" />
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl">
                            <Dialog.Title as="h3" className="text-2xl font-bold text-[#1f2937]">{event.service}</Dialog.Title>
                            <div className="mt-4 space-y-3 text-gray-700">
                                <p className="flex items-center gap-2"><User size={16} className="text-[#af4d30]"/> <strong className="font-semibold text-gray-900">{event.clientName}</strong></p>
                                <p className="flex items-center gap-2"><Calendar size={16} className="text-[#af4d30]"/> {moment(event.start).format('dddd D MMMM YYYY')}</p>
                                <p className="flex items-center gap-2"><Clock size={16} className="text-[#af4d30]"/> De {moment(event.start).format('HH:mm')} à {moment(event.end).format('HH:mm')}</p>
                                <p className="flex items-center gap-2"><CreditCard size={16} className="text-[#af4d30]"/> Paiement : <span className="font-semibold capitalize">{event.paymentStatus.replace('_', ' ')}</span></p>
                                {amount > 0 && <p className="flex items-center gap-2"><Euro size={16} className="text-[#af4d30]"/> {amountLabel} : <span className="font-semibold">{Number(amount).toFixed(2)}€</span></p>}
                            </div>
                            <div className="mt-6 space-y-4">
                                {event.status === 'en attente' && (
                                    <div className="p-4 bg-amber-50 rounded-lg text-amber-800 flex items-start gap-3">
                                        <AlertTriangle size={20} className="flex-shrink-0 mt-0.5"/>
                                        <div>
                                            <h4 className="font-bold">Action Requise</h4>
                                            <p className="text-sm">Confirmez ou annulez ce rendez-vous.</p>
                                            <div className="flex gap-2 mt-3">
                                                <button onClick={() => handleStatusChange('annulé')} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-md font-semibold hover:bg-red-200">Annuler</button>
                                               <button onClick={() => handleStatusChange('confirmé')} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-md font-semibold hover:bg-green-200">Confirmer</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* NOUVEAU BLOC POUR LA GESTION DU LIEN */}
                                {isConfirmed && isLiveCoaching && (
                                     <div className="p-4 bg-sky-50 rounded-lg text-sky-800">
                                         <h4 className="font-bold mb-2">Lien de la Visioconférence</h4>
                                         <p className="text-sm mb-3">Collez ici le lien (Google Meet, Zoom...) et envoyez-le au client.</p>
                                         <div className="flex gap-2">
                                             <input 
                                                 type="url"
                                                 placeholder="https://meet.google.com/..."
                                                 value={meetLink}
                                                 onChange={(e) => setMeetLink(e.target.value)}
                                                 className="w-full p-2 border rounded-md text-sm"
                                             />
                                             <button onClick={handleSendLink} className="px-4 py-2 text-sm text-white bg-[#af4d30] rounded-md hover:bg-opacity-90 font-semibold">Envoyer</button>
                                         </div>
                                     </div>
                                )}
                            </div>

                            <div className="mt-6"><button onClick={() => setIsOpen(false)} className="w-full rounded-lg border border-gray-300 py-2 font-medium hover:bg-gray-50">Fermer</button></div>
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

// --- STYLE DES ÉVÉNEMENTS ---
const getEventStyling = (status) => {
    switch (status) {
        case 'confirmé': return { bg: '#28a745', badge: 'bg-green-100 text-green-700' };
        case 'en attente': return { bg: '#ffc107', badge: 'bg-amber-100 text-amber-700' };
        case 'annulé': return { bg: '#dc3545', badge: 'bg-red-100 text-red-700' };
        case 'terminé': return { bg: '#6c757d', badge: 'bg-gray-100 text-gray-700' };
        default: return { bg: '#6c757d', badge: 'bg-gray-100 text-gray-700' };
    }
};

const eventStyleGetter = (event) => ({
    style: {
        borderRadius: '5px', border: 'none', color: 'white',
        backgroundColor: getEventStyling(event.status).bg,
        opacity: (event.status === 'terminé' || event.status === 'annulé') ? 0.7 : 1,
    }
});

const fetcher = url => fetch(url).then(res => {
    if (!res.ok) throw new Error("Erreur de chargement des données.");
    return res.json();
});

export default function AdminAppointmentsPage() {
    const [viewMode, setViewMode] = useState('calendar');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isModalOpen, setModalOpen] = useState(false);
    
    // --- CORRECTION : La vue par défaut est 'week' ---
    const [calendarView, setCalendarView] = useState('week'); 

    const [calendarDate, setCalendarDate] = useState(new Date());

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const apiUrl = `/api/admin/appointments?search=${debouncedSearchTerm}&status=${statusFilter}`;
    const { data: rawEvents, error, isLoading } = useSWR(apiUrl, fetcher, { 
        refreshInterval: 60000,
        revalidateOnFocus: true,
    });
    
    // --- CORRECTION MAJEURE : Transformer les dates en objets Date ---
    // On utilise useMemo pour que cette transformation ne se fasse que si les données changent.
    const events = useMemo(() => {
        if (!rawEvents) return [];
        return rawEvents.map(event => ({
            ...event,
            start: new Date(event.start), // Conversion de la chaîne ISO en objet Date
            end: new Date(event.end),     // Conversion de la chaîne ISO en objet Date
        }));
    }, [rawEvents]);

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setModalOpen(true);
    };

    const handleListStatusChange = (eventId, newStatus) => {
        const promise = fetch(`/api/admin/appointments/${eventId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });

        toast.promise(promise, {
            loading: 'Mise à jour...',
            success: (res) => {
                if (!res.ok) throw new Error('Échec de la mise à jour.');
                mutate(apiUrl);
                return `Rendez-vous ${newStatus}.`;
            },
            error: 'La mise à jour a échoué.',
        });
    };
    
    return (
        <div>
            <Toaster position="bottom-right"/>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Gestion des Rendez-vous</h1>
                <div className="flex gap-1 bg-gray-200 p-1 rounded-lg">
                    <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-md ${viewMode === 'calendar' ? 'bg-white shadow-sm' : ''}`}><Calendar size={20}/></button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}><List size={20}/></button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="relative md:col-span-2">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input type="text" placeholder="Rechercher par service ou client..." className="w-full pl-10 py-2 border rounded-lg" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <select className="py-2 px-3 border rounded-lg bg-white" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="all">Tous les statuts</option>
                        <option value="en attente">En attente</option>
                        <option value="confirmé">Confirmé</option>
                        <option value="annulé">Annulé</option>
                        <option value="terminé">Terminé</option>
                    </select>
                </div>
                
                {isLoading && (
                    <div className="flex justify-center items-center h-[500px]">
                        <Loader className="w-12 h-12 animate-spin text-[#af4d30]" />
                    </div>
                )}
                {error && !isLoading && <div className="text-center text-red-500 py-10">{error.message}</div>}
                
                {!isLoading && !error && (
                    viewMode === 'calendar' ? (
                        <BigCalendar
                            localizer={localizer}
                            events={events} // On passe les dates formatées
                            style={{ height: 700 }}
                            messages={messages}
                            eventPropGetter={eventStyleGetter}
                            onSelectEvent={handleSelectEvent}
                            view={calendarView} // Contrôlé par l'état
                            onView={view => setCalendarView(view)} // Met à jour l'état au changement
                            date={calendarDate} // On dit au calendrier quelle date afficher
                            onNavigate={date => setCalendarDate(date)}
                            views={['month', 'week', 'day']}
                            min={moment().hour(8).minute(0).toDate()}
                            max={moment().hour(20).minute(0).toDate()}
                        />
                    ) : (
                        <div className="space-y-3">
                            {events.map(event => (
                                <div key={event.id} className="grid grid-cols-1 md:grid-cols-4 items-center p-3 bg-gray-50 rounded-lg gap-2">
                                    <div><p className="font-bold">{event.service}</p><p className="text-sm text-gray-500">{event.clientName}</p></div>
                                    <p className="text-gray-600 text-sm md:text-base">{moment(event.start).format('D MMM YYYY, HH:mm')}</p>
                                    <div className="text-center">
                                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${getEventStyling(event.status).badge}`}>{event.status}</span>
                                    </div>
                                    <div className="flex justify-end gap-2 items-center">
                                        <button onClick={() => handleSelectEvent(event)} className="text-sm font-semibold text-[#af4d30] hover:underline">Détails</button>
                                        {event.status === 'en attente' && (
                                            <>
                                                <button onClick={() => handleListStatusChange(event.id, 'annulé')} className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"><X size={16}/></button>
                                                 <button onClick={() => handleListStatusChange(event.id, 'confirmé')} className="p-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200"><Check size={16}/></button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {events.length === 0 && <p className="text-center text-gray-500 py-8">Aucun rendez-vous trouvé pour ces filtres.</p>}
                        </div>
                    )
                )}
            </div>
            <AdminAppointmentDetailModal 
                event={selectedEvent} 
                isOpen={isModalOpen} 
                setIsOpen={setModalOpen} 
                onStatusChange={() => mutate(apiUrl)} 
            />
        </div>
    );
}