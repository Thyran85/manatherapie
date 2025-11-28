'use client';

import { useState, useEffect, Fragment } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Edit, Trash2, Search, X } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import TiptapEditor from '@/app/components/TiptapEditor'; // Assurez-vous que ce chemin est correct
import toast from 'react-hot-toast';

// --- Le Composant Modal Entièrement Fonctionnel ---
const BlogEditorModal = ({ isOpen, setIsOpen, onSave, postToEdit }) => {
    const isEditMode = Boolean(postToEdit);
    
    // État initial pour le formulaire
    const initialState = { title: '', category: '', reading_time: '', slug: '' };

    const [postData, setPostData] = useState(initialState);
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Pré-remplir le formulaire en mode édition
    useEffect(() => {
        if (isOpen) {
            if (isEditMode && postToEdit) {
                setPostData({
                    title: postToEdit.title || '',
                    category: postToEdit.category || '',
                    reading_time: postToEdit.reading_time || '',
                    slug: postToEdit.slug || '',
                });
                setContent(postToEdit.content_html || '');
            } else {
                setPostData(initialState);
                setContent('<p>Commencez à écrire votre article ici...</p>');
            }
        }
    }, [postToEdit, isOpen, isEditMode]);

    const handleChange = (e) => setPostData({ ...postData, [e.target.name]: e.target.value });
    const handleImageChange = (e) => setImageFile(e.target.files[0]);

    // Fonction pour uploader l'image vers notre API
    const uploadImage = async () => {
        if (!imageFile) return null;
        const formData = new FormData();
        formData.append('file', imageFile);
        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error("Échec de l'upload de l'image.");
        const data = await res.json();
        return data.url;
    };

    // Logique de soumission (création ou mise à jour)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading(isEditMode ? 'Mise à jour de l\'article...' : 'Publication de l\'article...');

        try {
            const imageUrl = await uploadImage();
            
            const finalData = { 
                ...postData, 
                content_html: content,
            };

            // Gérer l'URL de l'image
            if (imageUrl) {
                finalData.image_url = imageUrl;
            } else if (isEditMode) {
                finalData.image_url = postToEdit.image_url; // Conserver l'ancienne image
            } else {
                throw new Error("L'image de couverture est obligatoire pour un nouvel article.");
            }
            
            // Déterminer l'URL et la méthode de l'API
            const url = isEditMode ? `/api/admin/blog/${postToEdit.id}` : '/api/admin/blog';
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Une erreur est survenue.");
            }

            toast.success(isEditMode ? 'Article mis à jour !' : 'Article publié !', { id: toastId });
            onSave(); // Rafraîchir la liste dans la page parente
            closeModal();

        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const closeModal = () => {
        setPostData(initialState);
        setContent('');
        setImageFile(null);
        setIsOpen(false);
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={closeModal}>
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-4xl transform rounded-2xl bg-white p-6 sm:p-8 text-left align-middle shadow-xl">
                            <Dialog.Title as="h3" className="text-2xl font-bold flex justify-between items-center">
                                {isEditMode ? "Éditer l'article" : "Rédiger un nouvel article"}
                                <button onClick={closeModal}><X /></button>
                            </Dialog.Title>
                            <form onSubmit={handleSubmit} className="mt-6 space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                                <input type="text" name="title" value={postData.title} onChange={handleChange} placeholder="Titre de l'article" required className="w-full p-3 border rounded-lg text-lg font-bold" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" name="category" value={postData.category} onChange={handleChange} placeholder="Catégorie (ex: Bien-être)" required className="w-full p-3 border rounded-lg" />
                                    <input type="text" name="slug" value={postData.slug} onChange={handleChange} placeholder="url-personnalisee-sans-espaces" required className="w-full p-3 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold">Temps de lecture</label>
                                    <input type="text" name="reading_time" value={postData.reading_time} onChange={handleChange} placeholder="ex: 5 min de lecture" required className="w-full mt-1 p-3 border rounded-lg"/>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold">Image de couverture</label>
                                    <input type="file" onChange={handleImageChange} required={!isEditMode} className="w-full text-sm mt-1 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-[#af4d30]/10 file:text-[#af4d30] hover:file:bg-[#af4d30]/20 cursor-pointer"/>
                                    {isEditMode && <p className="text-xs text-gray-500 mt-1">Laissez vide pour conserver l'image actuelle.</p>}
                                </div>
                                <div>
                                    <label className="text-sm font-semibold mb-1 block">Contenu de l'article</label>
                                    {isOpen && <TiptapEditor content={content} onChange={setContent} />}
                                </div>
                                <div className="pt-4 flex justify-end gap-4 border-t">
                                    <button type="button" onClick={closeModal} disabled={isLoading} className="px-5 py-2 border rounded-lg font-semibold">Annuler</button>
                                    <button type="submit" disabled={isLoading} className="px-5 py-2 bg-[#af4d30] text-white rounded-lg font-semibold">
                                        {isLoading ? 'Sauvegarde...' : (isEditMode ? "Sauvegarder" : "Publier")}
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

// --- La Page Principale qui gère l'affichage de la liste ---
export default function BlogAdminPage() {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [postToEdit, setPostToEdit] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/blog?search=${searchTerm}`);
            if (!res.ok) throw new Error("Erreur de chargement des articles.");
            const data = await res.json();
            setPosts(data);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Déclencher le fetch au chargement et quand le terme de recherche change
    useEffect(() => {
        const handler = setTimeout(() => fetchPosts(), 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const handleCreate = () => {
        setPostToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (post) => {
        // Pour l'édition, on a besoin du contenu complet, que l'API de liste ne fournit pas.
        // On fait donc un appel rapide pour récupérer l'article complet.
        const toastId = toast.loading("Chargement de l'article...");
        fetch(`/api/admin/blog/${post.id}`)
            .then(res => res.json())
            .then(fullPost => {
                toast.dismiss(toastId);
                setPostToEdit(fullPost);
                setIsModalOpen(true);
            })
            .catch(err => toast.error("Impossible de charger l'article.", { id: toastId }));
    };

    const handleDelete = (postId, postTitle) => {
        toast((t) => (
            <div className="flex flex-col gap-4 p-2">
                <p className="font-semibold text-center">Supprimer l'article <br/><strong>"{postTitle}"</strong> ?</p>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => toast.dismiss(t.id)} className="w-full rounded-md border p-2 font-semibold">Annuler</button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            const promise = fetch(`/api/admin/blog/${postId}`, { method: 'DELETE' });
                            toast.promise(promise, {
                                loading: 'Suppression...',
                                success: () => {
                                    fetchPosts(); // Recharger la liste après succès
                                    return 'Article supprimé !';
                                },
                                error: 'La suppression a échoué.',
                            });
                        }}
                        className="w-full rounded-md bg-red-500 p-2 font-semibold text-white"
                    >
                        Supprimer
                    </button>
                </div>
            </div>
        ));
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Gestion du Blog</h1>
                <button onClick={handleCreate} className="flex items-center gap-2 bg-[#af4d30] text-white px-5 py-2.5 rounded-lg font-semibold">
                    <PlusCircle size={20}/>
                    <span>Nouvel Article</span>
                </button>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="relative mb-4">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher par titre ou catégorie..." className="w-full pl-10 py-2 border rounded-lg" />
                </div>
                <div className="space-y-3">
                    {isLoading ? <p>Chargement des articles...</p> : posts.map(post => (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={post.id} className="grid grid-cols-4 items-center p-3 bg-gray-50 rounded-lg">
                            <div className="col-span-2"><p className="font-bold">{post.title}</p></div>
                            <p className="text-gray-500">{post.category}</p>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => handleEdit(post)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-md" title="Éditer"><Edit size={18}/></button>
                                <button onClick={() => handleDelete(post.id, post.title)} className="p-2 text-red-500 hover:bg-red-100 rounded-md" title="Supprimer"><Trash2 size={18}/></button>
                            </div>
                        </motion.div>
                    ))}
                     {!isLoading && posts.length === 0 && <p className="text-center text-gray-500 py-8">Aucun article trouvé.</p>}
                </div>
            </div>
            <BlogEditorModal 
                isOpen={isModalOpen} 
                setIsOpen={setIsModalOpen} 
                onSave={fetchPosts} 
                postToEdit={postToEdit} 
            />
        </div>
    );
}