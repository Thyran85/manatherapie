'use client';


import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, Fragment, useMemo,useEffect } from 'react';
import { PlusCircle, Calendar, List, X, AlertTriangle, Video, MapPin, Search, Clock,CalendarIcon,Tag,Loader } from 'lucide-react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import toast, { Toaster } from 'react-hot-toast';
import { servicesDetails } from '@/app/soins/servicesData';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import useSWR, { mutate } from 'swr';


// Configurer Moment.js en français
moment.locale('fr');
const localizer = momentLocalizer(moment);

const messages = { today: "Aujourd'hui", previous: '‹', next: '›', month: 'Mois', week: 'Semaine', day: 'Jour', agenda: 'Agenda', noEventsInRange: 'Aucun rendez-vous.' };



const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
        <Loader className="h-12 w-12 animate-spin text-[#af4d30]" />
        <p className="mt-4 text-gray-500 font-semibold">Chargement des données...</p>
    </div>
);

const getStatusBadge = (status) => {
    const styles = {
        'confirmé': 'bg-green-100 text-green-800',
        'en attente': 'bg-blue-100 text-blue-800',
        'annulé': 'bg-red-100 text-red-800',
        'terminé': 'bg-gray-100 text-gray-800',
    };
    return styles[status] || 'bg-yellow-100 text-yellow-800';
};

// Style personnalisé pour les événements
const eventStyleGetter = (event) => {
    let style = {
        borderRadius: '5px',
        border: 'none',
        color: 'white',
        fontSize: '0.8rem',
        opacity: 0.9,
    };
    switch (event.status) {
        case 'confirmé':
            style.backgroundColor = '#28a745'; // Vert
            break;
        case 'en attente':
            style.backgroundColor = '#17a2b8'; // Bleu
            break;
        case 'annulé':
            style.backgroundColor = '#dc3545'; // Rouge
            style.opacity = 0.6;
            break;
        case 'terminé':
            style.backgroundColor = '#6c757d'; // Gris
            style.opacity = 0.7;
            break;
        case 'occupé':
            style.backgroundColor = '#343a40'; // Noir/Gris foncé
            break;
        default:
            style.backgroundColor = '#ffc107'; // Jaune par défaut
    }
    return { style };
};


