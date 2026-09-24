import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { Seo } from "../components/Seo";
import { useAuth } from "../context/AuthContext";
import { fetchData, insertData, updateData, deleteData, uploadFile } from "../lib/supabase";
import { VideoPlayer } from "../components/VideoPlayer";
import { MediaUploader } from "../components/admin/MediaUploader";
import { ArrowLink, Button, ButtonLink, Section, buttonClass } from "../v3/ui";
import { Dialog, useDialogTitleId } from "../v3/Dialog";

// Figma « Espace coach · Desktop · Vue complète » (2110:24102) et « Mobile » (2174:21999).
// Modales : « Coach · Modifier formation » (2093:12685), « Nouvelle formation » (2107:19930),
// « Modifier profil » (2107:19978). Les exemples Figma (« Jab-cross… ») servent au style :
// la page affiche les vraies formations et le vrai profil du coach connecté.

type Chapter = {
  id?: string;
  chapter_number: number;
  title: string;
  video_url?: string | null;
  is_preview?: boolean | null;
  sort_order?: number | null;
  [key: string]: unknown;
};

type Formation = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  price_cents?: number | null;
  level?: string | null;
  discipline?: string | null;
  category?: string | null;
  duration?: string | null;
  published?: boolean | null;
  thumbnail_url?: string | null;
  trailer_url?: string | null;
  formation_chapters?: Chapter[] | null;
};

type CoachRow = {
  id: string;
  slug: string;
  name: string;
  tagline?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  presentation_video_url?: string | null;
};

type FormationDialogState = { mode: "new" } | { mode: "edit"; formation: Formation } | null;

const DISCIPLINES = [
  { value: "striking", label: "Striking" },
  { value: "grappling", label: "Grappling" },
  { value: "mma-gameplan", label: "MMA Gameplan" },
  { value: "prepa-mentale", label: "Prépa mentale" },
  { value: "cut-nutrition", label: "Cut & nutrition" },
  { value: "conditioning", label: "Conditioning" },
];

const LEVELS = [
  { value: "debutant", label: "Débutant" },
  { value: "amateur", label: "Amateur" },
  { value: "pro", label: "Pro" },
];

const DEFAULT_THUMBNAIL = "https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/images/default-formation.jpg";

// Titres de section : 36/40 Medium sur mobile, 48/54 SemiBold sur desktop (styles Figma).
const HEADING = "text-[36px] font-medium leading-10 tracking-[-1.08px] lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]";
const ANCHOR = "scroll-mt-[72px] lg:scroll-mt-[104px]";
const SECTION_Y = "py-12 lg:py-[72px]";
const ERROR_TEXT = "text-[14px] leading-5 text-[#c0392b]";

const disciplineLabel = (value?: string | null) => DISCIPLINES.find((d) => d.value === value)?.label ?? value ?? "";
const levelLabel = (value?: string | null) => LEVELS.find((l) => l.value === value)?.label ?? value ?? "";

/** Slug d’URL à partir du titre (accents retirés, tirets). */
const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const saveErrorMessage = (err: unknown, fallback: string) => {
  const message = err instanceof Error ? err.message : "";
  if (/duplicate|unique/i.test(message)) return "Une formation utilise déjà cette adresse : modifie le titre ou le slug.";
  return message || fallback;
};

