import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, FileText, Play, Search } from "lucide-react";
import { fetchData } from "../lib/supabase";
import { useSite } from "../context/SiteContext";
import { Seo } from "../components/Seo";
import { ButtonLink, Eyebrow, Section, cx } from "../v3/ui";

// Hors maquette V3 : mise en forme alignée sur les pages de contenu (fond sombre + bande claire).
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

  const pill = (active: boolean) => cx(
    "inline-flex min-h-11 items-center rounded-[12px] border px-5 text-[14px] font-semibold leading-5 transition-colors",
    active ? "border-v3-brand bg-v3-brand text-white" : "border-white bg-white text-v3-navy hover:bg-v3-paper",
  );

  return (
    <>
      <Seo
        title="Blog & interviews — MMA IQ"
        description="Analyses, techniques, interviews de coachs et de combattants : les contenus MMA IQ pour progresser."
        canonicalPath="/blog"
      />

      <Section tone="fond" className="py-14 lg:py-20" innerClassName="flex flex-col gap-6">
        <Eyebrow>BLOG &amp; INTERVIEWS</Eyebrow>
        <h1 className="v3-heading-lg max-w-[720px] text-v3-paper">Actus, méthode <br />&amp; interviews.</h1>
        <p className="v3-body max-w-[600px] text-v3-muted">
          Analyses, techniques, interviews coachs &amp; combattants. Contenu actionnable, zéro remplissage.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <label className="relative block w-full max-w-[480px]">
            <span className="sr-only">Rechercher un article</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-v3-muted" aria-hidden="true" />
            <input
              type="search"
              placeholder="Rechercher un article"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="v3-input-dark pl-12"
            />
          </label>
          {isAdmin && <ButtonLink to="/admin?tab=blog" variant="outline">Ajouter un article</ButtonLink>}
        </div>
      </Section>

      <Section tone="clair" className="py-14 lg:py-20" innerClassName="flex flex-col gap-10">
        {categories.length > 1 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3" role="group" aria-label="Catégories">
              {categories.map(cat => (
                <button key={cat} type="button" onClick={() => setSelectedCategory(cat)} aria-pressed={selectedCategory === cat} className={pill(selectedCategory === cat)}>
                  {cat}
                </button>
              ))}
            </div>
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Mots-clés">
                <button type="button" onClick={() => setSelectedTag(null)} aria-pressed={selectedTag === null}
                  className={cx("v3-small rounded-full px-3 py-1 transition-colors", selectedTag === null ? "bg-v3-navy text-white" : "bg-white/70 text-v3-ink-muted hover:bg-white")}>
                  Tous les mots-clés
                </button>
                {allTags.map(tag => (
                  <button key={tag} type="button" onClick={() => setSelectedTag(tag)} aria-pressed={selectedTag === tag}
                    className={cx("v3-small rounded-full px-3 py-1 transition-colors", selectedTag === tag ? "bg-v3-navy text-white" : "bg-white/70 text-v3-ink-muted hover:bg-white")}>
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center" role="status" aria-label="Chargement des articles">
            <div className="size-10 animate-spin rounded-full border-2 border-v3-brand/20 border-t-v3-brand" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-[16px] bg-white p-8">
            <p className="v3-body text-v3-ink-muted">
              {posts.length === 0 ? "Les premiers articles arrivent bientôt." : "Aucun article ne correspond à ta recherche."}
            </p>
            {posts.length > 0 && (
              <button type="button" onClick={() => { setSelectedCategory("Toutes"); setSelectedTag(null); setSearchQuery(""); }} className="v3-label text-v3-brand underline-offset-4 hover:underline">
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((article) => (
              <li key={article.id}>
                <Link to={`/blog/${article.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[16px] bg-white transition-shadow hover:shadow-[0_20px_40px_-24px_rgba(44,36,66,0.45)]">
                  <div className="relative aspect-video overflow-hidden bg-v3-fond">
                    {article.thumbnail_path ? (
                      <img loading="lazy" src={article.thumbnail_path} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="flex size-full items-center justify-center"><FileText className="size-10 text-white/30" aria-hidden="true" /></div>
                    )}
                    {article.video_url && (
                      <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                        <span className="flex size-12 items-center justify-center rounded-full bg-v3-brand"><Play className="ml-0.5 size-5 text-white" fill="currentColor" /></span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <p className="v3-label text-v3-ink-muted">
                      {[article.category, new Date(article.published_at || article.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })].filter(Boolean).join(" · ")}
                    </p>
                    <h2 className="line-clamp-2 text-[22px] font-semibold leading-[28px] text-v3-navy">{article.title}</h2>
                    {article.excerpt && <p className="line-clamp-3 flex-1 text-[16px] leading-6 text-v3-ink-muted">{article.excerpt}</p>}
                    <span className="mt-2 inline-flex items-center gap-2 text-[14px] font-semibold text-v3-brand">
                      {article.video_url ? "Voir la vidéo" : "Lire l’article"}
                      <ArrowUpRight className="size-4" strokeWidth={2.2} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
