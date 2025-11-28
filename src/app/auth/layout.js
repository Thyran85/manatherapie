export const metadata = {
  title: 'Manatherapy - Espace Client',
  description: 'Connectez-vous ou inscrivez-vous à votre espace client Manatherapie.',
};

export default function AuthLayout({ children }) {
  // Le layout retourne maintenant directement le contenu sans les balises <head> ou <> superflues
  return (
    <div className="bg-[#FFF7ED]">
        {children}
    </div>
  );
}