export function CoachDashboard() {
  const { user, accessToken, coachSession, loading: authLoading, signOut, isLoggedIn, isCoach, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [coach, setCoach] = useState<CoachRow | null>(null);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formationDialog, setFormationDialog] = useState<FormationDialogState>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const loggingOut = useRef(false);

  // Catégories existantes, proposées dans le formulaire de formation.
  useEffect(() => {
    fetchData("formations", "category")
      .then((data) => setCategories(Array.from(new Set(data.map((f: { category?: string | null }) => f.category).filter(Boolean))) as string[]))
      .catch((err) => console.error("Error loading categories:", err));
  }, []);

  // Garde d’accès : sans session → accès par clé ; compte sans rôle coach/admin → connexion.
  useEffect(() => {
    if (authLoading || loggingOut.current) return;
    if (!isLoggedIn) {
      navigate("/acces-coach", { replace: true });
    } else if (!isCoach && !isAdmin) {
      navigate("/connexion", { replace: true });
    } else {
      loadInitialData();
    }
  }, [authLoading, isLoggedIn, isCoach, isAdmin]);

  // `silent` : rafraîchit après une sauvegarde sans remplacer la page par le chargement.
  async function loadInitialData(silent = false) {
    if (!isLoggedIn) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      // 1. Profil coach : session par clé (localStorage) ou compte Supabase.
      let myCoach: CoachRow | null = null;
      if (coachSession) {
        const coachData = await fetchData("coaches", "*", `&id=eq.${coachSession.coachId}`, accessToken);
        if (coachData?.length > 0) myCoach = coachData[0];
      } else if (user) {
        const coachData = await fetchData("coaches", "*", `&profile_id=eq.${user.id}`, accessToken);
        if (coachData?.length > 0) myCoach = coachData[0];
      }

      if (myCoach) {
        setCoach(myCoach);
        // 2. Formations du coach et leurs chapitres.
        const formationsData = await fetchData("formations", "*,formation_chapters(*)", `&coach_id=eq.${myCoach.id}&order=created_at.desc`, accessToken);
        setFormations(formationsData);
      } else {
        setCoach(null);
        setError("Profil coach introuvable. Contacte l’équipe MMA IQ pour activer ton espace.");
      }
    } catch (err) {
      setError("Erreur lors du chargement de ton espace coach.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    // Coach par clé sans compte : retour à l’accès par clé ; compte Supabase : connexion.
    const destination = user ? "/connexion" : "/acces-coach";
    loggingOut.current = true;
    await signOut();
    navigate(destination);
  };

  const refresh = () => loadInitialData(true);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center bg-v3-fond" role="status" aria-label="Chargement de ton espace coach">
        <div className="size-10 animate-spin rounded-full border-2 border-white/10 border-t-v3-brand" />
      </div>
    );
  }

  return (
    <>
      <Seo
        title="Espace coach — MMA IQ"
        description="Prépare tes formations MMA IQ et garde ton profil coach à jour."
        canonicalPath="/coach/dashboard"
      />

      {/* En-tête · Espace coach */}
      <Section tone="fond" className={SECTION_Y} innerClassName="flex flex-col items-start gap-6 lg:gap-10">
        <p className="v3-label text-v3-lavender">ESPACE COACH</p>
        <h1 className={`${HEADING} text-white`}>Ton savoir-faire.<br />Tes formations.</h1>
        <p className="v3-body text-v3-muted lg:max-w-[800px]">Prépare tes contenus et garde ton profil à jour.</p>
        <nav aria-label="Espace coach" className="flex flex-col items-start gap-4 sm:flex-row">
          {coach && <Link to="#mes-formations" className={buttonClass()}>Mes formations</Link>}
          {coach && <Link to="#mon-profil" className={buttonClass()}>Mon profil</Link>}
          <Button onClick={handleLogout}>Déconnexion</Button>
        </nav>
      </Section>

      {!coach ? (
        // Profil coach absent ou erreur de chargement
        <Section tone="clair" className={SECTION_Y} innerClassName="flex flex-col items-start gap-6 lg:gap-10">
          <h2 className={`${HEADING} text-v3-navy`}>Espace indisponible</h2>
          <p role="alert" className="v3-body text-v3-ink-muted lg:max-w-[800px]">{error ?? "Profil coach introuvable."}</p>
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <Button onClick={() => loadInitialData()}>Réessayer</Button>
            <ButtonLink to="/contact" variant="light">Contacter l’équipe</ButtonLink>
          </div>
        </Section>
      ) : (
        <>
          {/* Mes formations · Coach */}
          <Section tone="clair" id="mes-formations" className={`${ANCHOR} ${SECTION_Y}`} innerClassName="flex flex-col items-start gap-6 lg:gap-10">
            <h2 className={`${HEADING} text-v3-navy`}>Mes formations</h2>
            {error && <p role="alert" className={ERROR_TEXT}>{error}</p>}

            {formations.length === 0 ? (
              <div className="flex w-full flex-col gap-4 rounded-[16px] bg-white p-6 lg:bg-v3-clair">
                <p className="v3-label text-v3-ink-muted">AUCUNE FORMATION</p>
                <h3 className="v3-subheading text-v3-navy">Ta première formation t’attend.</h3>
                <p className="v3-body text-v3-ink-muted">Crée un premier brouillon, puis ajoute tes chapitres vidéo.</p>
              </div>
            ) : (
              <ul className="flex w-full flex-col gap-4 lg:gap-6">
                {formations.map((formation) => {
                  const chapters = formation.formation_chapters?.length ?? 0;
                  const details = [disciplineLabel(formation.discipline), formation.level ? `Niveau ${levelLabel(formation.level).toLowerCase()}` : ""].filter(Boolean).join(" · ");
                  return (
                    <li key={formation.id} className="flex w-full flex-col items-start gap-6 rounded-[16px] bg-white p-6 lg:flex-row lg:bg-v3-clair">
                      <div className="flex w-full min-w-0 flex-col gap-4 lg:max-w-[888px] lg:flex-1">
                        <p className="v3-label text-v3-ink-muted">{formation.published ? "PUBLIÉE" : "BROUILLON"}</p>
                        <h3 className="v3-subheading break-words text-v3-navy">{formation.title}</h3>
                        <p className="v3-body text-v3-ink-muted">
                          {chapters} {chapters > 1 ? "chapitres" : "chapitre"}{formation.duration ? ` · ${formation.duration}` : ""}
                          {details && <><br />{details}</>}
                        </p>
                      </div>
                      <Button onClick={() => setFormationDialog({ mode: "edit", formation })} aria-haspopup="dialog">Modifier la formation</Button>
                    </li>
                  );
                })}
              </ul>
            )}

            <Button onClick={() => setFormationDialog({ mode: "new" })} aria-haspopup="dialog">Créer une formation</Button>
            <p className="v3-small text-v3-ink-muted">Tes brouillons restent privés jusqu’à leur publication.</p>
          </Section>

          {/* Mon profil · Coach */}
          <Section tone="surface" id="mon-profil" className={`${ANCHOR} ${SECTION_Y}`} innerClassName="flex flex-col items-start gap-6 lg:gap-10">
            <div className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <h2 className={`${HEADING} text-white`}>Mon profil</h2>
              {/* Mobile : le lien vers la page publique rejoint le titre pour ne pas allonger la section */}
              {coach.slug && <div className="sm:hidden"><ArrowLink to={`/coaches/${coach.slug}`}>Voir ma page coach</ArrowLink></div>}
            </div>
            <p className="v3-subheading break-words text-white">{coach.name}</p>
            {coach.tagline && <p className="v3-body text-v3-lavender">{coach.tagline}</p>}
            <p className="v3-body whitespace-pre-line text-v3-muted lg:max-w-[880px]">
              {coach.bio || "Ajoute une présentation pour que tes élèves découvrent ton parcours."}
            </p>
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <Button onClick={() => setProfileOpen(true)} aria-haspopup="dialog">Modifier mon profil</Button>
              {coach.slug && <div className="hidden sm:block"><ArrowLink to={`/coaches/${coach.slug}`}>Voir ma page coach</ArrowLink></div>}
            </div>
            {profileSaved && <p role="status" className="v3-small text-v3-lavender">Profil mis à jour.</p>}
          </Section>

          <FormationDialog
            state={formationDialog}
            coach={coach}
            categories={categories}
            onClose={() => setFormationDialog(null)}
            onSaved={() => { setFormationDialog(null); refresh(); }}
          />
          <ProfileDialog
            open={profileOpen}
            coach={coach}
            onClose={() => setProfileOpen(false)}
            onSaved={() => {
              setProfileOpen(false);
              setProfileSaved(true);
              window.setTimeout(() => setProfileSaved(false), 3000);
              refresh();
            }}
          />
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Modales                                                              */
/* ------------------------------------------------------------------ */

// Panneau : fond papier sur mobile, dégradé clair sur desktop (maquettes 2093:12708 / 2093:12685).
const PANEL = "max-w-[720px] rounded-[16px] bg-v3-paper p-6 text-v3-navy lg:bg-v3-clair";

function Field({ id, label, children, hint }: { id: string; label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="v3-field-label">{label}</label>
      {children}
      {hint && <p className="mt-2 text-[14px] leading-5 text-v3-ink-muted">{hint}</p>}
    </div>
  );
}

/** Zone d’import média (composant d’administration partagé) avec libellé V3. */
function MediaField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="w-full">
      <p className="v3-field-label">{label}</p>
      {children}
    </div>
  );
}

function FormationDialog({
  state,
  coach,
  categories,
  onClose,
  onSaved,
}: {
  state: FormationDialogState;
  coach: CoachRow;
  categories: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const titleId = useDialogTitleId("coach-formation");
  const key = state?.mode === "edit" ? state.formation.id : state?.mode ?? "closed";
  return (
    // Formulaires longs : fermeture uniquement par leurs boutons (pas d’Échap ni de clic sur le fond).
    <Dialog open={state !== null} onClose={onClose} labelledBy={titleId} panelClassName={PANEL} dismissible={false}>
      {state?.mode === "new" && <NewFormationForm key={key} titleId={titleId} coach={coach} onCancel={onClose} onSaved={onSaved} />}
      {state?.mode === "edit" && (
        <EditFormationForm key={key} titleId={titleId} coach={coach} formation={state.formation} categories={categories} onCancel={onClose} onSaved={onSaved} />
      )}
    </Dialog>
  );
}

/** « Nouvelle formation » : titre + discipline, enregistrée comme brouillon (le détail se complète ensuite). */
function NewFormationForm({ titleId, coach, onCancel, onSaved }: { titleId: string; coach: CoachRow; onCancel: () => void; onSaved: () => void }) {
  const { accessToken } = useAuth();
  const [title, setTitle] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await insertData("formations", {
        title: title.trim(),
        slug: slugify(title),
        description: "",
        price_cents: 0,
        level: "debutant",
        discipline,
        category: "Technique",
        published: false,
        thumbnail_url: DEFAULT_THUMBNAIL,
        trailer_url: "",
        coach_id: coach.id,
      }, accessToken);
      if (!res || res.length === 0) throw new Error("Erreur lors de la création de la formation (pas de réponse)");
      onSaved();
    } catch (err) {
      setError(saveErrorMessage(err, "Erreur lors de la création."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-start gap-6">
      <h2 id={titleId} className="v3-subheading">Nouvelle formation</h2>
      <p className="v3-body text-v3-ink-muted">Pose les premiers repères de ton prochain instructional.</p>
      <Field id="new-formation-title" label="Titre">
        <input id="new-formation-title" data-autofocus required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de ta formation" className="v3-input" />
      </Field>
      <Field id="new-formation-discipline" label="Discipline">
        <select id="new-formation-discipline" required value={discipline} onChange={(e) => setDiscipline(e.target.value)} className={`v3-input ${discipline ? "" : "text-v3-ink-muted"}`}>
          <option value="" disabled>Choisir une discipline</option>
          {DISCIPLINES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </Field>
      <p className="v3-small text-v3-ink-muted">La formation sera enregistrée comme brouillon.</p>
      {error && <p role="alert" className={ERROR_TEXT}>{error}</p>}
      <Button type="submit" disabled={saving}>{saving ? "Création…" : "Créer le brouillon"}</Button>
      <Button onClick={onCancel}>Annuler</Button>
    </form>
  );
}

/** « Modifier la formation » : toutes les informations, les médias et les chapitres vidéo. */
function EditFormationForm({
  titleId,
  coach,
  formation,
  categories,
  onCancel,
  onSaved,
}: {
  titleId: string;
  coach: CoachRow;
  formation: Formation;
  categories: string[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { profile, accessToken } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isSuperAdmin = profile?.role === "super_admin";

  const [formData, setFormData] = useState({
    title: formation.title || "",
    slug: formation.slug || "",
    description: formation.description || "",
    price_cents: formation.price_cents || 0,
    level: formation.level || "debutant",
    discipline: formation.discipline || "striking",
    category: formation.category || "Technique",
    published: formation.published || false,
    thumbnail_url: formation.thumbnail_url || DEFAULT_THUMBNAIL,
    // La colonne réelle est trailer_url (trailer_video_url n’existe pas)
    trailer_url: formation.trailer_url || "",
  });

  const [chapters, setChapters] = useState<Chapter[]>(
    [...(formation.formation_chapters ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  );

  const categoryOptions = categories.includes(formData.category) ? categories : [formData.category, ...categories];

  const updateChapter = (index: number, field: keyof Chapter, value: unknown) => {
    setChapters((current) => current.map((ch, i) => (i === index ? { ...ch, [field]: value } : ch)));
  };

  const addChapter = () => {
    const nextNum = chapters.length + 1;
    setChapters([...chapters, { chapter_number: nextNum, title: "", video_url: "", is_preview: false, sort_order: nextNum }]);
  };

  const removeChapter = (index: number) => setChapters(chapters.filter((_, i) => i !== index));

  const handleFileUpload = async (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingIndex(index);
    try {
      const url = await uploadFile("formations-videos", file, accessToken);
      updateChapter(index, "video_url", url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import de la vidéo impossible.");
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const formationId = formation.id;
      await updateData("formations", formationId, { ...formData, coach_id: coach.id }, accessToken);

      // Chapitres : suppression puis réinsertion (synchronisation simplifiée, comportement conservé).
      const existingChapters = await fetchData("formation_chapters", "id", `&formation_id=eq.${formationId}`, accessToken);
      for (const ch of existingChapters) {
        await deleteData("formation_chapters", ch.id, accessToken);
      }
      for (const ch of chapters) {
        await insertData("formation_chapters", { ...ch, formation_id: formationId }, accessToken);
      }
      onSaved();
    } catch (err) {
      setError(saveErrorMessage(err, "Erreur lors de la sauvegarde."));
    } finally {
      setSaving(false);
    }
  };

  const chapterCount = chapters.length;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-start gap-6">
      <h2 id={titleId} className="v3-subheading">Modifier la formation</h2>

      <Field id="edit-formation-title" label="Titre">
        <input
          id="edit-formation-title"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: slugify(e.target.value) })}
          className="v3-input"
        />
      </Field>
      <Field id="edit-formation-discipline" label="Discipline">
        <select id="edit-formation-discipline" value={formData.discipline} onChange={(e) => setFormData({ ...formData, discipline: e.target.value })} className="v3-input">
          {DISCIPLINES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </Field>

      {/* Chapitres vidéo */}
      <div className="flex w-full flex-col gap-4">
        <p className="v3-body text-v3-ink-muted">{chapterCount} {chapterCount > 1 ? "chapitres" : "chapitre"}</p>
        {chapterCount > 0 && (
          <ol className="flex flex-col gap-4">
            {chapters.map((ch, index) => {
              const number = String(index + 1).padStart(2, "0");
              return (
                <li key={ch.id ?? `new-${index}`} className="flex flex-col gap-4 rounded-[12px] border border-v3-border bg-white p-4">
                  {/* Mobile : numéro et suppression sur une ligne, titre pleine largeur en dessous */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span aria-hidden="true" className="v3-body w-7 shrink-0 text-v3-ink-muted">{number}</span>
                    <label htmlFor={`chapter-title-${index}`} className="sr-only">Titre du chapitre {index + 1}</label>
                    <input
                      id={`chapter-title-${index}`}
                      required
                      placeholder="Titre du chapitre"
                      value={ch.title}
                      onChange={(e) => updateChapter(index, "title", e.target.value)}
                      className="v3-input order-last sm:order-none sm:w-auto sm:min-w-0 sm:flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeChapter(index)}
                      aria-label={`Supprimer le chapitre ${index + 1}`}
                      className="ml-auto flex size-11 shrink-0 items-center justify-center rounded-[12px] sm:ml-0 text-v3-ink-muted transition-colors hover:bg-v3-paper hover:text-[#c0392b] focus-visible:outline-2 focus-visible:outline-v3-brand"
                    >
                      <Trash2 aria-hidden="true" strokeWidth={1.7} className="size-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <label className={`${buttonClass("outline-dark", { compact: true })} cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-v3-brand ${uploadingIndex === index ? "pointer-events-none opacity-60" : ""}`}>
                      {uploadingIndex === index ? "Import en cours…" : ch.video_url ? "Remplacer la vidéo" : "Importer une vidéo"}
                      <input type="file" accept="video/*" onChange={(e) => handleFileUpload(index, e)} disabled={uploadingIndex === index} className="sr-only" />
                    </label>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 v3-small text-v3-ink-muted">
                      <input type="checkbox" checked={Boolean(ch.is_preview)} onChange={(e) => updateChapter(index, "is_preview", e.target.checked)} className="size-5 accent-v3-brand" />
                      Chapitre gratuit (aperçu)
                    </label>
                  </div>
                  {ch.video_url && (
                    <div className="aspect-video w-full overflow-hidden rounded-[12px] bg-v3-navy sm:max-w-[360px]">
                      <VideoPlayer url={ch.video_url} className="size-full" />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
        <button type="button" onClick={addChapter} className="v3-label -my-3 inline-flex min-h-11 w-fit items-center text-v3-brand underline-offset-4 hover:underline">
          + Ajouter un chapitre
        </button>
      </div>

      <div className="grid w-full gap-6 sm:grid-cols-2">
        <Field id="edit-formation-level" label="Niveau">
          <select id="edit-formation-level" value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })} className="v3-input">
            {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </Field>
        <Field id="edit-formation-category" label="Catégorie">
          {categories.length > 0 ? (
            <select id="edit-formation-category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="v3-input">
              {categoryOptions.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          ) : (
            <input id="edit-formation-category" required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="v3-input" />
          )}
        </Field>
        <Field id="edit-formation-price" label="Prix (€)">
          <input
            id="edit-formation-price"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            required
            value={formData.price_cents / 100}
            onChange={(e) => setFormData({ ...formData, price_cents: Math.round(parseFloat(e.target.value) * 100) || 0 })}
            className="v3-input"
          />
        </Field>
        <Field id="edit-formation-slug" label="Adresse (slug)">
          <input id="edit-formation-slug" required value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="v3-input" />
        </Field>
      </div>

      <Field id="edit-formation-description" label="Description">
        <textarea id="edit-formation-description" required rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="v3-input" />
      </Field>

      <div className="grid w-full gap-6 sm:grid-cols-2">
        <MediaField label="Miniature">
          <MediaUploader label="" accept="image" bucket="admin-media" onUpload={(url) => setFormData((d) => ({ ...d, thumbnail_url: url }))} currentMedia={formData.thumbnail_url || undefined} uploadedBy="coach" />
        </MediaField>
        <MediaField label="Vidéo de présentation">
          <MediaUploader label="" accept="video" bucket="formations-videos" onUpload={(url) => setFormData((d) => ({ ...d, trailer_url: url }))} currentMedia={formData.trailer_url || undefined} uploadedBy="coach" />
        </MediaField>
      </div>

      {isSuperAdmin && (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 v3-label">
          <input type="checkbox" checked={formData.published} onChange={(e) => setFormData({ ...formData, published: e.target.checked })} className="size-5 accent-v3-brand" />
          Publier la formation
        </label>
      )}

      {error && <p role="alert" className={ERROR_TEXT}>{error}</p>}
      <Button type="submit" disabled={saving || uploadingIndex !== null}>
        {saving ? "Sauvegarde…" : formData.published ? "Enregistrer la formation" : "Enregistrer le brouillon"}
      </Button>
      <Button onClick={onCancel}>Annuler</Button>
    </form>
  );
}

/** « Modifier mon profil » : nom affiché, spécialité, présentation et médias du profil public. */
function ProfileDialog({ open, coach, onClose, onSaved }: { open: boolean; coach: CoachRow; onClose: () => void; onSaved: () => void }) {
  const titleId = useDialogTitleId("coach-profil");
  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} panelClassName={PANEL} dismissible={false}>
      {open && <ProfileForm titleId={titleId} coach={coach} onCancel={onClose} onSaved={onSaved} />}
    </Dialog>
  );
}

function ProfileForm({ titleId, coach, onCancel, onSaved }: { titleId: string; coach: CoachRow; onCancel: () => void; onSaved: () => void }) {
  const { accessToken } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: coach.name || "",
    tagline: coach.tagline || "",
    bio: coach.bio || "",
    photo_url: coach.photo_url || "",
    presentation_video_url: coach.presentation_video_url || "",
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateData("coaches", coach.id, formData, accessToken);
      onSaved();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-start gap-6">
      <h2 id={titleId} className="v3-subheading">Modifier mon profil</h2>
      <Field id="coach-profile-name" label="Nom affiché">
        <input id="coach-profile-name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="v3-input" />
      </Field>
      <Field id="coach-profile-tagline" label="Spécialité">
        <input id="coach-profile-tagline" required value={formData.tagline} onChange={(e) => setFormData({ ...formData, tagline: e.target.value })} placeholder="Ex. Striking · Technique & fondamentaux" className="v3-input" />
      </Field>
      <Field id="coach-profile-bio" label="Présentation">
        <textarea id="coach-profile-bio" required rows={5} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Ton parcours, ton palmarès et ta vision du combat." className="v3-input" />
      </Field>
      <div className="grid w-full gap-6 sm:grid-cols-2">
        <MediaField label="Photo de profil">
          <MediaUploader label="" accept="image" bucket="admin-media" onUpload={(url) => setFormData((d) => ({ ...d, photo_url: url }))} currentMedia={formData.photo_url || undefined} uploadedBy="coach" aspectRatio={1} />
        </MediaField>
        <MediaField label="Vidéo de présentation">
          <MediaUploader label="" accept="video" bucket="formations-videos" onUpload={(url) => setFormData((d) => ({ ...d, presentation_video_url: url }))} currentMedia={formData.presentation_video_url || undefined} uploadedBy="coach" />
        </MediaField>
      </div>
      {error && <p role="alert" className={ERROR_TEXT}>{error}</p>}
      <Button type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer mon profil"}</Button>
      <Button onClick={onCancel}>Annuler</Button>
    </form>
  );
}
