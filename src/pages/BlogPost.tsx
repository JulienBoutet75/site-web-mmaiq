import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { YouTubeEmbed } from "../components/YouTubeEmbed";
import { Seo } from "../components/Seo";
import { fetchData } from "../lib/supabase";
import { Breadcrumb, ButtonLink, Section } from "../v3/ui";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// Seuls les liens http(s), mailto et relatifs sont rendus cliquables.
const safeHref = (href: string) => (/^(https?:|mailto:|\/(?!\/)|#)/i.test(href) ? href : "#");

// Hors maquette V3 : article sur fond clair, en-tête sombre comme les pages de contenu.
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
        const posts = await fetchData("blog_posts", "*, coaches(name, slug, display_name)", `&slug=eq.${slug}&published=eq.true`) as any[];
        if (posts && posts.length > 0) {
          const currentPost = posts[0];
          setPost(currentPost);

          if (currentPost.formation_id) {
            const formations = await fetchData("formations", "*", `&id=eq.${currentPost.formation_id}`) as any[];
            if (formations && formations.length > 0) {
              setRelatedFormation(formations[0]);
            }
          }

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
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center bg-v3-fond" role="status" aria-label="Chargement de l’article">
        <div className="size-10 animate-spin rounded-full border-2 border-white/10 border-t-v3-brand" />
      </div>
    );
  }

  if (!post) {
    return (
      <Section tone="fond" className="v3-first-screen flex items-center py-20" innerClassName="flex flex-col items-start gap-6">
        <Seo title="Article introuvable — MMA IQ" />
        <h1 className="v3-heading text-v3-paper">Article introuvable</h1>
        <ButtonLink to="/blog" variant="outline"><ArrowLeft className="size-4" aria-hidden="true" /> Retour au blog</ButtonLink>
      </Section>
    );
  }

  // Rendu simple : paragraphes, titres ##/###, gras et liens (contenu échappé au préalable).
  const renderContent = (content: string) => {
    if (!content) return null;
    return content.split("\n").map((line, i) => {
      if (!line.trim()) return null;
      if (line.startsWith("## ")) {
        return <h2 key={i} className="mb-4 mt-10 text-[26px] font-semibold leading-8 text-v3-navy">{line.replace("## ", "")}</h2>;
      }
      if (line.startsWith("### ")) {
        return <h3 key={i} className="mb-3 mt-8 text-[22px] font-semibold leading-7 text-v3-navy">{line.replace("### ", "")}</h3>;
      }
      const html = escapeHtml(line)
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\[(.*?)\]\((.*?)\)/g, (_, label: string, href: string) => `<a href="${safeHref(href)}" class="text-v3-brand underline underline-offset-4">${label}</a>`);
      return <p key={i} className="v3-body mb-5 text-v3-ink-muted [&_strong]:font-semibold [&_strong]:text-v3-navy" dangerouslySetInnerHTML={{ __html: html }} />;
    });
  };

  const author = post.coaches?.display_name || post.coaches?.name || "L’équipe MMA IQ";
  const date = new Date(post.published_at || post.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <Seo title={`${post.title} — MMA IQ`} description={post.excerpt || undefined} canonicalPath={`/blog/${post.slug}`} />

      <Section tone="fond" className="py-14 lg:py-20" innerClassName="flex flex-col gap-6 [&>*]:max-w-[880px]">
        <Breadcrumb items={[{ label: "BLOG", to: "/blog" }, { label: String(post.category || "ARTICLE").toUpperCase() }]} />
        <h1 className="v3-heading-lg text-v3-paper">{post.title}</h1>
        <p className="v3-small text-v3-muted">{author} · {date}</p>
        {post.tags?.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {post.tags.map((tag: string) => <li key={tag} className="v3-small rounded-full bg-white/10 px-3 py-1 text-v3-paper">#{tag}</li>)}
          </ul>
        )}
      </Section>

      <Section tone="clair" className="py-14 lg:py-20" innerClassName="flex flex-col gap-12 [&>*]:max-w-[880px]">
        {post.video_url && <YouTubeEmbed url={post.video_url} className="overflow-hidden rounded-[16px]" />}

        <article>{renderContent(post.content)}</article>

        {post.youtube_embeds && post.youtube_embeds.length > 0 && (
          <section className="flex flex-col gap-6 border-t border-v3-border pt-10">
            <h2 className="v3-subheading text-v3-navy">Vidéos liées</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {post.youtube_embeds.map((url: string, i: number) => (
                <YouTubeEmbed key={i} url={url} className="overflow-hidden rounded-[16px]" />
              ))}
            </div>
          </section>
        )}

        {relatedFormation && (
          <section className="flex flex-col gap-6 overflow-hidden rounded-[16px] bg-v3-accent p-6 text-white md:flex-row md:items-center md:p-8">
            {relatedFormation.thumbnail_url && (
              <img loading="lazy" src={relatedFormation.thumbnail_url} alt="" referrerPolicy="no-referrer" className="aspect-video w-full rounded-[12px] object-cover md:w-[240px]" />
            )}
            <div className="flex flex-1 flex-col items-start gap-3">
              <p className="v3-label text-v3-lavender">FORMATION RECOMMANDÉE</p>
              <h2 className="v3-subheading">{relatedFormation.title}</h2>
              {relatedFormation.description && <p className="v3-small line-clamp-2 text-v3-muted">{relatedFormation.description}</p>}
              <ButtonLink to={`/academy/${relatedFormation.slug || relatedFormation.id}`} compact>Voir la formation</ButtonLink>
            </div>
          </section>
        )}

        {recommendedPosts.length > 0 && (
          <section className="flex flex-col gap-6 border-t border-v3-border pt-10">
            <h2 className="v3-subheading text-v3-navy">Articles recommandés</h2>
            <ul className="grid gap-6 md:grid-cols-3">
              {recommendedPosts.map((p) => (
                <li key={p.id}>
                  <Link to={`/blog/${p.slug}`} className="group flex flex-col gap-3">
                    <div className="aspect-video overflow-hidden rounded-[12px] bg-v3-fond">
                      {p.thumbnail_path && <img loading="lazy" src={p.thumbnail_path} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />}
                    </div>
                    <span className="flex items-start gap-2 text-[16px] font-semibold leading-6 text-v3-navy group-hover:text-v3-brand">
                      <span className="line-clamp-2">{p.title}</span>
                      <ArrowUpRight className="mt-1 size-4 shrink-0" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Section>
    </>
  );
}
