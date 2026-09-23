import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowUpRight, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Seo } from "../components/Seo";
import { VideoPlayer } from "../components/VideoPlayer";
import { MediaUploader } from "../components/admin/MediaUploader";
import { Breadcrumb, Button, ButtonLink, cx } from "../v3/ui";
import { Dialog, useDialogTitleId } from "../v3/Dialog";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { createFormationCheckout, redeemAccessCode, getVideoUrl } from "../services/stripeService";
import { showToast } from "../utils/ui";
import { ACADEMY_CATEGORIES, DISCIPLINE_LABELS, LEVEL_LABELS, categoryOf, disciplineLabel, formatPrice, levelLabel } from "../data/academy";

// Figma « Fiche formation · Desktop · Vue complète » (2190:22056) et « Mobile » (2190:22137).
// États : « Lecteur · Aperçu visuel » (2107:6581 / 2107:6629) pour l’extrait,
// « Academy · Code de démonstration » (2107:6552 / 2107:6600) pour le code d’accès.
// La lecture des chapitres se fait sur /mes-formations/:slug (LectureFormation).

/** Titre de section : 36/40 Medium −1,08 px sur mobile, 48/54 SemiBold −1 px sur desktop. */
const SECTION_TITLE = "text-[36px] font-medium leading-10 tracking-[-1.08px] lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]";
/** Panneau des fenêtres V3 : papier sur mobile, fond clair dégradé sur desktop. */
const DIALOG_PANEL = "max-w-[640px] rounded-[16px] bg-v3-paper p-6 text-v3-navy lg:bg-v3-clair lg:p-10";
const DIALOG_TITLE = "text-[26px] font-semibold leading-8";
const FALLBACK_IMAGE = "/v3/photo-sparring-lab.webp";

// Un extrait déjà public peut être lu sans compte. Les URLs signées et les
// fichiers de chapitres restent réservés au parcours d'accès existant.
function getPublicTrailerUrl(value: unknown, chapters: any[]): string | null {
  if (typeof value !== 'string' || !value) return null;
  try {
    const trailer = new URL(value);
    if (trailer.protocol !== 'https:' || trailer.username || trailer.password) return null;
    const youtubeHosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'];
    const youtubeId = (url: URL) => {
      if (!youtubeHosts.includes(url.hostname)) return null;
      return url.hostname === 'youtu.be' ? url.pathname.split('/')[1] : url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
    };
    const mediaPath = (url: URL) => youtubeId(url)
      ? `youtube:${youtubeId(url)}`
      : `${url.origin}${decodeURIComponent(url.pathname).replace(/\/object\/(public|sign|authenticated)\//, '/object/')}`;
    if (chapters.some(chapter => {
      try { return mediaPath(new URL(chapter.video_url)) === mediaPath(trailer); }
      catch { return false; }
    })) return null;
    const isYouTube = Boolean(youtubeId(trailer));
    const isPublicStorage = trailer.pathname.startsWith('/storage/v1/object/public/');
    return isYouTube || isPublicStorage ? value : null;
  } catch {
    return null;
  }
}

/** long_description est stockée en JSON { content, bullets, access_code } (ou en texte brut). */
function parseLongDescription(value: unknown): { content: string; bullets: string[]; access_code?: string } {
  if (typeof value === 'string' && value.startsWith('{')) {
    try { return JSON.parse(value); }
    catch { return { content: value, bullets: [] }; }
  }
  if (typeof value === 'object' && value !== null) return value as any;
  return { content: typeof value === 'string' ? value : '', bullets: [] };
}

