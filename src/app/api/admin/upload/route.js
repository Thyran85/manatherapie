import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

/**
 * @description Gère l'upload d'un fichier vers Cloudinary (Sécurisé et Intelligent)
 * @method POST
 */
export async function POST(request) {
    

    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ message: "Aucun fichier fourni." }, { status: 400 });
        }

        const fileBuffer = await file.arrayBuffer();
        const mimeType = file.type;
        const encoding = 'base64';
        const base64Data = Buffer.from(fileBuffer).toString('base64');
        const fileUri = `data:${mimeType};${encoding},${base64Data}`;

        // --- LA MODIFICATION CLÉ EST ICI ---
        
        // 1. Déterminer le type de ressource pour Cloudinary
        let resource_type = 'auto'; // 'auto' est une bonne option générale
        if (mimeType.startsWith('image/')) {
            resource_type = 'image';
        } else if (mimeType.startsWith('video/')) {
            resource_type = 'video';
        } else if (mimeType === 'application/pdf') {
            resource_type = 'raw'; // Pour les PDFs, on utilise 'raw'
        }
        // 'auto' est une option sûre si le type n'est pas reconnu.
        
        // 2. Préparer les options pour l'upload
        const uploadOptions = {
            folder: 'manatherapy/formations',
            resource_type: resource_type,
             // Augmenter la limite de taille si nécessaire pour les vidéos (en bytes)
             // Par défaut, la limite est généreuse, mais on peut la spécifier.
             // max_file_size: 100000000, // Exemple pour 100MB
        };
        
        // 3. Envoyer le fichier à Cloudinary avec les options correctes
        const uploadResult = await cloudinary.uploader.upload(fileUri, uploadOptions);

        return NextResponse.json({
            message: "Fichier téléversé avec succès.",
            url: uploadResult.secure_url,
        }, { status: 200 });

    } catch (error) {
        console.error("Erreur API /admin/upload:", error);
        // On essaie de renvoyer le message d'erreur de Cloudinary s'il existe
        const errorMessage = error.message || error.error?.message || "Une erreur est survenue lors de l'upload.";
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}