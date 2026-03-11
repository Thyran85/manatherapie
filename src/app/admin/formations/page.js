'use client';
import { PlusCircle, Search, Trash2, Edit, Eye, X } from 'lucide-react';
import { useState, useEffect, useMemo, Fragment, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const INITIAL_FORMATION_STATE = {
    title: '',
    type: 'video',
    category: '',
    price: '',
    slug: '',
    description: '',
    whatYoullLearn: '',
    modules: '',
};

const CreateFormationModal = ({ isOpen, setIsOpen, onFormationCreated, courseToEdit }) => {
    // Déterminer si nous sommes en mode édition en vérifiant si courseToEdit existe
    const isEditMode = Boolean(courseToEdit);

    const [formData, setFormData] = useState(INITIAL_FORMATION_STATE);
    const [coverImageFile, setCoverImageFile] = useState(null);
    const [courseFile, setCourseFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // useEffect pour pré-remplir le formulaire lors de l'ouverture en mode édition
    useEffect(() => {
        if (isOpen) {
            if (isEditMode && courseToEdit) {
                // Pré-remplir le formulaire avec les données existantes
                setFormData({
                    title: courseToEdit.title || '',
                    type: courseToEdit.type || 'video',
                    category: courseToEdit.category || '',
                    price: courseToEdit.price || '',
                    slug: courseToEdit.slug || '',
                    description: courseToEdit.description || '',
                    whatYoullLearn: Array.isArray(courseToEdit.what_you_learn) ? courseToEdit.what_you_learn.join('\n') : '',
                    modules: Array.isArray(courseToEdit.modules) ? courseToEdit.modules.map(m => `${m.title}, ${m.duration}`).join('\n') : '',
                });
            } else {
                // S'assurer que le formulaire est vide pour la création
                setFormData(INITIAL_FORMATION_STATE);
            }
        }
    }, [courseToEdit, isOpen, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCoverImageChange = (e) => setCoverImageFile(e.target.files[0]);
    const handleCourseFileChange = (e) => setCourseFile(e.target.files[0]);

    const uploadFile = async (file) => {
        if (!file) return null;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch('/api/admin/upload', { method: 'POST', body: formData });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Échec de l\'upload');
            }
            const data = await response.json();
            return data.url;
        } catch (err) {
            throw err;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading(isEditMode ? 'Mise à jour en cours...' : 'Création en cours...');
        setIsLoading(true);
        setError(null);

        try {
            // Upload des fichiers UNIQUEMENT s'ils ont été sélectionnés
            const imageUrl = await uploadFile(coverImageFile);
            const fileUrl = await uploadFile(courseFile);

            // En mode création, au moins un fichier est souvent requis, mais on rend ça optionnel pour la mise à jour
            if (!isEditMode && (!coverImageFile || !courseFile)) {
                 throw new Error("L'image de couverture et le fichier de cours sont obligatoires pour une nouvelle formation.");
            }

            const finalData = {
                ...formData,
                price: parseFloat(formData.price),
                whatYoullLearn: formData.whatYoullLearn.split('\n').filter(line => line.trim() !== ''),
                modules: formData.modules.split('\n').map(line => {
                    const [title, duration] = line.split(',');
                    return { title: title?.trim(), duration: duration?.trim() };
                }).filter(mod => mod.title && mod.duration),
            };

            // Ajouter les URLs des nouveaux fichiers seulement s'ils ont été uploadés
            if (imageUrl) finalData.imageUrl = imageUrl;
            if (fileUrl) finalData.fileUrl = fileUrl;

            // Déterminer la méthode et l'URL de l'API
            const url = isEditMode ? `/api/admin/formations/${courseToEdit.id}` : '/api/admin/formations';
            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'L\'opération a échoué.');
            }

            toast.success(isEditMode ? 'Formation mise à jour avec succès !' : 'Formation créée avec succès !', { id: toastId });
            onFormationCreated(); // Rafraîchit la liste
            closeModal();

        } catch (err) {
            toast.error(err.message, { id: toastId });
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const closeModal = () => {
        setFormData(INITIAL_FORMATION_STATE);
        setCoverImageFile(null);
        setCourseFile(null);
        setError(null);
        setIsLoading(false);
        setIsOpen(false);
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={closeModal}>
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-3xl transform rounded-2xl bg-white p-5 sm:p-8 text-left align-middle shadow-xl transition-all">
                            <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-[#1f2937] flex justify-between items-center">
                                {isEditMode ? 'Modifier la formation' : 'Créer une nouvelle formation'}
                                <button onClick={closeModal}><X/></button>
                            </Dialog.Title>
                            
                            <form onSubmit={handleSubmit} className="mt-6 space-y-4 max-h-[70vh] overflow-y-auto pr-2 sm:pr-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <input type="text" name="title" placeholder="Titre de la formation" value={formData.title} onChange={handleChange} required className="w-full p-3 border rounded-lg sm:col-span-2"/>
                                    <select name="type" value={formData.type} onChange={handleChange} className="w-full p-3 border rounded-lg">
                                        <option value="video">Vidéo</option>
                                        <option value="ebook">Ebook</option>
                                    </select>
                                    <input type="text" name="category" placeholder="Catégorie (ex: Massage)" value={formData.category} onChange={handleChange} required className="w-full p-3 border rounded-lg"/>
                                    <input type="number" name="price" placeholder="Prix (ex: 49.99)" step="0.01" value={formData.price} onChange={handleChange} required className="w-full p-3 border rounded-lg"/>
                                    <input type="text" name="slug" placeholder="Slug URL (ex: art-automassage)" value={formData.slug} onChange={handleChange} required className="w-full p-3 border rounded-lg"/>
                                </div>
                                <textarea name="description" placeholder="Description courte" value={formData.description} onChange={handleChange} required className="w-full p-3 border rounded-lg" rows="3"></textarea>
                                
                                <div>
                                    <label className="text-sm font-semibold">Image de couverture</label>
                                    <input type="file" accept="image/*" onChange={handleCoverImageChange} required={!isEditMode} className="w-full text-sm mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#af4d30]/10 file:text-[#af4d30] hover:file:bg-[#af4d30]/20 cursor-pointer"/>
                                    {isEditMode && <p className="text-xs text-gray-500 mt-1">Laissez vide pour conserver l'image actuelle.</p>}
                                </div>
                                
                                <div>
                                    <label className="text-sm font-semibold">Fichier du cours ({formData.type === 'video' ? 'Vidéo' : 'PDF/Ebook'})</label>
                                    <input type="file" accept={formData.type === 'video' ? 'video/*' : '.pdf,.epub,.mobi'} onChange={handleCourseFileChange} required={!isEditMode} className="w-full text-sm mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#af4d30]/10 file:text-[#af4d30] hover:file:bg-[#af4d30]/20 cursor-pointer"/>
                                    {isEditMode && <p className="text-xs text-gray-500 mt-1">Laissez vide pour conserver le fichier actuel.</p>}
                                </div>

                                <textarea name="whatYoullLearn" placeholder="Ce que vous allez apprendre (un par ligne)" value={formData.whatYoullLearn} onChange={handleChange} required className="w-full p-3 border rounded-lg" rows="4"></textarea>
                                <textarea name="modules" placeholder="Modules (ex: Titre 1, 15 min - un par ligne)" value={formData.modules} onChange={handleChange} required className="w-full p-3 border rounded-lg" rows="4"></textarea>
                                
                                {error && <p className="text-center text-red-600 font-semibold bg-red-100 p-2 rounded-lg">{error}</p>}

                                <div className="pt-4 flex justify-end gap-4 border-t">
                                    <button type="button" onClick={closeModal} disabled={isLoading} className="px-5 py-2 border rounded-lg font-semibold disabled:opacity-50">Annuler</button>
                                    <button type="submit" disabled={isLoading} className="px-5 py-2 bg-[#af4d30] text-white rounded-lg font-semibold disabled:bg-gray-400">
                                        {isLoading ? 'Sauvegarde...' : (isEditMode ? 'Sauvegarder les modifications' : 'Créer la formation')}
                                    </button>
                                </div>
                            </form>
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};


export default function FormationsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null); 
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('created_at_desc');
    
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fonction pour récupérer les données depuis notre API
    const fetchCourses = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                search: searchTerm,
                category: filterCategory,
                type: filterType,
                sortBy: sortBy,
            });
            const response = await fetch(`/api/admin/formations?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des données.');
            }
            const data = await response.json();
            setCourses(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, filterCategory, filterType, sortBy]);



    useEffect(() => {
        // On peut ajouter un petit délai (debounce) pour la recherche pour ne pas surcharger l'API
        const handler = setTimeout(() => {
            fetchCourses();
        }, 300); // Attendre 300ms après la dernière frappe avant de lancer la recherche

        return () => {
            clearTimeout(handler); // Nettoyer le timer
        };
    }, [fetchCourses]); 

    const categories = useMemo(() => {
        // Pour éviter de recalculer à chaque rendu, on utilise useMemo
        // Note: ceci ne verra que les catégories des cours déjà chargés.
        // Une meilleure approche serait d'avoir une API dédiée /api/categories
        // Mais pour l'instant, c'est suffisant.
        const allCategories = courses.map(c => c.category);
        return ['all', ...Array.from(new Set(allCategories))];
    }, [courses]);

    const handleFormationCreated = () => {
        fetchCourses();
    };
    
    // La logique de suppression
    const handleDelete = (courseId, courseTitle, buyers) => {
    if (buyers > 0) {
        toast.error("Suppression impossible : des clients ont acheté cette formation.");
        return;
    }

    // Afficher un toast de confirmation personnalisé
    toast((t) => (
        <div className="flex flex-col gap-4">
            <p className="text-center font-semibold">
                Êtes-vous sûr de vouloir supprimer la formation <br/>
                <strong className="text-red-600">"{courseTitle}"</strong> ?
            </p>
            <div className="grid grid-cols-2 gap-2">
                {/* Bouton pour annuler */}
                <button
                    className="w-full rounded-md border p-2 text-sm font-semibold"
                    onClick={() => toast.dismiss(t.id)} // Ferme le toast
                >
                    Annuler
                </button>
                {/* Bouton pour confirmer la suppression */}
                <button
                    className="w-full rounded-md bg-red-500 p-2 text-sm font-semibold text-white hover:bg-red-600"
                    onClick={() => {
                        // Fermer le toast de confirmation
                        toast.dismiss(t.id);

                        // Lancer la suppression avec un toast de promesse
                        const promise = fetch(`/api/admin/formations/${courseId}`, {
                            method: 'DELETE',
                        });

                        toast.promise(promise, {
                            loading: 'Suppression en cours...',
                            success: (res) => {
                                if (!res.ok) throw new Error('La suppression a échoué.');
                                // Mettre à jour l'état de l'interface
                                setCourses(prevCourses => prevCourses.filter(c => c.id !== courseId));
                                return 'Formation supprimée !';
                            },
                            error: (err) => err.message || 'La suppression a échoué.',
                        });
                    }}
                >
                    Oui, supprimer
                </button>
            </div>
        </div>
    ), {
        duration: 6000, // Le toast disparaîtra après 6 secondes s'il n'y a pas d'action
    });
};

    const handleEdit = (course) => {
        setEditingCourse(course);
        setIsModalOpen(true);
    };


    const handleCreate = () => {
        setEditingCourse(null); // S'assurer qu'aucune formation n'est en cours d'édition
        setIsModalOpen(true);
    };

    return (
        <div className="min-w-0 w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold">Gestion des Formations</h1>
                <button className="flex items-center justify-center gap-2 bg-[#af4d30] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-opacity-90 cusror-pointer w-full sm:w-auto" onClick={handleCreate} >
                    <PlusCircle size={20}/>
                    <span>Créer une formation</span>
                </button>
            </div>
            
           <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm min-w-0 overflow-hidden">
               <div className="flex flex-col md:flex-row gap-4 mb-6">
    {/* Barre de recherche (prendra plus de place) */}
    <div className="relative flex-grow">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input 
            type="text" 
            placeholder="Rechercher une formation..." 
            className="w-full pl-10 py-2 border rounded-lg" 
            onChange={e => setSearchTerm(e.target.value)} 
            value={searchTerm} 
        />
    </div>
    {/* Conteneur pour les menus déroulants */}
    <div className="flex flex-col sm:flex-row gap-4">
        {/* Filtre par Type */}
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full sm:w-40 p-2 border rounded-lg bg-white">
            <option value="all">Tous les types</option>
            <option value="video">Vidéo</option>
            <option value="ebook">Ebook</option>
        </select>
        {/* Filtre par Catégorie */}
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full sm:w-48 p-2 border rounded-lg bg-white">
            <option value="all">Toutes les catégories</option>
            {categories.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
            ))}
        </select>
        {/* Filtre de Tri */}
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full sm:w-56 p-2 border rounded-lg bg-white">
            <option value="created_at_desc">Trier par : Plus récent</option>
            <option value="title_asc">Trier par : Ordre alphabétique</option>
        </select>
    </div>
</div>
                
                {isLoading && <p>Chargement des formations...</p>}
                {error && <p className="text-red-500">Erreur: {error}</p>}

                <div className="space-y-3">
                    {!isLoading && !error && (
                        <>
                            {/* Mobile cards */}
                            <div className="space-y-3 md:hidden">
                                {courses.map(course => (
                                    <motion.div
                                        key={course.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="bg-gray-50 rounded-xl p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-16 h-12 rounded-md overflow-hidden bg-gray-200 shrink-0">
                                                <Image src={course.image_url || '/images/placeholder.png'} alt={course.title} fill className="object-cover"/>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold truncate">{course.title}</p>
                                                <p className="text-sm text-gray-500 truncate">{course.category}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <p className="text-xs uppercase text-gray-400">Prix</p>
                                                <p className="text-gray-700 font-semibold">{course.price}€</p>
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase text-gray-400">Clients</p>
                                                <p className="text-gray-700"><strong>{course.total_buyers}</strong> clients</p>
                                                {course.pending_buyers > 0 && (
                                                    <p className="text-xs text-amber-600">{course.pending_buyers} en attente</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-3 flex justify-end gap-2">
                                            <Link href={`/admin/formations/${course.slug}`} className="p-2 text-gray-500 hover:bg-gray-200 rounded-md" title="Voir les détails et les acheteurs">
                                                <Eye size={18}/>
                                            </Link>
                                            <button className="p-2 text-gray-500 hover:bg-gray-200 rounded-md" title="Éditer" onClick={() => handleEdit(course)} >
                                                <Edit size={18}/>
                                            </button>
                                            <button
                                                className={`p-2 rounded-md ${course.total_buyers > 0 ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-100'}`}
                                                disabled={course.total_buyers > 0}
                                                onClick={() => handleDelete(course.id, course.title, course.total_buyers)}
                                                title={course.total_buyers > 0 ? "Impossible de supprimer" : "Supprimer"}
                                            >
                                                <Trash2 size={18}/>
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Desktop rows */}
                            <div className="hidden md:block">
                                {courses.map(course => (
                                    <motion.div 
                                        key={course.id} 
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="grid grid-cols-6 items-center p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="col-span-3 flex items-center gap-4">
                                            {/* Mettez une image par défaut si course.image_url est null */}
                                            <div className="relative w-20 h-14 rounded-md overflow-hidden bg-gray-200">
                                              <Image src={course.image_url || '/images/placeholder.png'} alt={course.title} fill className="object-cover"/>
                                            </div>
                                            <div>
                                                <p className="font-bold">{course.title}</p>
                                                <p className="text-sm text-gray-500">{course.category}</p>
                                            </div>
                                        </div>
                                        <p className="text-gray-600">{course.price}€</p>
                                        <div>
                                            <p className="text-gray-600"><strong>{course.total_buyers}</strong> clients</p>
                                            {course.pending_buyers > 0 && 
                                                <p className="text-xs text-amber-600">{course.pending_buyers} en attente</p>
                                            }
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/admin/formations/${course.slug}`} className="p-2 text-gray-500 hover:bg-gray-200 rounded-md" title="Voir les détails et les acheteurs">
                                                <Eye size={18}/>
                                            </Link>
                                            <button className="p-2 text-gray-500 hover:bg-gray-200 rounded-md" title="Éditer" onClick={() => handleEdit(course)} >
                                                <Edit size={18}/>
                                            </button>
                                            <button 
                                                className={`p-2 rounded-md ${course.total_buyers > 0 ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-100'}`} 
                                                disabled={course.total_buyers > 0}
                                                onClick={() => handleDelete(course.id, course.title, course.total_buyers)} 
                                                title={course.total_buyers > 0 ? "Impossible de supprimer" : "Supprimer"}
                                            >
                                                <Trash2 size={18}/>
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}
                     {!isLoading && courses.length === 0 && (
                        <p className="text-center text-gray-500 py-8">Aucune formation trouvée.</p>
                    )}
                </div>
            </div>
            <CreateFormationModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} onFormationCreated={handleFormationCreated} courseToEdit={editingCourse} />
        </div>
    );
}