const AppointmentDetailModal = ({ event, isOpen, setIsOpen }) => {
    if (!event) return null;

    const getStatusBadge = (status) => {
        const styles = {
            'confirmé': 'bg-green-100 text-green-800',
            'en attente': 'bg-blue-100 text-blue-800',
            'annulé': 'bg-red-100 text-red-800',
            'terminé': 'bg-gray-100 text-gray-800',
        };
        return styles[status] || 'bg-yellow-100 text-yellow-800';
    };

    const onCancel = async () => {
        const toastId = toast.loading("Annulation en cours...");
        try {
            const res = await fetch('/api/appointments/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointmentId: event.id }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Impossible d'annuler.");
            }
            
            toast.success("Rendez-vous annulé.", { id: toastId });
            mutate('/api/appointments'); // Redéclenche la récupération des données pour mettre à jour l'UI
            setIsOpen(false);
        } catch (err) {
            toast.error(err.message, { id: toastId });
        }
    };

    return (
         <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-[#1f2937]">{event.title}</Dialog.Title>
                                <div className="mt-4 space-y-3">
                                    <p className="flex items-center gap-2">
                                        <Tag size={16} className="text-[#af4d30]"/> 
                                        Statut : <span className={`px-2 py-1 text-xs font-bold rounded-full ${getStatusBadge(event.status)}`}>{event.status}</span>
                                    </p>
                                    <p className="flex items-center gap-2"><Calendar size={16} className="text-[#af4d30]"/> {moment(event.start).format('dddd D MMMM YYYY')}</p>
                                    <p className="flex items-center gap-2"><Clock size={16} className="text-[#af4d30]"/> De {moment(event.start).format('HH:mm')} à {moment(event.end).format('HH:mm')}</p>
                                    <p className="flex items-center gap-2">
                                        {(event.type === 'coaching' && event.status === 'confirmé' && event.meetLink) ? (
                                <a href={event.meetLink} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">Rejoindre la session</a>
                            ) : (
                                <span className="font-semibold">{event.location}</span>
                            )}
                                    </p>
                                </div>
                                <div className="mt-6 flex gap-4">
                                    <button onClick={() => setIsOpen(false)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium">Fermer</button>
                                    {(event.status === 'en attente' || event.status === 'confirmé') && (
                                     <button onClick={onCancel} className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Annuler le RDV</button>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};


const CreateAppointmentModal = ({ slot, isOpen, setIsOpen, services })  => {
    const router = useRouter();
    const safeServices = useMemo(() => (Array.isArray(services) ? services : []), [services]);
    const [selectedServiceSlug, setSelectedServiceSlug] = useState('');
    const [notes, setNotes] = useState('');
    const [startTime, setStartTime] = useState(new Date());

    useEffect(() => {
        if (isOpen) {
            setStartTime(slot ? new Date(slot.start) : new Date());
            setNotes(''); // On réinitialise les notes à chaque ouverture

            // On initialise le service sélectionné seulement si la liste est chargée et qu'aucun service n'est encore choisi
            if (safeServices.length > 0 && selectedServiceSlug === '') {
                setSelectedServiceSlug(safeServices[0].slug);
            }
        }
    }, [slot, isOpen, safeServices, selectedServiceSlug]);

    const service = safeServices.find(s => s.slug === selectedServiceSlug);
    
     const onConfirm = async (e) => {
        e.preventDefault();
        const toastId = toast.loading("Création de votre rendez-vous...");
        try {
            const res = await fetch('/api/appointments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serviceSlug: selectedServiceSlug, startTime, notes }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Erreur lors de la création.");
            toast.success("Redirection vers la page de paiement...", { id: toastId });
            router.push(`/compte/paiement/${data.appointmentId}`);
        } catch (err) {
            toast.error(err.message, { id: toastId });
        }
        setIsOpen(false);
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-lg transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl">
                                <Dialog.Title as="h3" className="text-2xl font-bold text-[#1f2937]">Nouveau Rendez-vous</Dialog.Title>
                                
<form onSubmit={onConfirm} className="mt-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="font-semibold text-sm">Date</label>
                                        <input type="date" value={moment(startTime).format('YYYY-MM-DD')} onChange={e => setStartTime(moment(e.target.value).toDate())} required className="w-full mt-1 p-3 border rounded-lg"/>
                                    </div>
                                    <div>
                                        <label className="font-semibold text-sm">Heure</label>
                                        <input type="time" value={moment(startTime).format('HH:mm')} onChange={e => {
                                            const [hour, minute] = e.target.value.split(':');
                                            setStartTime(moment(startTime).hour(hour).minute(minute).toDate());
                                        }} required className="w-full mt-1 p-3 border rounded-lg"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="font-semibold text-sm">Type de rendez-vous</label>
                                    <select value={selectedServiceSlug} onChange={(e) => setSelectedServiceSlug(e.target.value)} required className="w-full mt-1 p-3 border rounded-lg">
                                        {safeServices.map(s => <option key={s.slug} value={s.slug}>{s.title}</option>)}
                                    </select>
                                </div>
                                {service && (service.acompte > 0) &&
                                    <div>
                                        <label className="font-semibold text-sm">Acompte Requis</label>
                                        <input type="text" value={`${service.acompte}€`} readOnly className="w-full mt-1 p-3 border bg-gray-100 rounded-lg"/>
                                    </div>
                                }
                                <div>
                                    <label className="font-semibold text-sm">Notes (optionnel)</label>
                                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full mt-1 p-3 border rounded-lg" rows="3"></textarea>
                                </div>
                                <div className="pt-4 flex gap-4">
                                    <button type="button" onClick={() => setIsOpen(false)} className="flex-1 rounded-lg border py-2.5">Annuler</button>
                                    <button type="submit" className="flex-1 rounded-lg bg-[#af4d30] py-2.5 text-white">Confirmer & Payer</button>
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

const fetcher = url => fetch(url).then(res => {
    if (!res.ok) {
        if (res.status === 401) return { error: 'Unauthorized' };
        throw new Error('An error occurred while fetching the data.');
    }
    return res.json();
});
const AppointmentCard = ({ event, onSelect }) => (
    
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
            <div className={`w-2.5 h-16 rounded-full ${eventStyleGetter(event).style.backgroundColor}`}></div>
            <div>
                 <div className="flex items-center gap-3 mb-1">
                    <p className="font-bold text-lg text-[#1f2937]">{event.title}</p>
                    {/* Ce code fonctionnera maintenant */}
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getStatusBadge(event.status)}`}>
                        {event.status}
                    </span>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-2"><CalendarIcon size={14}/> {moment(event.start).format('dddd D MMMM YYYY')}</p>
                <p className="text-sm text-gray-500 flex items-center gap-2"><Clock size={14}/> {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            
            <button onClick={() => onSelect(event)} className="text-sm font-semibold text-[#af4d30] hover:underline">Détails</button>
        </div>
    </motion.div>
);

export default function AppointmentsPage() {
    const { data: allEvents, error: eventsError, isLoading: isLoadingEvents } = useSWR('/api/appointments', fetcher);
    const { data: services, error: servicesError, isLoading: isLoadingServices } = useSWR('/api/services', fetcher);
    const router = useRouter(); 
    const [activeTab, setActiveTab] = useState('calendar');
    const [viewMode, setViewMode] = useState('calendar');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [calendarView, setCalendarView] = useState('week'); 

    useEffect(() => {
        if (allEvents && allEvents.error === 'Unauthorized') {
            // L'API nous dit que nous ne sommes pas autorisés, on redirige vers le login.
            router.push('/auth/login?callbackUrl=/compte/rendez-vous');
        }
    }, [allEvents, router]);

    const validEvents = useMemo(() => Array.isArray(allEvents) ? allEvents : [], [allEvents]);


    const myEvents = useMemo(() => validEvents.filter(e => e.userOwns), [validEvents]);

    const filteredEvents = useMemo(() => {
        return myEvents.filter(event => {
            const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [myEvents, searchTerm, statusFilter]);

    const handleEventSelect = (event) => {
        if (!event.userOwns) {
            toast.error("Ce créneau est déjà réservé par un autre client.");
            return;
        }
        setSelectedEvent(event);
        setDetailModalOpen(true);
    };

    const handleSlotSelect = (slotInfo) => {
        // On vérifie si le créneau n'est pas dans le passé
        if (moment(slotInfo.start).isBefore(moment(), 'day')) {
            toast.error("Vous ne pouvez pas réserver dans le passé.");
            return;
        }
        setSelectedSlot(slotInfo);
        setCreateModalOpen(true);
    };

    const formattedEvents = useMemo(() => {
        return validEvents.map(event => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
        }));
    }, [validEvents]);

    const isLoading = isLoadingEvents || isLoadingServices;
     
    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (allEvents && allEvents.error === 'Unauthorized') {
        return <LoadingSpinner />;
    }

    if (eventsError || servicesError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500">
                <AlertTriangle className="h-12 w-12 mb-4" />
                <p className="font-semibold">Erreur de chargement des données.</p>
                <p>Veuillez rafraîchir la page.</p>
            </div>
        );
    }

      const handleNewAppointment = () => {
        setSelectedSlot(null); // IMPORTANT : Indique au modal qu'aucune date n'est présélectionnée
        setCreateModalOpen(true);
    };

    const tabs = [
        { id: 'calendar', name: 'Calendrier', icon: <CalendarIcon size={18}/> },
        { id: 'soins', name: 'Mes Soins', icon: <List size={18}/> },
        { id: 'coaching', name: 'Mes Coachings', icon: <List size={18}/> },
    ];

    return (
        <div className="relative z-2">
            <Toaster position="bottom-right" />
            <div className="relative z-2  flex justify-between items-center mb-8">
                <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-[#1f2937]">
                    Mes Rendez-vous
                </motion.h1>
                <div className="flex items-center gap-4">
                    {/* Switch de vue */}
                    
                    <motion.button onClick={handleNewAppointment} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 bg-[#af4d30] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-opacity-90">
                        <PlusCircle size={20}/>
                        <span>Nouveau RDV</span>
                    </motion.button>
                </div>
            </div>

            <div className="relative z-2  mb-6 border-b border-gray-200">
                <nav className="-mb-px gap-4 flex space-x-6">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold ${activeTab === tab.id ? 'border-[#af4d30] text-[#af4d30]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            {tab.icon} {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative grow">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input type="text" placeholder="Rechercher un soin..." className="w-full pl-10 pr-4 py-2 border rounded-lg" onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <input type="date" className="p-2 border rounded-lg" value={moment(currentDate).format('YYYY-MM-DD')} onChange={e => setCurrentDate(new Date(e.target.value))}/>
                <select className="p-2 border rounded-lg" onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">Tous les statuts</option>
                    <option value="confirmé">Confirmé</option>
                    <option value="à venir">À venir</option>
                    <option value="passé">Passé</option>
                </select>
            </div>
            
            <AnimatePresence mode="wait">
                {viewMode === 'calendar' ? (
                    <motion.div key="calendar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white p-6 rounded-2xl shadow-sm">
                        {activeTab === 'calendar' && (
                        <div className="bg-white p-2 sm:p-4 rounded-2xl shadow-sm">
                        <BigCalendar
                            localizer={localizer}
                            events={formattedEvents}
                            date={currentDate} onNavigate={date => setCurrentDate(date)}
                            style={{ height: 600 }}
                            messages={messages}
                            eventPropGetter={eventStyleGetter}
                            onSelectEvent={handleEventSelect}
                            selectable
                            onSelectSlot={handleSlotSelect}
                            view={calendarView}
                            onView={view => setCalendarView(view)}
                                views={['month', 'week', 'day']} // On active les vues
                                step={60} // Créneaux de 60 minutes
                                timeslots={1}
                                min={moment().hour(8).minute(0).toDate()} // Début de journée à 8h
                                max={moment().hour(20).minute(0).toDate()}
                        />
                          </div>
                    )}
                    {activeTab === 'soins' && (
                        <div className="space-y-4">
                            {myEvents.filter(e => e.type === 'soin').map(event => (
                                <AppointmentCard key={event.id} event={event} onSelect={handleEventSelect} />
                            ))}
                        </div>
                    )}
                    {activeTab === 'coaching' && (
    <div className="space-y-4">
        {myEvents.filter(e => e.type.startsWith('coaching')).length > 0 ? (
            myEvents.filter(e => e.type.startsWith('coaching')).map(event => (
                <AppointmentCard key={event.id} event={event} onSelect={handleEventSelect} />
            ))
        ) : (
            <div className="text-center bg-white p-12 rounded-2xl shadow-sm">
                <Video className="mx-auto h-16 w-16 text-gray-300" /> {/* Icône de coaching */}
                <h3 className="mt-4 text-xl font-bold text-gray-800">Aucun coaching programmé</h3>
                <p className="mt-2 text-gray-500">Vous n'avez pas encore de séance de coaching à venir.</p>
                <div className="mt-6">
                    <button onClick={handleNewAppointment} className="flex items-center gap-2 mx-auto ...">
                        <PlusCircle size={20}/>
                        <span>Réserver une séance</span>
                    </button>
                </div>
            </div>
        )}
    </div>
)}
                    </motion.div>
                ) : (
                    <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        {filteredEvents.length > 0 ? filteredEvents.map(event => (
                            // --- VUE LISTE MAINTENANT REMPLIE ---
                            <div key={event.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-12 rounded-full ${eventStyleGetter(event).style.backgroundColor}`}></div>
                                    <div>
                                        <p className="font-bold text-[#1f2937]">{event.title}</p>
                                        <p className="text-sm text-gray-500">{moment(event.start).format('dddd D MMMM, HH:mm')}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleEventSelect(event)} className="text-sm font-semibold text-[#af4d30] hover:underline">Voir détails</button>
                            </div>
                        )) :<div className="text-center bg-white p-12 rounded-2xl shadow-sm">
            <CalendarIcon className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-xl font-bold text-gray-800">Aucun rendez-vous trouvé</h3>
            <p className="mt-2 text-gray-500">Vous n'avez pas encore de rendez-vous correspondant à ces filtres.</p>
            <div className="mt-6">
                <button
                    onClick={handleNewAppointment}
                    className="flex items-center gap-2 mx-auto bg-[#af4d30] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-opacity-90"
                >
                    <PlusCircle size={20}/>
                    <span>Prendre un nouveau RDV</span>
                </button>
            </div>
        </div>}
                    </motion.div>
                )}
            </AnimatePresence>

            <AppointmentDetailModal event={selectedEvent} isOpen={isDetailModalOpen} setIsOpen={setDetailModalOpen} />
           {isCreateModalOpen && (
                 <CreateAppointmentModal 
                    slot={selectedSlot} 
                    isOpen={isCreateModalOpen} 
                    setIsOpen={setCreateModalOpen} 
                    services={services} 
                 />
            )}
        </div>
    );
}
