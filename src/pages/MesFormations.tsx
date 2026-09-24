import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Seo } from "../components/Seo";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { countCompleted, readCompletedChapters, syncCompletedChapters } from "../utils/formationProgress";
import { Dialog, useDialogTitleId } from "../v3/Dialog";
import { Button, ButtonLink } from "../v3/ui";
import { disciplineLabel, levelLabel } from "../data/academy";

// Figma « Mes formations » : bibliothèque vide (2110:23240 desktop, 2174:21597 mobile),
// bibliothèque active (2114:20985 / 2174:22982), terminée (2114:21083 / 2174:23028)
// et modale « V3 · Choix de chapitre » (2109:20097 / 2109:20129).

// Espace « Mes formations » : liste les formations débloquées sur le compte
// connecté (achats Stripe ou codes d’accès). Les visiteurs non connectés sont
// renvoyés vers /connexion avec un retour automatique ici après connexion.

// Visuel de repli quand la formation n’a pas de miniature (photo de la maquette).
const FALLBACK_VISUAL = "/v3/photo-sparring-lab.webp";

const NUMBER_WORDS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"];

type Chapter = { id: string; formation_id: string; title: string; sort_order: number | null };
type Coach = { id: string; name: string; slug: string | null; photo_url: string | null };

const pad = (n: number) => String(n).padStart(2, "0");

/** Chemin de lecture d’une formation (chapitre facultatif). */
const readingPath = (formation: any, chapter?: number) =>
  `/mes-formations/${formation.slug || formation.id}${chapter ? `?chapitre=${chapter}` : ""}`;

/** « Jab-cross : la mécanique du striking » → « Jab-cross » (sous-titre de la modale). */
const shortTitle = (title: string) => title.split(/\s:\s/)[0];

/** Sous-titre de la page selon le contenu de la bibliothèque. */
function libraryIntro(count: number, chapterCount: number, allDone: boolean) {
  if (allDone) return "Ton parcours est terminé. Retrouve tous les chapitres pour revoir les gestes à ton rythme.";
  if (count > 1) return "Retrouve les formations débloquées sur ton compte. Reprends ton apprentissage, quand tu veux.";
  if (chapterCount === 0) return "Retrouve ta formation.";
  if (chapterCount === 1) return "Retrouve le chapitre de ta formation.";
  return `Retrouve les ${NUMBER_WORDS[chapterCount] ?? chapterCount} chapitres de ta formation.`;
}

