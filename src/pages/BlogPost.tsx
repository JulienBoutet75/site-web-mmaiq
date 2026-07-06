import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Calendar, User, Tag, GraduationCap, ArrowRight } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { YouTubeEmbed } from "../components/YouTubeEmbed";
import { fetchData } from "../lib/supabase";

export function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);
  const [relatedFormation, setRelatedFormation] = useState<any>(null);
  const [recommendedPosts, setRecommendedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      setLoading(true);
      try {
        // Fetch post with coach info
        const posts = await fetchData("blog_posts", "*, coaches(name, slug, display_name)", `&slug=eq.${slug}&published=eq.true`) as any[];
        if (posts && posts.length > 0) {
          const currentPost = posts[0];
          setPost(currentPost);

          // Fetch related formation if exists
          if (currentPost.formation_id) {
            const formations = await fetchData("formations", "*", `&id=eq.${currentPost.formation_id}`) as any[];
            if (formations && formations.length > 0) {
              setRelatedFormation(formations[0]);
            }
          }

          // Fetch recommended posts (same category, excluding current)
          const recommended = await fetchData("blog_posts", "*, coaches(name)", `&category=eq.${currentPost.category}&id=neq.${currentPost.id}&published=eq.true&limit=3`) as any[];
          setRecommendedPosts(recommended);
        }
      } catch (err) {
        console.error("Error loading blog post:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#04050A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7B2FFF]"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#04050A] text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-display mb-4">Article introuvable</h1>
        <Link to="/blog" className="text-[#7B2FFF] hover:underline flex items-center gap-2">
          <ArrowLeft size={18} /> Retour au blog
        </Link>
      </div>
    );
  }

  // Simple content renderer (handles paragraphs, bold, titles, links)
  const renderContent = (content: string) => {
    if (!content) return null;
    
    return content.split('\n').map((line, i) => {
      if (!line.trim()) return <br key={i} />;
      
      // Titles
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-2xl font-display mt-8 mb-4 text-white">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-xl font-display mt-6 mb-3 text-white">{line.replace('### ', '')}</h3>;
      }
      
      // Bold and links (very simple regex)
      let processedLine = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-[#7B2FFF] hover:underline">$1</a>');
      
      return (
        <p 
          key={i} 
          className="mb-4 text-white/70 leading-relaxed font-body"
          dangerouslySetInnerHTML={{ __html: processedLine }}
        />
      );
    });
  };

  return (
    <div className="bg-[#04050A] text-white min-h-screen pt-32 pb-24 selection:bg-[#7B2FFF]/30">
      <div className="max-w-4xl mx-auto px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#8892B0] uppercase tracking-widest mb-8 font-ui">
          <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-[#7B2FFF]">{post.category}</span>
          <span>/</span>
          <span className="text-white/40 truncate max-w-[200px]">{post.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display mb-6 leading-tight tracking-tighter">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-[#8892B0] font-ui">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#0C0E18] border border-white/10 flex items-center justify-center overflow-hidden">
                {post.coaches?.photo_url ? (
                  <img src={post.coaches.photo_url} alt={post.coaches.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={16} />
                )}
              </div>
              <span className="text-white font-medium">{post.coaches?.display_name || post.coaches?.name || <><span className="font-days-one tracking-normal">MMA IQ</span> Team</>}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>{new Date(post.published_at || post.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Tag size={16} />
              <div className="flex gap-2">
                {post.tags?.map((tag: string, i: number) => (
                  <span key={i} className="bg-white/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white/60">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Main Video */}
        {post.video_url && (
          <div className="mb-12">
            <YouTubeEmbed url={post.video_url} className="shadow-2xl shadow-[#7B2FFF]/10" />
          </div>
        )}

        {/* Content */}
        <article className="prose prose-invert max-w-none mb-16">
          {renderContent(post.content)}
        </article>

        {/* Additional Videos */}
        {post.youtube_embeds && post.youtube_embeds.length > 0 && (
          <section className="mb-16 pt-12 border-t border-white/10">
            <h2 className="text-2xl font-display mb-8">Vidéos liées</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {post.youtube_embeds.map((url: string, i: number) => (
                <YouTubeEmbed key={i} url={url} className="border border-white/10" />
              ))}
            </div>
          </section>
        )}

        {/* Related Formation */}
        {relatedFormation && (
          <section className="mb-16 p-8 bg-gradient-to-br from-[#0C0E18] to-[#04050A] border border-[#7B2FFF]/30 rounded-[2rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#7B2FFF]/5 blur-3xl rounded-full -mr-32 -mt-32"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-full md:w-1/3 aspect-video bg-black rounded-xl overflow-hidden border border-white/5">
                {relatedFormation.thumbnail_url ? (
                  <img
                    src={relatedFormation.thumbnail_url}
                    alt={relatedFormation.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#0C0E18] to-[#04050A]"></div>
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <Badge color="purple" className="mb-4">Formation recommandée</Badge>
                <h3 className="text-2xl font-display mb-2">{relatedFormation.title}</h3>
                <p className="text-white/50 text-sm mb-6 line-clamp-2">{relatedFormation.description}</p>
                <div className="flex items-center justify-center md:justify-start gap-6">
                  <span className="text-2xl font-display text-[#7B2FFF]">{relatedFormation.price_cents / 100}€</span>
                  <Link 
                    to={`/course/${relatedFormation.id}`}
                    className="bg-[#7B2FFF] hover:bg-[#8f4dff] text-white px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2"
                  >
                    Voir la formation <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Recommended Posts */}
        {recommendedPosts.length > 0 && (
          <section className="pt-12 border-t border-white/10">
            <h2 className="text-2xl font-display mb-8">Articles recommandés</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendedPosts.map((p) => (
                <Link key={p.id} to={`/blog/${p.slug}`} className="group">
                  <div className="aspect-video bg-[#0C0E18] rounded-xl overflow-hidden mb-4 border border-white/10 group-hover:border-[#7B2FFF]/30 transition-all">
                    {p.thumbnail_path ? (
                      <img
                        src={p.thumbnail_path}
                        alt={p.title}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#0C0E18] to-[#04050A]"></div>
                    )}
                  </div>
                  <h4 className="font-display text-sm group-hover:text-[#7B2FFF] transition-colors line-clamp-2">{p.title}</h4>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
