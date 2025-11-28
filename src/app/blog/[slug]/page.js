import Image from 'next/image';
import { Clock } from 'lucide-react';
import BlogCarousel from '@/app/components/BlogCarousel'; // On réutilise notre carrousel

// Fonction pour récupérer l'article spécifique
async function getPost(slug) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    try {
        const res = await fetch(`${baseUrl}/api/blog/${slug}`, { next: { revalidate: 3600 } });
        if (!res.ok) return null;
        return res.json();
    } catch { return null; }
}

// Fonction pour récupérer les autres articles pour la section "Continuez votre lecture"
async function getOtherPosts(currentSlug) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
     try {
        const res = await fetch(`${baseUrl}/api/blog`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const allPosts = await res.json();
        return allPosts.filter(p => p.slug !== currentSlug);
    } catch { return []; }
}


export default async function BlogPostPage({ params }) {
    const slug = params.slug; 
    const post = await getPost(slug);
    const otherPosts = await getOtherPosts(slug);

    if (!post) {
        return <div className="text-center py-24">Article non trouvé</div>;
    }

    const formattedDate = new Date(post.published_at).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <main>
            <section className="relative z-[2] h-[60vh] min-h-[400px] text-white">
                <Image src={post.image_url} alt={post.title} fill className="object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>

                <div className="relative h-full flex flex-col justify-end">
                    <div className="container mx-auto px-6 pb-12">
                        <p className="font-semibold text-[#FADDAA]">{post.category}</p>
                        <h1 className="text-4xl md:text-6xl font-bold my-3 max-w-4xl">{post.title}</h1>
                        <div className="flex items-center gap-4 text-sm text-gray-300">
                            <span>Par {post.author}</span>
                            <span>•</span>
                            <span>{formattedDate}</span>
                            <span className="flex items-center gap-1"><Clock size={14}/> {post.reading_time}</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-16 sm:py-24 bg-white">
                <div className="container mx-auto px-6 max-w-3xl">
                    {/* On utilise dangerouslySetInnerHTML pour afficher le contenu HTML de l'éditeur */}
                    <div
                        className="prose lg:prose-xl max-w-none"
                        dangerouslySetInnerHTML={{ __html: post.content_html }}
                    />
                </div>
            </section>
            
            <section className="py-24 bg-gray-50">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold mb-12">Continuez votre lecture</h2>
                    <BlogCarousel posts={otherPosts} />
                </div>
            </section>
        </main>
    );
}