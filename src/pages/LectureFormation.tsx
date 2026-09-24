import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Seo } from "../components/Seo";
import { extractYoutubeId } from "../components/YouTubeEmbed";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { getVideoUrl } from "../services/stripeService";
import { countCompleted, markChapterCompleted, readCompletedChapters, syncCompletedChapters } from "../utils/formationProgress";
import { Button, ButtonLink } from "../v3/ui";
import { disciplineLabel, levelLabel } from "../data/academy";

// Figma « Lecture · Chapitre 1 / 2 / 3 » : desktop 2110:23344, 2114:21181, 2114:21321 ;
// mobile 2174:21646, 2174:23074, 2174:23141.
// Lecture d’une formation achetée : l’accès est vérifié dans `purchases`, les vidéos
// de chapitre sont résolues côté serveur (URL signée) et la progression est gardée
// dans le navigateur, synchronisée avec Supabase si la table existe (voir utils/formationProgress).

// Affiche du lecteur quand la formation n’a pas de miniature (photo de la maquette).
const FALLBACK_POSTER = "/v3/photo-sparring-lab.webp";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const pad = (n: number) => String(n).padStart(2, "0");

/** 75 s → « 01:15 » ; au-delà d’une heure → « 1:02:03 ». */
function formatTime(seconds: number) {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Repère de début d’un chapitre (« 15:00 - 30:00 » → « 15:00 »). */
const chapterStart = (timestamp: unknown) => (typeof timestamp === "string" ? timestamp.split("-")[0].trim() : "");

/** Titre « Jab-cross : la mécanique du striking » → retour à la ligne après les deux-points, comme la maquette. */
function FormationTitle({ title }: { title: string }) {
  const match = title.match(/^(.+?\s:)\s+(.+)$/);
  if (!match) return <>{title}</>;
  return <>{match[1]}<br />{match[2]}</>;
}

export function LectureFormation() {
  const { slug = "" } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, session, profile, isAdmin, loading: authLoading } = useAuth();

  const [formation, setFormation] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);

  // URL de lecture du chapitre, résolue côté serveur (signée quand le bucket est privé).
  const [chapterUrl, setChapterUrl] = useState<string | null>(null);
  const [chapterLoading, setChapterLoading] = useState(false);

  // Admins et coach propriétaire gardent l’accès de prévisualisation (comme l’ancienne fiche).
  const canEdit = isAdmin || (!!user && !!formation && formation.coaches?.profile_id === user.id);
  const hasAccess = hasPurchased || canEdit;

  // Chapitre demandé (?chapitre=n, 1 par défaut), borné au programme.
  const requested = Number.parseInt(searchParams.get("chapitre") || "1", 10);
  const chapterNumber = chapters.length ? Math.min(Math.max(Number.isFinite(requested) ? requested : 1, 1), chapters.length) : 0;
  const activeChapter = chapterNumber ? chapters[chapterNumber - 1] : null;

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      if (!slug || !user) return;
      setLoading(true);
      setLoadError(false);
      setFormation(null);
      setChapters([]);
      setHasPurchased(false);
      try {
        // 1. Formation + coach (le lien de « Mes formations » peut porter l’id si le slug manque)
        const { data: fData, error: fError } = await supabase
          .from("formations")
          .select("*, coaches(id, name, slug, photo_url, tagline, bio, profile_id)")
          .eq(UUID.test(slug) ? "id" : "slug", slug)
          .single();
        if (fError) throw fError;
        if (cancelled) return;
        // Brouillon (published=false) : invisible hors admins et coach propriétaire.
        if (fData && fData.published === false && !isAdmin && !(!!user && fData.coaches?.profile_id === user.id)) {
          setFormation(null);
          return;
        }
        if (fData) {
          // 2. Chapitres
          const { data: chData, error: chError } = await supabase
            .from("formation_chapters")
            .select("*")
            .eq("formation_id", fData.id)
            .order("sort_order");
          if (chError) throw chError;

          // 3. Achat (seule source de vérité : purchases)
          const { data: pData } = await supabase
            .from("purchases")
            .select("id")
            .eq("user_id", user.id)
            .eq("formation_id", fData.id)
            .eq("status", "completed");
          if (cancelled) return;
          setFormation(fData);
          setChapters(chData || []);
          setHasPurchased(!!(pData && pData.length > 0));
          setCompleted(readCompletedChapters(user.id, fData.id));
          // Progression enregistrée sur un autre appareil (si la table existe).
          syncCompletedChapters(user.id, [fData.id]).then((changed) => {
            if (changed && !cancelled) setCompleted(readCompletedChapters(user.id, fData.id));
          });
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error("Erreur de chargement de la formation:", err);
        setLoadError(err?.code !== "PGRST116");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, [slug, user?.id, isAdmin, profile?.role, profile?.id, loadAttempt]);

  // Vidéo du chapitre actif : URL signée récupérée à la demande (elles expirent, on ne les précharge pas).
  useEffect(() => {
    let cancelled = false;
    setChapterUrl(null);
    if (!formation?.id || !activeChapter?.id || !hasAccess || !session?.access_token) {
      setChapterLoading(false);
      return;
    }
    setChapterLoading(true);
    getVideoUrl(formation.id, activeChapter.id, session.access_token)
      .then(({ url }) => {
        if (!cancelled) setChapterUrl(url || null);
      })
      .catch((err) => {
        console.error("Erreur de chargement du chapitre:", err);
        if (!cancelled) setChapterUrl(null);
      })
      .finally(() => {
        if (!cancelled) setChapterLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [formation?.id, activeChapter?.id, hasAccess, session?.access_token]);

  // Connexion requise : retour sur ce chapitre après connexion.
  if (!authLoading && !user) {
    const back = `${location.pathname}${location.search}`;
    return <Navigate to={`/connexion?redirect=${encodeURIComponent(back)}`} replace />;
  }

  if (authLoading || loading) {
    return (
      <section className="v3-gutter bg-v3-clair py-12 lg:py-[72px]">
        <div className="v3-container">
          <div role="status" className="flex items-center gap-3 text-v3-ink-muted">
            <span aria-hidden="true" className="size-6 animate-spin rounded-full border-2 border-v3-border border-t-v3-brand" />
            <span className="v3-label">Chargement de ta formation…</span>
          </div>
        </div>
      </section>
    );
  }

  if (!formation) {
    return (
      <section className="v3-gutter bg-v3-clair py-12 lg:py-[72px]">
        <Seo title="Formation introuvable — MMA IQ Academy" canonicalPath={`/mes-formations/${slug}`} />
        <div className="v3-container flex flex-col items-start gap-6">
          <h1 className="text-[36px] font-medium leading-10 tracking-[-1.08px] text-v3-navy lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]">
            {loadError ? "La formation n’a pas pu être chargée." : "Formation introuvable."}
          </h1>
          <div className="flex flex-wrap gap-4">
            {loadError && <Button onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Réessayer</Button>}
            <ButtonLink to="/mes-formations" variant="light">Mes formations</ButtonLink>
          </div>
        </div>
      </section>
    );
  }

  // Formation non achetée : direction sa fiche Academy (achat ou code d’accès).
  if (!hasAccess) {
    return <Navigate to={`/academy/${formation.slug || slug}`} replace />;
  }

  const total = chapters.length;
  const done = countCompleted(completed, total);
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const isLast = chapterNumber === total;
  const category = [
    disciplineLabel(formation.discipline),
    levelLabel(formation.level?.toLowerCase()),
    `${total} chapitre${total > 1 ? "s" : ""}`,
  ].filter(Boolean).join(" · ").toUpperCase();
  const poster = formation.thumbnail_url || FALLBACK_POSTER;

  // « Marquer comme terminé et continuer » / « Terminer la formation »
  const completeChapter = () => {
    if (!user || !chapterNumber) return;
    setCompleted(markChapterCompleted(user.id, formation.id, chapterNumber));
    if (isLast) navigate("/mes-formations");
    else navigate(`?chapitre=${chapterNumber + 1}#lecteur`);
  };

  return (
    <>
      <Seo
        title={`${formation.title} — Mes formations`}
        description={`Chapitre ${chapterNumber || 1} de ta formation « ${formation.title} » sur MMA IQ Academy.`}
        canonicalPath={`/mes-formations/${formation.slug || slug}`}
      />

      {/* 01 · Formation en cours */}
      <section className="v3-gutter bg-v3-clair pb-6 pt-12 lg:pb-8 lg:pt-[72px]">
        <div className="v3-container flex flex-col items-start gap-6 lg:gap-10">
          <ButtonLink to="/mes-formations" variant="light">
            <ArrowLeft aria-hidden="true" strokeWidth={2.5} className="-mr-1 size-3.5 shrink-0" />
            Mes formations
          </ButtonLink>
          <p className="v3-label text-v3-ink-muted">{category}</p>
          <h1 className="text-[36px] font-medium leading-10 tracking-[-1.08px] text-v3-navy lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]">
            <FormationTitle title={formation.title} />
          </h1>
        </div>
      </section>

      {/* 02 · Espace de lecture */}
      <section className="v3-gutter bg-v3-clair pb-12 lg:pb-[72px]">
        <div className="v3-container flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          <div id="lecteur" className="flex min-w-0 flex-col items-start gap-6 scroll-mt-[72px] lg:flex-1 lg:scroll-mt-[104px]">
            {activeChapter ? (
              <>
                <ChapterPlayer
                  key={activeChapter.id}
                  url={chapterUrl}
                  loading={chapterLoading}
                  poster={poster}
                  label={`Vidéo du chapitre ${chapterNumber} : ${activeChapter.title}`}
                />
                <p className="v3-label text-v3-ink-muted">CHAPITRE {pad(chapterNumber)} / {pad(total)}</p>
                <h2 className="v3-subheading text-v3-navy">{activeChapter.title}</h2>
                {activeChapter.description && (
                  <p className="v3-body whitespace-pre-line text-v3-ink-muted lg:max-w-[840px]">{activeChapter.description}</p>
                )}
                <Button onClick={completeChapter} className="max-w-full whitespace-normal">
                  {isLast ? "Terminer la formation" : "Marquer comme terminé et continuer"}
                </Button>
              </>
            ) : (
              <p className="v3-body text-v3-ink-muted">Les chapitres de cette formation arrivent bientôt.</p>
            )}
          </div>

          {/* Programme de la formation */}
          <aside aria-labelledby="programme-title" className="flex flex-col gap-6 rounded-[16px] bg-white p-6 lg:w-[360px] lg:shrink-0 lg:p-8">
            <h2 id="programme-title" className="v3-subheading text-v3-navy">Programme</h2>
            <p className="v3-label text-v3-ink-muted">{done} sur {total} chapitre{total > 1 ? "s" : ""} terminé{total > 1 ? "s" : ""}</p>
            <div
              role="progressbar"
              aria-label="Progression de la formation"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="h-1 w-full bg-v3-muted"
            >
              <div className="h-full bg-v3-lavender" style={{ width: `${percent}%` }} />
            </div>
            <p className="v3-small text-v3-ink-muted">{formation.duration ? `${formation.duration} · ` : ""}Accès à ta formation</p>
            {total > 0 && (
              <ol className="flex flex-col gap-6">
                {chapters.map((chapter: any, index: number) => {
                  const number = index + 1;
                  const active = number === chapterNumber;
                  const status = completed.includes(number) ? "Terminé" : active ? "En cours" : "À suivre";
                  const start = chapterStart(chapter.timestamp);
                  return (
                    <li key={chapter.id}>
                      <Link
                        to={`?chapitre=${number}#lecteur`}
                        aria-current={active ? "step" : undefined}
                        className={`flex flex-col gap-2 rounded-[16px] p-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-v3-brand ${active ? "bg-v3-lavender" : "bg-v3-paper hover:bg-v3-lavender/40"}`}
                      >
                        <span className="whitespace-pre-wrap text-[18px] leading-7 text-v3-navy">{`${pad(number)}  ${chapter.title}`}</span>
                        <span className="v3-small text-v3-ink-muted">{start ? `${status} · ${start}` : status}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}

/**
 * Lecteur vidéo au style de la maquette : zone média 16:9 (affiche = miniature de la
 * formation), bandeau avec « Lire » et le temps écoulé. Les commandes natives
 * (avance, plein écran) apparaissent une fois la lecture lancée.
 */
function ChapterPlayer({ url, loading, poster, label }: { url: string | null; loading: boolean; poster: string; label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const youtubeId = url ? extractYoutubeId(url) : null;

  const toggle = () => {
    if (!url) return;
    if (youtubeId) {
      setStarted(true);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch((err) => console.error("Lecture impossible:", err));
    else video.pause();
  };

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-[16px] bg-v3-fond">
      <div className="relative aspect-video w-full overflow-hidden bg-v3-navy">
        {youtubeId && started ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&autoplay=1`}
            title={label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="no-referrer"
            className="absolute inset-0 size-full border-0"
          />
        ) : url && !youtubeId ? (
          <video
            ref={videoRef}
            src={url}
            poster={poster}
            preload="metadata"
            playsInline
            controls={started}
            aria-label={label}
            onPlay={() => {
              setStarted(true);
              setPlaying(true);
            }}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
            onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
            className={`absolute inset-0 size-full ${started ? "object-contain" : "object-cover"}`}
          />
        ) : (
          <img src={poster} alt="" width={1600} height={687} fetchPriority="high" className="absolute inset-0 size-full object-cover" />
        )}
        {loading && (
          <div role="status" className="absolute inset-0 flex items-center justify-center bg-v3-navy/40">
            <span aria-hidden="true" className="size-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <span className="sr-only">Chargement de la vidéo…</span>
          </div>
        )}
        {!loading && !url && (
          <div className="absolute inset-x-4 bottom-4 rounded-[12px] bg-v3-navy/80 px-4 py-3 text-center">
            <p className="v3-small text-v3-paper">Vidéo indisponible pour le moment. Réessaie dans un instant.</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 bg-v3-fond p-4">
        <Button onClick={toggle} disabled={!url || loading || (!!youtubeId && started)}>
          {playing ? "Pause" : "Lire"}
        </Button>
        {!youtubeId && (
          <p className="v3-label whitespace-nowrap text-v3-paper tabular-nums">
            {formatTime(current)}
            {duration > 0 && ` / ${formatTime(duration)}`}
          </p>
        )}
      </div>
    </div>
  );
}