export function Course() {
  const { slug } = useParams();
  const { user, session, profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [formation, setFormation] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [hasPurchased, setHasPurchased] = useState(false);
  // Modale post-échec d'achat : 'unconfigured' si le serveur répond que
  // Stripe n'est pas configuré, 'error' pour tout autre échec réel.
  const [purchaseModal, setPurchaseModal] = useState<'unconfigured' | 'error' | null>(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);

  // URL de l'extrait résolue côté serveur (signée quand le bucket est privé)
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [trailerLoading, setTrailerLoading] = useState(false);

  // Admin Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [editChapters, setEditChapters] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // isAdmin (useAuth) couvre les rôles admin/super_admin ET l'admin reconnu
  // par email (fallback VITE_ADMIN_EMAIL sans ligne profiles).
  const canEdit = isAdmin || (!!user && formation?.coaches?.profile_id === user.id);
  const publicTrailerUrl = useMemo(() => !loading && !loadError ? getPublicTrailerUrl(formation?.trailer_url, chapters) : null, [formation?.trailer_url, chapters, loading, loadError]);

  // Chemins de redirection auth : /connexion?redirect=… et /inscription?redirect=…
  const coursePath = `/academy/${slug}`;
  const signupUrl = `/inscription?redirect=${encodeURIComponent(coursePath)}`;
  const signinUrl = `/connexion?redirect=${encodeURIComponent(coursePath)}`;

  const startEditing = () => {
    if (!formation) {
      console.error("No formation data found to edit!");
      return;
    }
    const longDesc = parseLongDescription(formation.long_description);
    setEditData({
      title: formation.title,
      description: formation.description,
      long_description: longDesc.content || "",
      bullets: longDesc.bullets || [],
      access_code: longDesc.access_code || "",
      trailer_url: formation.trailer_url || "",
      thumbnail_url: formation.thumbnail_url || "",
      price_cents: formation.price_cents,
      level: formation.level,
      discipline: formation.discipline,
      coach_bio: formation.coaches?.bio || "",
      coach_tagline: formation.coaches?.tagline || "",
      duration: formation.duration || ""
    });
    setEditChapters([...chapters]);
    setIsEditing(true);
  };

  useEffect(() => {
    if (formation && isEditing && !editData) {
      startEditing();
    }
  }, [formation, isEditing, editData]);

  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      // 1. Update Formation
      const formationPayload = {
        title: editData.title,
        description: editData.description,
        long_description: JSON.stringify({
          content: editData.long_description,
          bullets: editData.bullets,
          access_code: editData.access_code || ''
        }),
        price_cents: editData.price_cents,
        // La colonne réelle est trailer_url (trailer_video_url n'existe pas)
        trailer_url: editData.trailer_url,
        thumbnail_url: editData.thumbnail_url,
        level: editData.level,
        discipline: editData.discipline,
        duration: editData.duration
      };

      const { error: fError } = await supabase
        .from('formations')
        .update(formationPayload)
        .eq('id', formation.id);

      if (fError) {
        console.error("Formation update error:", fError);
        throw fError;
      }

      // Update Coach Bio/Tagline if edited
      if (formation.coaches) {
        const { error: cError } = await supabase
          .from('coaches')
          .update({
            bio: editData.coach_bio,
            tagline: editData.coach_tagline
          })
          .eq('id', formation.coaches.id);
        if (cError) {
          console.error("Coach update error:", cError);
          throw cError;
        }
      }

      // 2. Update Chapters
      // Delete existing
      await supabase.from('formation_chapters').delete().eq('formation_id', formation.id);

      // Insert new
      if (editChapters.length > 0) {
        const chaptersPayload = editChapters.map((ch, idx) => ({
          formation_id: formation.id,
          title: ch.title,
          description: ch.description || "",
          timestamp: ch.timestamp || "00:00-00:00",
          video_url: ch.video_url || "",
          sort_order: idx,
          chapter_number: idx + 1
        }));
        const { error: chError } = await supabase.from('formation_chapters').insert(chaptersPayload);
        if (chError) {
          console.error("Chapters insert error:", chError);
          throw chError;
        }
      }

      showToast("Modifications enregistrées !");

      // Update local state
      setFormation({
        ...formation,
        ...formationPayload,
        coaches: formation.coaches ? {
          ...formation.coaches,
          bio: editData.coach_bio,
          tagline: editData.coach_tagline
        } : null
      });
      setChapters(editChapters);
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error saving changes:", error);
      console.error("Error details:", error.details);
      console.error("Error hint:", error.hint);
      alert("Erreur lors de l'enregistrement: " + (error.message || JSON.stringify(error)));
    } finally {
      setSaving(false);
    }
  };

  const addChapter = () => {
    setEditChapters(prev => [...prev, {
      title: "Nouveau chapitre",
      timestamp: "00:00 - 04:00",
      description: ""
    }]);
  };

  const removeChapter = (idx: number) => {
    setEditChapters(prev => prev.filter((_, i) => i !== idx));
  };

  const updateChapter = (idx: number, field: string, value: any) => {
    setEditChapters(prev => {
      const newChapters = [...prev];
      newChapters[idx] = { ...newChapters[idx], [field]: value };
      return newChapters;
    });
  };

  // Vérifie l'achat côté serveur (RLS « own purchases » autorise cette lecture)
  const checkPurchase = async (formationId: string) => {
    if (!user) return false;
    const { data: pData } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("formation_id", formationId)
      .eq("status", "completed");
    return !!(pData && pData.length > 0);
  };

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      if (!slug) return;
      setLoading(true);
      setLoadError(false);
      setFormation(null);
      setChapters([]);
      setHasPurchased(false);
      try {
        // 1. Load formation + coach
        const { data: fData, error: fError } = await supabase
          .from("formations")
          .select("*, coaches(id, name, slug, photo_url, tagline, bio, profile_id)")
          .eq("slug", slug)
          .single();

        if (fError) throw fError;
        if (cancelled) return;
        // Brouillon (published=false) : invisible en accès direct pour le
        // public — seuls admins et coachs propriétaires peuvent le prévisualiser
        // (le serveur refuse de toute façon l'achat d'un brouillon).
        if (fData && fData.published === false && !isAdmin && !(!!user && fData.coaches?.profile_id === user.id)) {
          setFormation(null);
          return;
        }
        if (fData) {
          // 2. Load chapters
          const { data: chData, error: chError } = await supabase
            .from("formation_chapters")
            .select("*")
            .eq("formation_id", fData.id)
            .order("sort_order");

          if (chError) throw chError;
          if (cancelled) return;
          setFormation(fData);
          setChapters(chData || []);

          // 3. Check purchase if logged in (seule source de vérité : purchases)
          if (user) {
            const { data: pData } = await supabase
              .from("purchases")
              .select("id")
              .eq("user_id", user.id)
              .eq("formation_id", fData.id)
              .eq("status", "completed");
            if (cancelled) return;
            setHasPurchased(!!(pData && pData.length > 0));
          } else {
            setHasPurchased(false);
          }
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error("Error loading formation:", err);
        setLoadError(err?.code !== 'PGRST116');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [slug, user?.id, isAdmin, profile?.role, profile?.id, loadAttempt]);

  // Seul l'extrait déjà public est lisible sans compte. La résolution d'un
  // média privé reste authentifiée ; aucun repli vers une URL de chapitre.
  useEffect(() => {
    let cancelled = false;
    async function loadTrailer() {
      if (publicTrailerUrl) {
        setTrailerUrl(publicTrailerUrl);
        setTrailerLoading(false);
        return;
      }
      if (!formation?.trailer_url || !user || !session?.access_token) {
        setTrailerUrl(null);
        setTrailerLoading(false);
        return;
      }
      setTrailerLoading(true);
      try {
        const { url } = await getVideoUrl(formation.id, 'trailer', session.access_token);
        if (!cancelled) setTrailerUrl(url);
      } catch (err) {
        console.error("Erreur de chargement du teaser:", err);
        if (!cancelled) setTrailerUrl(null);
      } finally {
        if (!cancelled) setTrailerLoading(false);
      }
    }
    loadTrailer();
    return () => { cancelled = true; };
  }, [formation?.id, formation?.trailer_url, publicTrailerUrl, user?.id, session?.access_token]);

  if (loading) {
    return (
      <section className="v3-first-screen v3-gutter flex w-full items-center justify-center bg-v3-clair" role="status" aria-label="Chargement de la formation">
        <div className="size-10 animate-spin rounded-full border-2 border-v3-navy/10 border-t-v3-brand" />
      </section>
    );
  }

  if (!formation) {
    return (
      <>
        <Seo title="Formation introuvable — Academy | MMA IQ" canonicalPath={coursePath} />
        <section className="v3-first-screen v3-gutter flex w-full flex-col justify-center bg-v3-clair py-12 text-v3-navy">
          <div className="v3-container flex flex-col items-start gap-6">
            <Breadcrumb tone="light" items={[{ label: "ACADEMY", to: "/academy" }, { label: "FORMATION" }]} />
            <h1 className="v3-heading">{loadError ? "La formation n’a pas pu être chargée." : "Formation introuvable."}</h1>
            <p className="v3-body text-v3-ink-muted lg:max-w-[640px]">
              {loadError ? "Vérifie ta connexion puis réessaie dans un instant." : "Cette formation n’existe pas ou n’est pas encore ouverte au public."}
            </p>
            <div className="flex flex-wrap gap-4">
              {loadError && <Button onClick={() => setLoadAttempt(attempt => attempt + 1)}>Réessayer</Button>}
              <ButtonLink to="/academy" variant={loadError ? "outline-dark" : "primary"}>Retour à l’Academy</ButtonLink>
            </div>
          </div>
        </section>
      </>
    );
  }

  const coach = formation.coaches;
  const category = ACADEMY_CATEGORIES.find(item => item.id === categoryOf(formation.discipline)) ?? ACADEMY_CATEGORIES[0];
  const displayedPrice = formatPrice(formation.price_cents);
  const readerPath = `/mes-formations/${formation.slug || slug}`;
  const canRead = hasPurchased || canEdit;
  const eyebrow = [disciplineLabel(formation.discipline), levelLabel(formation.level)].filter(Boolean).join(" · ").toUpperCase();

  // Le code d'accès est validé exclusivement côté serveur : plus aucune
  // comparaison locale ni déblocage localStorage (zéro sécurité côté client).
  const handleCodeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCodeError(false);
    if (!enteredCode.trim()) return;

    if (!user || !session?.access_token) {
      navigate(signinUrl);
      return;
    }

    setRedeeming(true);
    try {
      const res = await redeemAccessCode(formation.id, enteredCode, session.access_token);
      if (res.ok) {
        showToast("Code valide ! Formation débloquée.");
        setEnteredCode('');
        setCodeOpen(false);
        // Recharge l'état d'achat (le serveur vient d'enregistrer l'accès)
        setHasPurchased(await checkPurchase(formation.id));
      } else {
        setCodeError(true);
      }
    } catch (err) {
      console.error("Erreur lors de la validation du code:", err);
      setCodeError(true);
    } finally {
      setRedeeming(false);
    }
  };

  const handlePurchase = async () => {
    if (purchasing) return;
    if (!user || !session?.access_token) {
      navigate(signupUrl);
      return;
    }

    setPurchasing(true);
    try {
      // Le prix est résolu côté serveur depuis la table formations
      await createFormationCheckout(formation.id, session.access_token);
    } catch (error: any) {
      // Le placeholder « bientôt disponible » est réservé au cas où le
      // serveur indique explicitement que Stripe n'est pas configuré.
      setPurchaseModal(error?.message === 'Stripe is not configured' ? 'unconfigured' : 'error');
    } finally {
      setPurchasing(false);
    }
  };

  // CTA principal : lecture si la formation est dans le compte, achat sinon
  const primaryCta = canRead ? (
    <ButtonLink to={readerPath}>Accéder à la formation</ButtonLink>
  ) : (
    <Button onClick={handlePurchase} disabled={purchasing} aria-busy={purchasing}>
      {purchasing && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
      {purchasing ? "Chargement…" : "Acheter la formation"}
    </Button>
  );

  return (
    <>
      <Seo
        title={`${formation.title} — Academy | MMA IQ`}
        description={formation.description || "Formation vidéo MMA IQ Academy : programme détaillé, achat à l’unité, accès dans ton compte."}
        canonicalPath={coursePath}
      />

      {isEditing && editData ? (
        <CourseEditor
          editData={editData}
          setEditData={setEditData}
          editChapters={editChapters}
          hasCoach={Boolean(formation.coaches)}
          saving={saving}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          onAddChapter={addChapter}
          onRemoveChapter={removeChapter}
          onUpdateChapter={updateChapter}
        />
      ) : (
        <>
          {/* 01 · Fiche et extrait */}
          <section className="v3-first-screen v3-gutter flex w-full flex-col justify-center bg-v3-clair py-6 text-v3-navy lg:py-[72px]">
            <div className="v3-container flex flex-col gap-4 lg:gap-10">
              {canEdit && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="v3-label text-v3-ink-muted">{formation.published === false ? "BROUILLON · " : ""}ÉDITION</span>
                  <Button compact variant="outline-dark" onClick={startEditing}>
                    <Pencil aria-hidden="true" className="size-4" /> Modifier la page
                  </Button>
                </div>
              )}
              <Breadcrumb
                tone="light"
                className="whitespace-pre"
                items={[{ label: "ACADEMY", to: "/academy" }, { label: category.title.toUpperCase(), to: `/academy?categorie=${category.id}` }]}
              />
              <div className="flex flex-col gap-6 lg:flex-row-reverse lg:items-start lg:gap-16">
                <div className="flex flex-col items-start gap-4 lg:min-w-[440px] lg:flex-[0_1_556px] lg:gap-6">
                  <p className="v3-label text-v3-ink-muted">
                    {eyebrow}
                    {coach?.slug && (
                      <>
                        {" · "}
                        <Link to={`/coaches/${coach.slug}`} className="underline-offset-4 hover:text-v3-navy hover:underline">
                          AVEC {coach.name.toUpperCase()}
                        </Link>
                      </>
                    )}
                  </p>
                  <h1 className="v3-heading">{formation.title}</h1>
                  {formation.description && (
                    <p className="text-[16px] leading-6 text-v3-ink-muted lg:max-w-[540px] lg:text-[18px] lg:leading-7">{formation.description}</p>
                  )}
                  <p className="v3-heading">{hasPurchased && !canEdit ? "Formation acquise" : displayedPrice}</p>
                  <p className="v3-label text-v3-ink-muted">{hasPurchased && !canEdit ? "Accès illimité dans ton compte" : "Achat unique · Accès dans ton compte"}</p>
                  {primaryCta}
                  <p className="v3-small text-v3-ink-muted lg:max-w-[540px]">
                    {canRead ? (
                      <>Retrouve aussi toutes tes formations dans <Link to="/mes-formations" className="underline underline-offset-4 hover:text-v3-navy">Mes formations</Link>.</>
                    ) : (
                      <>
                        Formation vendue à l’unité, séparément de l’abonnement à l’app.{" "}
                        <button type="button" onClick={() => { setCodeError(false); setCodeOpen(true); }} aria-haspopup="dialog" className="font-medium text-v3-navy underline underline-offset-4 hover:text-v3-brand">
                          J’ai un code d’accès
                        </button>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex w-full flex-col items-start gap-4 lg:w-auto lg:min-w-0 lg:flex-[0_1_660px]">
                  <div className="relative h-[176px] w-full overflow-hidden rounded-[16px] bg-v3-navy/5 md:h-[360px] lg:aspect-[660/490] lg:h-auto">
                    <img
                      src={formation.thumbnail_url || FALLBACK_IMAGE}
                      alt={`Aperçu de la formation « ${formation.title} »`}
                      fetchPriority="high"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 size-full object-cover"
                    />
                  </div>
                  {formation.trailer_url && (
                    <Button onClick={() => setPreviewOpen(true)} aria-haspopup="dialog">Voir l’aperçu</Button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 02 · Programme de la formation */}
          <section id="programme" className="v3-gutter w-full scroll-mt-[72px] bg-v3-fond py-12 text-white lg:scroll-mt-[104px] lg:py-[72px]">
            <div className="v3-container flex flex-col items-start gap-6 lg:gap-10">
              <p className="v3-label text-v3-lavender">LE PROGRAMME</p>
              <h2 className={SECTION_TITLE}>Ce que tu vas travailler.</h2>
              {chapters.length > 0 ? (
                <ol className="flex w-full flex-col gap-6 lg:gap-10">
                  {chapters.map((ch: any, idx: number) => {
                    const row = (
                      <>
                        <span className="v3-label shrink-0 text-v3-lavender">{String(idx + 1).padStart(2, "0")}</span>
                        <span className={cx("text-[26px] font-semibold leading-8 text-white lg:min-w-0 lg:flex-[0_1_480px]", canRead && "transition-colors group-hover:text-v3-lavender")}>{ch.title}</span>
                        <span className="v3-body text-v3-muted lg:min-w-0 lg:flex-[0_1_640px]">
                          {[ch.timestamp, ch.description].filter(Boolean).join(" · ")}
                        </span>
                      </>
                    );
                    return (
                      <li key={ch.id ?? idx} className="border-t border-v3-border pt-6 lg:pt-10">
                        {canRead ? (
                          <Link to={`${readerPath}?chapitre=${idx + 1}`} className="group flex flex-col items-start gap-8 lg:flex-row">
                            {row}
                            <ArrowUpRight aria-hidden="true" strokeWidth={2.2} className="hidden size-5 shrink-0 text-v3-lavender lg:ml-auto lg:block" />
                          </Link>
                        ) : (
                          <div className="flex flex-col items-start gap-8 lg:flex-row">{row}</div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="v3-body w-full border-t border-v3-border pt-6 text-v3-muted lg:pt-10">Le programme détaillé de cette formation sera publié prochainement.</p>
              )}
              <ButtonLink to="/academy" variant="light">Retour à l’Academy</ButtonLink>
            </div>
          </section>

          {/* 03 · Poursuivre */}
          <section className="v3-gutter w-full bg-v3-accent py-12 text-white lg:py-[72px]">
            <div className="v3-container flex flex-col items-start gap-6 lg:gap-10">
              <h2 className={SECTION_TITLE}>Le geste s’apprend.<br />Le progrès se construit.</h2>
              <p className="v3-body lg:max-w-[900px]">Retrouve ta formation dans ton compte, sur mobile, tablette et ordinateur.</p>
              {primaryCta}
            </div>
          </section>
        </>
      )}

      <PreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={formation.title}
        poster={formation.thumbnail_url || FALLBACK_IMAGE}
        url={publicTrailerUrl || (user ? trailerUrl : null)}
        loading={trailerLoading}
        signedIn={Boolean(user)}
        signinUrl={signinUrl}
      />

      <AccessCodeDialog
        open={codeOpen}
        onClose={() => setCodeOpen(false)}
        title={formation.title}
        signedIn={Boolean(user && session?.access_token)}
        signinUrl={signinUrl}
        signupUrl={signupUrl}
        code={enteredCode}
        onCodeChange={(value) => { setEnteredCode(value); setCodeError(false); }}
        error={codeError}
        redeeming={redeeming}
        onSubmit={handleCodeSubmit}
      />

      <PurchaseErrorDialog kind={purchaseModal} onClose={() => setPurchaseModal(null)} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Fenêtres                                                             */
/* ------------------------------------------------------------------ */

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <Button onClick={onClose}>
      <span>Fermer <span aria-hidden="true">×</span></span>
    </Button>
  );
}

/** « Lecteur · Aperçu visuel » : l’extrait gratuit de la formation. */
function PreviewDialog({ open, onClose, title, poster, url, loading, signedIn, signinUrl }: {
  open: boolean;
  onClose: () => void;
  title: string;
  poster: string;
  url: string | null;
  loading: boolean;
  signedIn: boolean;
  signinUrl: string;
}) {
  const titleId = useDialogTitleId("apercu-formation");
  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} panelClassName={DIALOG_PANEL}>
      <div className="flex flex-col items-start gap-6">
        <CloseButton onClose={onClose} />
        <p className="v3-label text-v3-ink-muted">EXTRAIT GRATUIT</p>
        <h2 id={titleId} className={DIALOG_TITLE}>{title}</h2>
        <div className="relative aspect-video w-full overflow-hidden rounded-[16px] bg-v3-navy">
          {loading ? (
            <div role="status" aria-label="Chargement de l’extrait" className="flex size-full items-center justify-center">
              <Loader2 aria-hidden="true" className="size-8 animate-spin text-v3-lavender" />
            </div>
          ) : url ? (
            <VideoPlayer url={url} poster={poster} className="size-full" />
          ) : (
            <>
              <img src={poster} alt="" referrerPolicy="no-referrer" className="absolute inset-0 size-full object-cover opacity-40" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-white">
                <p className="v3-label">
                  {signedIn ? "L’extrait n’a pas pu être chargé. Réessaie dans un instant." : "Connecte-toi pour regarder l’extrait de cette formation."}
                </p>
                {!signedIn && <ButtonLink to={signinUrl} variant="light" compact>Se connecter</ButtonLink>}
              </div>
            </>
          )}
        </div>
        <p className="v3-body text-v3-ink-muted">Un aperçu de la formation. Les chapitres complets sont accessibles dans ton compte après l’achat.</p>
        <Button onClick={onClose}>Retour à la formation</Button>
      </div>
    </Dialog>
  );
}

/** « Academy · Code de démonstration » : ajout d’une formation avec un code d’accès. */
function AccessCodeDialog({ open, onClose, title, signedIn, signinUrl, signupUrl, code, onCodeChange, error, redeeming, onSubmit }: {
  open: boolean;
  onClose: () => void;
  title: string;
  signedIn: boolean;
  signinUrl: string;
  signupUrl: string;
  code: string;
  onCodeChange: (value: string) => void;
  error: boolean;
  redeeming: boolean;
  onSubmit: (event: FormEvent) => void;
}) {
  const titleId = useDialogTitleId("code-acces");
  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} panelClassName={DIALOG_PANEL}>
      <div className="flex flex-col items-start gap-6">
        <CloseButton onClose={onClose} />
        <p className="v3-label text-v3-ink-muted">ACCÈS À UNE FORMATION</p>
        <h2 id={titleId} className="text-[26px] font-semibold leading-8 lg:text-[48px] lg:leading-[54px] lg:tracking-[-1px]">Ajouter une formation</h2>
        {signedIn ? (
          <form onSubmit={onSubmit} className="flex w-full flex-col items-start gap-6" noValidate>
            <p className="v3-body text-v3-ink-muted">Saisis le code d’accès que tu as reçu pour ajouter « {title} » à ton compte.</p>
            <div className="w-full">
              <label htmlFor="code-acces-formation" className="v3-field-label">Code d’accès</label>
              <input
                id="code-acces-formation"
                data-autofocus
                className="v3-input"
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                required
                aria-invalid={error}
                aria-describedby={error ? "code-acces-erreur" : undefined}
              />
              {error && <p id="code-acces-erreur" role="alert" className="v3-small mt-2 text-[#c0392b]">Code invalide. Vérifie-le et réessaie.</p>}
            </div>
            <Button type="submit" disabled={redeeming || !code.trim()} aria-busy={redeeming}>
              {redeeming && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
              {redeeming ? "Vérification…" : "Appliquer le code"}
            </Button>
          </form>
        ) : (
          <>
            <p className="v3-body text-v3-ink-muted">Connecte-toi ou crée ton compte pour ajouter « {title} » avec ton code d’accès.</p>
            <div className="flex flex-wrap gap-4">
              <ButtonLink to={signinUrl}>Se connecter</ButtonLink>
              <ButtonLink to={signupUrl} variant="outline-dark">Créer un compte</ButtonLink>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}

function PurchaseErrorDialog({ kind, onClose }: { kind: 'unconfigured' | 'error' | null; onClose: () => void }) {
  const titleId = useDialogTitleId("paiement-formation");
  return (
    <Dialog open={kind !== null} onClose={onClose} labelledBy={titleId} panelClassName={DIALOG_PANEL}>
      <div className="flex flex-col items-start gap-6">
        <p className="v3-label text-v3-ink-muted">PAIEMENT</p>
        <h2 id={titleId} className={DIALOG_TITLE}>
          {kind === 'unconfigured' ? "Paiement bientôt disponible" : "Paiement momentanément indisponible"}
        </h2>
        <p className="v3-body text-v3-ink-muted">
          {kind === 'unconfigured'
            ? "Nous finalisons notre système de paiement sécurisé. Reviens très bientôt pour débloquer tes formations MMA IQ."
            : "Réessaie dans un instant."}
        </p>
        <Button onClick={onClose}>Compris</Button>
      </div>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Édition admin / coach propriétaire                                   */
/* ------------------------------------------------------------------ */

function CourseEditor({ editData, setEditData, editChapters, hasCoach, saving, onSave, onCancel, onAddChapter, onRemoveChapter, onUpdateChapter }: {
  editData: any;
  setEditData: (updater: any) => void;
  editChapters: any[];
  hasCoach: boolean;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  onAddChapter: () => void;
  onRemoveChapter: (idx: number) => void;
  onUpdateChapter: (idx: number, field: string, value: any) => void;
}) {
  const set = (field: string, value: any) => setEditData((prev: any) => ({ ...prev, [field]: value }));
  const actions = (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" compact onClick={onCancel}><X aria-hidden="true" className="size-4" /> Annuler</Button>
      <Button compact onClick={onSave} disabled={saving} aria-busy={saving}>
        {saving ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}
        Enregistrer
      </Button>
    </div>
  );
  const field = (id: string, label: string, input: ReactNode) => (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="v3-label text-v3-muted">{label}</label>
      {input}
    </div>
  );

  return (
    <section className="v3-gutter w-full bg-v3-surface py-12 text-white lg:py-[72px]">
      <div className="v3-container flex flex-col gap-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <p className="v3-label text-v3-lavender">ÉDITION DE LA FORMATION</p>
            <h1 className="v3-heading">{editData.title || "Formation"}</h1>
          </div>
          {actions}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {field("edit-title", "Titre", <input id="edit-title" className="v3-input-dark" value={editData.title ?? ""} onChange={(e) => set("title", e.target.value)} />)}
          {field("edit-duration", "Durée (ex. 45m)", <input id="edit-duration" className="v3-input-dark" value={editData.duration ?? ""} onChange={(e) => set("duration", e.target.value)} />)}
          {field("edit-discipline", "Discipline", (
            <select id="edit-discipline" className="v3-input-dark" value={editData.discipline ?? ""} onChange={(e) => set("discipline", e.target.value)}>
              {Object.entries(DISCIPLINE_LABELS).map(([value, label]) => <option key={value} value={value} className="text-v3-navy">{label}</option>)}
            </select>
          ))}
          {field("edit-level", "Niveau", (
            <select id="edit-level" className="v3-input-dark" value={editData.level ?? ""} onChange={(e) => set("level", e.target.value)}>
              {Object.entries(LEVEL_LABELS).map(([value, label]) => <option key={value} value={value} className="text-v3-navy">{label}</option>)}
            </select>
          ))}
          {field("edit-price", "Prix (€)", (
            <input id="edit-price" type="number" min={0} step="0.01" className="v3-input-dark" value={editData.price_cents / 100} onChange={(e) => set("price_cents", Math.round(parseFloat(e.target.value) * 100))} />
          ))}
          {field("edit-code", "Code d’accès (validé côté serveur)", <input id="edit-code" className="v3-input-dark" value={editData.access_code ?? ""} onChange={(e) => set("access_code", e.target.value)} />)}
          <div className="lg:col-span-2">
            {field("edit-description", "Description courte", <textarea id="edit-description" rows={3} className="v3-input-dark" value={editData.description ?? ""} onChange={(e) => set("description", e.target.value)} />)}
          </div>
          <div className="lg:col-span-2">
            {field("edit-long", "Présentation du programme", <textarea id="edit-long" rows={4} className="v3-input-dark" value={editData.long_description ?? ""} onChange={(e) => set("long_description", e.target.value)} />)}
          </div>
          {hasCoach && field("edit-coach-tagline", "Tagline du coach", <input id="edit-coach-tagline" className="v3-input-dark" value={editData.coach_tagline ?? ""} onChange={(e) => set("coach_tagline", e.target.value)} />)}
          {hasCoach && field("edit-coach-bio", "Bio du coach", <textarea id="edit-coach-bio" rows={3} className="v3-input-dark" value={editData.coach_bio ?? ""} onChange={(e) => set("coach_bio", e.target.value)} />)}
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="v3-label mb-2 text-v3-muted">Ce que tu vas apprendre (points clés)</legend>
          {editData.bullets?.map((bullet: string, i: number) => (
            <div key={i} className="flex gap-2">
              <input
                aria-label={`Point clé ${i + 1}`}
                className="v3-input-dark"
                value={bullet}
                onChange={(e) => {
                  const newBullets = [...editData.bullets];
                  newBullets[i] = e.target.value;
                  set("bullets", newBullets);
                }}
              />
              <button type="button" aria-label={`Supprimer le point clé ${i + 1}`} onClick={() => set("bullets", editData.bullets.filter((_: any, idx: number) => idx !== i))} className="flex min-h-14 shrink-0 items-center rounded-[12px] border border-white/15 px-4 text-white hover:border-v3-lavender">
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </div>
          ))}
          <Button variant="outline" compact className="self-start" onClick={() => set("bullets", [...(editData.bullets || []), ""])}>
            <Plus aria-hidden="true" className="size-4" /> Ajouter un point
          </Button>
        </fieldset>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <p className="v3-label text-v3-muted">Miniature</p>
            <MediaUploader accept="image" bucket="admin-media" onUpload={(url) => set("thumbnail_url", url)} currentMedia={editData.thumbnail_url} />
          </div>
          <div className="flex flex-col gap-2">
            <p className="v3-label text-v3-muted">Extrait de la formation (public)</p>
            <MediaUploader accept="video" bucket="formations-videos" onUpload={(url) => set("trailer_url", url)} currentMedia={editData.trailer_url} />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[26px] font-semibold leading-8">Programme · {editChapters.length} chapitre{editChapters.length > 1 ? "s" : ""}</h2>
            <Button variant="outline" compact onClick={onAddChapter}><Plus aria-hidden="true" className="size-4" /> Ajouter un chapitre</Button>
          </div>
          {editChapters.map((ch: any, idx: number) => (
            <div key={idx} className="flex flex-col gap-4 rounded-[16px] border border-white/10 bg-white/5 p-5 lg:p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="v3-label text-v3-lavender">CHAPITRE {String(idx + 1).padStart(2, "0")}</p>
                <button type="button" aria-label={`Supprimer le chapitre ${idx + 1}`} onClick={() => onRemoveChapter(idx)} className="flex size-10 items-center justify-center rounded-full border border-white/15 text-white hover:border-v3-lavender">
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>
              </div>
              <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                {field(`chapter-title-${idx}`, "Titre du chapitre", <input id={`chapter-title-${idx}`} className="v3-input-dark" value={ch.title ?? ""} onChange={(e) => onUpdateChapter(idx, 'title', e.target.value)} />)}
                {field(`chapter-time-${idx}`, "Repère temporel", <input id={`chapter-time-${idx}`} className="v3-input-dark" placeholder="00:00-00:00" value={ch.timestamp || "00:00-00:00"} onChange={(e) => onUpdateChapter(idx, 'timestamp', e.target.value)} />)}
              </div>
              {field(`chapter-desc-${idx}`, "Description", <textarea id={`chapter-desc-${idx}`} rows={3} className="v3-input-dark" value={ch.description || ""} onChange={(e) => onUpdateChapter(idx, 'description', e.target.value)} />)}
              <div className="flex flex-col gap-2">
                <p className="v3-label text-v3-muted">Vidéo du chapitre</p>
                <MediaUploader accept="video" bucket="formations-videos" onUpload={(url) => onUpdateChapter(idx, 'video_url', url)} currentMedia={ch.video_url} />
              </div>
            </div>
          ))}
        </div>

        {actions}
      </div>
    </section>
  );
}
