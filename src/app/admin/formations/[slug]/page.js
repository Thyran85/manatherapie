'use client';

import { ArrowLeft, Check, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useState, useEffect, useCallback, use } from 'react'; 

export default function FormationDetailPage({ params }) {
    const { slug } = use(params);
    const [course, setCourse] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fonction pour récupérer les données du cours via notre nouvelle API
    const fetchCourseDetails = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // On appelle directement la nouvelle API, beaucoup plus efficace !
            const detailRes = await fetch(`/api/admin/formations/slug/${slug}`);
            
            if (!detailRes.ok) {
                const errorData = await detailRes.json();
                throw new Error(errorData.message || "Impossible de charger les détails.");
            }
            
            const detailData = await detailRes.json();
            setCourse(detailData);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        if (slug) { // On s'assure que le slug est disponible avant de lancer le fetch
            fetchCourseDetails();
        }
    }, [slug, fetchCourseDetails]);

    // Fonction pour gérer la mise à jour du statut d'un achat
    const handleUpdatePurchaseStatus = async (purchaseId, newStatus) => {
        const promise = fetch(`/api/admin/purchases/${purchaseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });

        toast.promise(promise, {
            loading: 'Mise à jour...',
            success: (res) => {
                if (!res.ok) throw new Error('La mise à jour a échoué.');
                // Mettre à jour l'état local pour refléter le changement
                setCourse(prevCourse => ({
                    ...prevCourse,
                    buyers: prevCourse.buyers.map(buyer => 
                        buyer.purchase_id === purchaseId ? { ...buyer, status: newStatus } : buyer
                    )
                }));
                return 'Statut mis à jour !';
            },
            error: 'Une erreur est survenue.',
        });
    };

    if (isLoading) return <div className="text-center py-10">Chargement...</div>;
    if (error) return <div className="text-center py-10 text-red-500">Erreur : {error}</div>;
    if (!course) return <div>Formation non trouvée.</div>;

    const buyers = course.buyers || [];
    return (
        <div>
            <Link href="/admin/formations" className="flex items-center gap-2 text-gray-500 hover:text-[#1f2937] mb-6">
                <ArrowLeft size={18}/> Retour à la liste des formations
            </Link>
            
             <div className="flex items-start gap-8 mb-8">
                <div className="relative w-48 h-32 rounded-lg overflow-hidden shrink-0">
                    <Image src={course.image_url || '/images/placeholder.png'} alt={course.title} fill className="object-cover"/>
                </div>
                <div>
                    <p className="font-semibold text-[#af4d30]">{course.category}</p>
                    <h1 className="text-4xl font-bold">{course.title}</h1>
                    <p className="text-lg text-gray-500">{course.price}€</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm">
                    <h2 className="text-xl font-bold mb-4">Détails de la formation</h2>
                    <div className="space-y-4">
                        <div><strong className="font-semibold">Description :</strong><p className="text-gray-600">{course.description}</p></div>
                        <div><strong className="font-semibold">Ce que l'on apprend :</strong>
                            <ul className="list-disc list-inside text-gray-600">
                                {course.what_you_learn.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                        <div><strong className="font-semibold">Modules :</strong>
                            <ul className="list-decimal list-inside text-gray-600">
                                {course.modules.map((mod, i) => <li key={i}>{mod.title} ({mod.duration})</li>)}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <h2 className="text-xl font-bold mb-4">Clients Inscrits ({buyers.length})</h2>
                    <div className="space-y-3">
                        {buyers.length > 0 ? buyers.map(buyer => (
                            <div key={buyer.purchase_id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">{buyer.full_name}</p>
                                        <p className="text-sm text-gray-500">{buyer.email}</p>
                                    </div>
                                    {buyer.status === 'en attente' ? (
                                        <div className="flex gap-1">
                                            <button onClick={() => handleUpdatePurchaseStatus(buyer.purchase_id, 'refusé')} className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200" title="Refuser"><X size={14}/></button>
                                            <button onClick={() => handleUpdatePurchaseStatus(buyer.purchase_id, 'accepté')} className="p-1.5 bg-green-100 text-green-600 rounded-md hover:bg-green-200" title="Accepter"><Check size={14}/></button>
                                        </div>
                                    ) : buyer.status === 'accepté' ? (
                                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">Accepté</span>
                                    ) : ( // 'refusé'
                                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-700">Refusé</span>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-gray-500 text-center">Aucun client pour cette formation.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
