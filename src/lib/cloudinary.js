import { v2 as cloudinary } from 'cloudinary';

// On configure l'instance Cloudinary avec les variables d'environnement
// que nous avons définies dans .env.local
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true // Pour s'assurer que les URL sont en HTTPS
});

// On exporte l'instance configurée pour l'utiliser dans nos API Routes
export default cloudinary;