export function MesFormations() {
  const { user, loading: authLoading } = useAuth();

  const [formations, setFormations] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // Formation dont on choisit le chapitre (modale « Choisis ton chapitre. »).
  const [picking, setPicking] = useState<any | null>(null);
  // Incrémenté quand la progression synchronisée depuis le serveur change (relecture).
  const [, setProgressVersion] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(false);
      try {
        // 1) Achats complétés du compte (la RLS « own purchases » limite déjà
        // la lecture aux lignes de l’utilisateur, le filtre explicite est une ceinture).
        const { data: purchases, error: pErr } = await supabase
          .from("purchases")
          .select("formation_id, created_at")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .order("created_at", { ascending: false });
        if (pErr) throw new Error(pErr.message);

        const ids = [...new Set((purchases || []).map((p: any) => p.formation_id).filter(Boolean))];
        if (ids.length === 0) {
          if (!cancelled) {
            setFormations([]);
            setCoaches([]);
            setChapters([]);
          }
          return;
        }

        // 2) Formations correspondantes — requête séparée plutôt qu’une jointure
        // embed : la relation FK purchases→formations n’est pas garantie côté schéma.
        const { data: rows, error: fErr } = await supabase.from("formations").select("*").in("id", ids);
        if (fErr) throw new Error(fErr.message);

        // On préserve l’ordre d’achat (le plus récent en premier).
        const byId = new Map((rows || []).map((f: any) => [f.id, f]));
        const ordered = ids.map((id) => byId.get(id)).filter(Boolean);

        // 3) Programme de chaque formation (nombre de chapitres, progression, choix de chapitre).
        const { data: chData, error: chErr } = await supabase
          .from("formation_chapters")
          .select("id, formation_id, title, sort_order")
          .in("formation_id", ids)
          .order("sort_order");
        if (chErr) throw new Error(chErr.message);

        // Coachs pour l’affichage des cartes (facultatif : la carte reste valide sans).
        const coachIds = [...new Set(ordered.map((f: any) => f.coach_id).filter(Boolean))];
        let coachRows: Coach[] = [];
        if (coachIds.length > 0) {
          const { data: cData } = await supabase.from("coaches").select("id, name, slug, photo_url").in("id", coachIds);
          coachRows = cData || [];
        }

        if (!cancelled) {
          setFormations(ordered);
          setChapters(chData || []);
          setCoaches(coachRows);
        }
        // Progression enregistrée sur un autre appareil (si la table existe).
        syncCompletedChapters(user.id, ids).then((changed) => {
          if (changed && !cancelled) setProgressVersion((v) => v + 1);
        });
      } catch (err) {
        console.error("Erreur chargement de mes formations:", err);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Pas de compte connecté : direction la connexion, avec retour ici après.
  if (!authLoading && !user) {
    return <Navigate to="/connexion?redirect=/mes-formations" replace />;
  }

  const seo = (
    <Seo
      title="Mes formations — MMA IQ Academy"
      description="Retrouve les formations débloquées sur ton compte MMA IQ Academy et reprends ton apprentissage, quand tu veux."
      canonicalPath="/mes-formations"
    />
  );

  // Session ou bibliothèque en cours de chargement, ou erreur de lecture.
  if (authLoading || loading || loadError) {
    return (
      <>
        {seo}
        <LibraryHeader />
        <section className="v3-gutter bg-v3-clair py-12 lg:py-[72px]" aria-live="polite">
          <div className="v3-container">
            {loadError ? (
              <div className="flex flex-col items-start gap-4">
                <p className="text-[26px] font-semibold leading-8 text-v3-navy">Impossible de charger tes formations.</p>
                <p className="v3-body text-v3-ink-muted">Réessaie dans un instant. Si le problème persiste, <Link to="/contact" className="underline underline-offset-4">contacte-nous</Link>.</p>
              </div>
            ) : (
              <div role="status" className="flex items-center gap-3 text-v3-ink-muted">
                <span aria-hidden="true" className="size-6 animate-spin rounded-full border-2 border-v3-border border-t-v3-brand" />
                <span className="v3-label">Chargement de ta bibliothèque…</span>
              </div>
            )}
          </div>
        </section>
      </>
    );
  }

  // Bibliothèque vide
  if (formations.length === 0) {
    return (
      <>
        {seo}
        <LibraryHeader />
        <section className="v3-gutter bg-v3-clair py-12 lg:py-[72px]">
          <div className="v3-container flex flex-col gap-10 lg:flex-row lg:items-start">
            <div className="flex flex-col items-start gap-6 rounded-[16px] bg-white p-6 lg:flex-1 lg:bg-v3-clair lg:p-12">
              <p className="v3-label text-v3-ink-muted">TA BIBLIOTHÈQUE · 0 FORMATION</p>
              <h2 className="text-[36px] font-medium leading-10 tracking-[-1.08px] text-v3-navy lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]">
                Tout commence<br />par un premier cours.
              </h2>
              <p className="v3-body text-v3-ink-muted lg:max-w-[640px]">
                Tu n’as pas encore de formation sur ce compte. Explore l’Academy pour trouver le sujet que tu souhaites approfondir.
              </p>
              <ButtonLink to="/academy">Découvrir l’Academy</ButtonLink>
            </div>
            <div className="flex flex-col items-start gap-6 rounded-[16px] bg-v3-accent p-6 text-white lg:w-[420px] lg:shrink-0 lg:p-8">
              <h2 className="v3-subheading">Tu as reçu<br />un code d’accès ?</h2>
              <p className="v3-body">
                Ouvre la fiche de la formation concernée et saisis ton code pour débloquer ses chapitres. Elle apparaîtra ensuite ici.
              </p>
              <ButtonLink to="/academy">Utiliser mon code</ButtonLink>
              <p className="v3-small">
                Besoin d’aide ? <Link to="/contact" className="underline-offset-4 hover:underline">Notre équipe peut retrouver ton accès.</Link>
              </p>
            </div>
          </div>
        </section>
      </>
    );
  }

  // Bibliothèque active ou terminée : progression du navigateur, synchronisée si possible (voir utils/formationProgress).
  const cards = formations.map((formation: any) => {
    const programme = chapters.filter((c) => c.formation_id === formation.id);
    const total = programme.length;
    const completed = readCompletedChapters(user!.id, formation.id);
    const done = countCompleted(completed, total);
    const nextChapter = programme.findIndex((_, index) => !completed.includes(index + 1)) + 1;
    return { formation, programme, total, done, nextChapter, finished: total > 0 && done === total };
  });
  const allDone = cards.every((card) => card.finished);
  const intro = libraryIntro(cards.length, cards[0].total, allDone);

  return (
    <>
      {seo}
      <section className="v3-gutter bg-v3-clair py-8 lg:py-[72px]">
        <div className="v3-container flex flex-col items-start gap-4 lg:gap-10">
          <p className="v3-label text-v3-ink-muted">MMA IQ ACADEMY · MON COMPTE</p>
          <h1 className="text-[36px] font-medium leading-10 tracking-[-1.08px] text-v3-navy lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]">Mes formations</h1>
          <p className="v3-body text-v3-ink-muted lg:max-w-[1100px]">{intro}</p>

          <ul className="flex w-full flex-col gap-4 lg:gap-10">
            {cards.map(({ formation, programme, total, done, nextChapter, finished }) => {
              const coach = coaches.find((c) => c.id === formation.coach_id);
              const details = [
                disciplineLabel(formation.discipline),
                levelLabel(formation.level?.toLowerCase()),
                formation.duration,
              ].filter(Boolean);
              // Statut : on n’affiche « en cours » / « terminé » que si une progression existe.
              const status = finished
                ? `TERMINÉ · ${done} SUR ${total} CHAPITRES`
                : done > 0
                  ? `EN COURS · ${done} SUR ${total} CHAPITRES`
                  : `FORMATION · ${total} CHAPITRE${total > 1 ? "S" : ""}`;
              const percent = total > 0 ? Math.round((done / total) * 100) : 0;

              return (
                <li key={formation.id} className="flex flex-col gap-4 rounded-[16px] bg-white p-6 lg:flex-row-reverse lg:justify-end lg:gap-10 lg:bg-v3-clair lg:p-8">
                  <div className="flex min-w-0 flex-col items-start gap-4 lg:flex-1 lg:gap-6">
                    <p className="v3-label text-v3-ink-muted">{status}</p>
                    <h2 className="v3-subheading text-v3-navy">
                      <Link to={readingPath(formation)} className="underline-offset-4 hover:underline">{formation.title}</Link>
                    </h2>
                    {(details.length > 0 || coach) && (
                      <p className="v3-label text-v3-ink-muted">
                        {details.join(" · ")}
                        {coach && (
                          <>
                            {details.length > 0 && " · "}
                            {coach.slug ? <Link to={`/coaches/${coach.slug}`} className="underline-offset-4 hover:underline">{coach.name}</Link> : coach.name}
                          </>
                        )}
                      </p>
                    )}
                    <div
                      role="progressbar"
                      aria-label={`Progression : ${done} sur ${total} chapitres terminés`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percent}
                      className="h-1 w-full bg-v3-border lg:max-w-[700px]"
                    >
                      <div className="h-full bg-v3-lavender" style={{ width: `${percent}%` }} />
                    </div>
                    {total === 0 ? (
                      <ButtonLink to={readingPath(formation)}>Ouvrir la formation</ButtonLink>
                    ) : finished ? (
                      <Button onClick={() => setPicking(formation)} aria-haspopup="dialog">Revoir un chapitre</Button>
                    ) : done > 0 ? (
                      <ButtonLink to={readingPath(formation, nextChapter)}>Reprendre la formation</ButtonLink>
                    ) : (
                      <Button onClick={() => setPicking(formation)} aria-haspopup="dialog">Choisir un chapitre</Button>
                    )}
                  </div>
                  <div className="relative h-[220px] w-full shrink-0 overflow-hidden rounded-[16px] sm:h-[320px] lg:h-[270px] lg:w-[400px]">
                    <img
                      src={formation.thumbnail_url || FALLBACK_VISUAL}
                      alt=""
                      width={1600}
                      height={687}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 size-full object-cover"
                    />
                  </div>
                  {picking?.id === formation.id && (
                    <ChapterDialog formation={formation} chapters={programme} onClose={() => setPicking(null)} />
                  )}
                </li>
              );
            })}
          </ul>

          <ButtonLink to="/academy" variant="light">Explorer l’Academy</ButtonLink>
        </div>
      </section>
    </>
  );
}

/** En-tête sombre « Mes formations » (bibliothèque vide, chargement). */
function LibraryHeader() {
  return (
    <section className="v3-gutter bg-v3-fond py-12 lg:py-[72px]">
      <div className="v3-container flex flex-col items-start gap-6 lg:gap-10">
        <p className="v3-label text-v3-lavender">MMA IQ ACADEMY · MON COMPTE</p>
        <h1 className="text-[36px] font-medium leading-10 tracking-[-1.08px] text-v3-paper lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]">Mes formations</h1>
        <p className="v3-body text-v3-muted lg:max-w-[800px]">
          Retrouve les formations débloquées sur ton compte. Reprends ton apprentissage, quand tu veux.
        </p>
      </div>
    </section>
  );
}

/** Modale « Choisis ton chapitre. » : chaque chapitre ouvre la lecture au bon endroit. */
function ChapterDialog({ formation, chapters, onClose }: { formation: any; chapters: Chapter[]; onClose: () => void }) {
  const titleId = useDialogTitleId("chapitre-title");
  const navigate = useNavigate();
  return (
    <Dialog open onClose={onClose} labelledBy={titleId} panelClassName="max-w-[560px] rounded-[16px] bg-v3-surface p-6 text-white sm:p-10">
      <div className="flex flex-col items-start gap-6">
        <h2 id={titleId} className="text-[32px] font-semibold leading-[38px] sm:text-[40px] sm:leading-[46px]">Choisis ton chapitre.</h2>
        <p className="v3-body text-v3-muted">Formation · {shortTitle(formation.title)}</p>
        {chapters.map((chapter, index) => (
          <Button
            key={chapter.id}
            block
            data-autofocus={index === 0 ? true : undefined}
            className="whitespace-normal"
            onClick={() => {
              onClose();
              navigate(readingPath(formation, index + 1));
            }}
          >
            {pad(index + 1)} · {chapter.title}
          </Button>
        ))}
        <Button variant="outline" onClick={onClose}>Fermer</Button>
      </div>
    </Dialog>
  );
}
