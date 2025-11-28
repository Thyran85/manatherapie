import { Loader } from 'lucide-react';

export default function LoadingSpinner() {
    return (
        // Ce conteneur centre le spinner verticalement et horizontalement
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
            <Loader className="h-12 w-12 animate-spin text-[#af4d30]" />
            <p className="mt-4 text-gray-500 font-semibold">Chargement des données...</p>
            <p className="text-sm text-gray-400">Veuillez patienter un instant.</p>
        </div>
    );
}