import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Play, FileText, Mic, ArrowRight, Tag as TagIcon, Search } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { fetchData } from "../lib/supabase";
import { useSite } from "../context/SiteContext";

export function Blog() {
  const { isAdmin } = useSite();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      try {
        const data = await fetchData("blog_posts", "*, coaches(name, slug)", "&published=eq.true&order=published_at.desc");
        setPosts(data);
      } catch (err) {
        console.error("Error loading blog posts:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  const categories = useMemo(() => {
    const cats = ["Toutes", ...Array.from(new Set(posts.map(p => p.category)))];
    return cats.filter(Boolean);
  }, [posts]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach(p => {
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach((t: string) => tags.add(t));
      }
    });
    return Array.from(tags);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      const matchCategory = selectedCategory === "Toutes" || p.category === selectedCategory;
      const matchTag = !selectedTag || (p.tags && p.tags.includes(selectedTag));
      const matchSearch = !searchQuery || 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchTag && matchSearch;
    });
  }, [posts, selectedCategory, selectedTag, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#a020f0]"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#141414] text-white pt-32 pb-24 selection:bg-[var(--color-accent-purple)] selection:text-white min-h-screen">
      {/* Hero */}
      <section className="px-6 max-w-7xl mx-auto text-center mb-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(160,32,240,0.08)_0%,transparent_50%)] pointer-events-none blur-3xl"></div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10"
        >
          <Badge color="purple" className="mb-8 bg-white/5 border-white/10 text-white/80 shadow-[0_0_30px_rgba(160,32,240,0.2)]">
            BLOG & INTERVIEWS
          </Badge>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl mb-8 max-w-4xl mx-auto leading-[1.1] tracking-tighter drop-shadow-2xl w-full break-words">
            Actus, méthode &{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-magenta)]">
              interviews
            </span>
          </h1>

          {isAdmin && (
            <div className="mb-12">
              <Link
                to="/admin?tab=blog"
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-bold transition-all active:scale-95 shadow-lg shadow-purple-500/20"
              >
                <FileText size={20} /> Ajouter un article
              </Link>
            </div>
          )}

          <p className="font-body text-lg md:text-xl text-white/50 max-w-3xl mx-auto mb-12 leading-relaxed">
            Analyses, techniques, interviews coachs & combattants. Contenu
            actionnable, zéro remplissage.
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#a020f0] transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Rechercher un article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:border-[#a020f0]/50 focus:bg-white/10 transition-all"
            />
          </div>
        </motion.div>
      </section>

      {/* Filters */}
      <section className="px-6 max-w-7xl mx-auto mb-12 relative z-10">
        <div className="flex flex-col gap-8">
          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${
                  selectedCategory === cat 
                    ? "bg-[#a020f0] border-[#a020f0] text-white shadow-[0_0_20px_rgba(160,32,240,0.3)]" 
                    : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                  selectedTag === null ? "bg-white/20 text-white" : "bg-white/5 text-white/30 hover:text-white/60"
                }`}
              >
                Tous les tags
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                    selectedTag === tag ? "bg-[#a020f0]/20 text-[#a020f0] border border-[#a020f0]/30" : "bg-white/5 text-white/30 hover:text-white/60"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Grid */}
      <section className="px-6 max-w-7xl mx-auto">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-24 bg-white/5 border border-white/10 rounded-[2rem]">
            <p className="text-white/30 font-body text-lg">Aucun article ne correspond à votre recherche.</p>
            <button 
              onClick={() => { setSelectedCategory("Toutes"); setSelectedTag(null); setSearchQuery(""); }}
              className="mt-4 text-[#a020f0] hover:underline font-bold"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: (i % 3) * 0.1, ease: [0.23, 1, 0.32, 1] }}
                className="h-full"
              >
                <Link to={`/blog/${article.slug}`} className="h-full block">
                  <div className="h-full flex flex-col group bg-white/[0.04] border border-white/[0.05] hover:border-[#a020f0]/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] rounded-[2rem] overflow-hidden backdrop-blur-sm">
                    <div className="aspect-video bg-white/5 relative overflow-hidden">
                      {article.thumbnail_path ? (
                        <img
                          src={article.thumbnail_path}
                          alt={article.title}
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#12152A] to-[#0a0a1a] flex items-center justify-center">
                          <FileText className="w-10 h-10 text-white/20" />
                        </div>
                      )}
                      
                      <div className="absolute top-6 left-6 z-20">
                        <Badge
                          color="purple"
                          className="flex items-center gap-2 backdrop-blur-md bg-black/40 border-white/10"
                        >
                          {article.video_url ? <Play className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                          {article.category}
                        </Badge>
                      </div>
                      
                      {article.video_url && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-[#a020f0]/90 flex items-center justify-center shadow-[0_0_30px_rgba(160,32,240,0.5)] backdrop-blur-md transform scale-90 group-hover:scale-110 transition-transform duration-500 z-20">
                            <Play className="w-5 h-5 text-white ml-1" fill="currentColor" />
                          </div>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                    </div>
                    
                    <div className="p-8 flex flex-col flex-grow relative">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-ui text-[10px] font-bold tracking-widest uppercase text-white/40">
                          {new Date(article.published_at || article.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      
                      <h3 className="font-display text-2xl mb-4 transition-colors duration-300 line-clamp-2 text-white/90 group-hover:text-[#a020f0]">
                        {article.title}
                      </h3>
                      
                      <p className="font-body text-white/50 text-sm mb-6 flex-grow line-clamp-3 leading-relaxed">
                        {article.excerpt}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {article.tags?.slice(0, 3).map((tag: string, i: number) => (
                          <span key={i} className="bg-white/5 px-2 py-0.5 rounded text-[9px] uppercase font-bold text-white/30 group-hover:text-white/60 transition-colors">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                        <span className="font-ui font-bold text-xs text-[#a020f0] flex items-center gap-2">
                          {article.video_url ? "VOIR LA VIDÉO" : "LIRE L'ARTICLE"}
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="flex items-center gap-2">
                          {article.coaches?.photo_url && (
                            <div className="w-6 h-6 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                              <img src={article.coaches.photo_url} alt={article.coaches?.name || "Auteur"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                          <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">{article.coaches?.name || <span className="font-days-one tracking-normal">MMA IQ</span>}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
