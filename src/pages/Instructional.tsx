import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Check, ImageIcon, Loader2, Pencil, Plus, Trash2, User } from "lucide-react";
import { Seo } from "../components/Seo";
import { WaitlistForm } from "../components/WaitlistForm";
import { FormationModal } from "../components/admin/FormationModal";
import { Button, ButtonLink, buttonClass, cx } from "../v3/ui";
import { Dialog, useDialogTitleId } from "../v3/Dialog";
import { useSite } from "../context/SiteContext";
import { useAuth } from "../context/AuthContext";
import { fetchData, updateData, deleteData, supabase } from "../lib/supabase";
import { customConfirm, showToast } from "../utils/ui";
import {
  ACADEMY_CATEGORIES,
  categoryOf,
  disciplineLabel,
  formatDuration,
  formatPrice,
  formationPath,
  levelLabel,
  type AcademyCategory,
  type AcademyCategoryId,
} from "../data/academy";

// Figma « Academy · Desktop · Vue complète » (2190:21834) et « Mobile » (2190:21948).
// États : fenêtres de catégorie (2093:12437 / 2093:12450, 2093:12463 / 2093:12476).

/** Titre de section : 36/40 Medium −1,08 px sur mobile, 48/54 SemiBold −1 px sur desktop. */
const SECTION_TITLE = "text-[36px] font-medium leading-10 tracking-[-1.08px] lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]";

const STEPS = [
  { title: "Un achat à l’unité", text: "Choisis la formation qui correspond à ton objectif. L’Academy est distincte de l’abonnement à l’app." },
  { title: "Un accès dans ton compte", text: "Retrouve tes formations sur mobile, tablette et ordinateur, et reviens sur les passages utiles." },
  { title: "Un apprentissage à ton rythme", text: "Observe la technique, travaille-la à la salle, puis reviens au chapitre dont tu as besoin." },
];

const QUESTIONS = [
  { q: "L’Academy est-elle incluse dans l’app ?", a: "Les formations Academy s’achètent à l’unité, séparément de l’abonnement MMA IQ." },
  { q: "Comment choisir mon niveau ?", a: "Chaque fiche précise la discipline, le niveau et les objectifs. Le programme te permet de vérifier si la formation correspond à ce que tu veux travailler." },
  { q: "Où retrouver mes formations ?", a: "Connecte-toi à ton compte pour retrouver ta bibliothèque et reprendre ton apprentissage." },
];

const isCategoryId = (value: string | null): value is AcademyCategoryId =>
  ACADEMY_CATEGORIES.some((category) => category.id === value);

export function Instructional() {
  const { isAdmin, openMediathequeForSelection } = useSite();
  const { session } = useAuth();
  // Jeton d'accès dérivé de la session Supabase (utilisé par les actions admin)
  const accessToken = session?.access_token;
  const [searchParams] = useSearchParams();

  const [courses, setCourses] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Catégorie ouverte : lien direct possible depuis une fiche (/academy?categorie=striking)
  const [openCategory, setOpenCategory] = useState<AcademyCategoryId | null>(() => {
    const requested = searchParams.get("categorie");
    return isCategoryId(requested) ? requested : null;
  });

  const [isFormationModalOpen, setIsFormationModalOpen] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState<any>(null);
  const [editingCoachId, setEditingCoachId] = useState<number | string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [f, c] = await Promise.all([
        fetchData("formations", "*", "&order=created_at.desc"),
        fetchData("coaches", "*", "&order=name.asc"),
      ]);
      setCourses(f || []);
      setCoaches(c || []);
    } catch (error) {
      console.error("Error loading instructional data:", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  // Brouillons (published=false) réservés aux admins : le serveur refuse
  // leur achat, on les exclut donc du catalogue public.
  const visibleCourses = useMemo(
    () => (isAdmin ? courses : courses.filter((course) => course.published !== false)),
    [courses, isAdmin],
  );

  const coursesByCategory = useMemo(() => {
    const groups: Record<AcademyCategoryId, any[]> = { striking: [], grappling: [], strategie: [] };
    visibleCourses.forEach((course) => groups[categoryOf(course.discipline)].push(course));
    return groups;
  }, [visibleCourses]);

  const coachById = useMemo(() => new Map(coaches.map((coach) => [String(coach.id), coach])), [coaches]);
  const featuredCourse = visibleCourses.find((course) => course.published !== false) ?? visibleCourses[0];
  const activeCategory = ACADEMY_CATEGORIES.find((category) => category.id === openCategory) ?? null;

  const handleAddCoach = async () => {
    const name = prompt("Nom du coach :");
    if (!name) return;
    const specialties = prompt("Spécialités (séparées par des virgules) :", "Striking, Grappling");
    const tagline = prompt("Tagline :", "Expert MMA");
    const bio = prompt("Biographie :", "Biographie du coach...");
    const photoUrl = prompt("URL de la photo :", "https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/images/default-coach.jpg");
    const videoUrl = prompt("URL de la vidéo de présentation :", "");

    const accessKey = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map((b) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[b % 36])
      .join("");

    try {
      const { error } = await supabase
        .from("coaches")
        .insert({
          name,
          slug: name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, ""),
          access_key: accessKey,
          specialties: specialties ? specialties.split(",").map((s) => s.trim()).filter(Boolean) : [],
          tagline,
          bio,
          photo_url: photoUrl,
          presentation_video_url: videoUrl,
          is_featured: false,
          sort_order: 0,
        })
        .select();

      if (error) {
        console.error("Supabase error adding coach:", error);
        alert(`Erreur Supabase (${error.code}): ${error.message}`);
      } else {
        showToast("Coach ajouté avec succès !");
        await loadData();
      }
    } catch (err: any) {
      console.error("Unexpected error adding coach:", err);
      alert(`Erreur inattendue: ${err.message}`);
    }
  };

  // Mise à jour immédiate de l'affichage, puis enregistrement du champ modifié
  const handleUpdateCoach = async (id: string | number, data: any) => {
    setCoaches((prev) => prev.map((coach) => (coach.id === id ? { ...coach, ...data } : coach)));
    try {
      await updateData("coaches", id, data, accessToken);
    } catch (error) {
      console.error("Error updating coach:", error);
      showToast("Modification du coach non enregistrée.", true);
      loadData();
    }
  };

  const handleDeleteCoach = async (id: string | number) => {
    if (!(await customConfirm("Supprimer ce coach ?"))) return;
    try {
      await deleteData("coaches", id, accessToken);
      loadData();
    } catch (error) {
      console.error("Error deleting coach:", error);
    }
  };

  const handleAddFormation = () => {
    setSelectedFormation(null);
    setIsFormationModalOpen(true);
  };

  const handleEditFormation = (formation: any) => {
    setOpenCategory(null);
    setSelectedFormation(formation);
    setIsFormationModalOpen(true);
  };

  return (
    <>
      <Seo
        title="Academy — Formations vidéo MMA | MMA IQ"
        description="Des formations vidéo pour approfondir ta technique en striking, grappling et stratégie MMA. Programme détaillé, achat à l’unité, séparé de l’abonnement à l’app."
        canonicalPath="/academy"
      />

      {/* 01 · Introduction */}
      <section className="v3-first-screen v3-gutter flex w-full flex-col bg-v3-fond py-6 text-white lg:justify-center lg:py-12">
        <div className="v3-container flex flex-1 flex-col justify-center gap-4 lg:flex-none lg:flex-row lg:items-center lg:gap-16">
          <div className="flex flex-col items-start gap-4 lg:min-w-[520px] lg:max-w-[672px] lg:flex-[1_1_672px] lg:gap-6">
            <p className="v3-label text-v3-lavender">MMA IQ ACADEMY</p>
            <h1 className="v3-display whitespace-nowrap text-[48px] leading-[52px] text-white lg:text-[96px] lg:leading-[94px]">Du savoir.<br />Au savoir-faire.</h1>
            <div className="flex flex-col items-start gap-4 lg:gap-6">
              <p className="text-[16px] leading-6 text-v3-muted lg:text-[18px] lg:leading-7">
                Des formations vidéo pour approfondir ta technique. Les formations Academy s’achètent séparément de l’abonnement à l’app.
              </p>
              <Link to="#disciplines" className={buttonClass("primary")}>Explorer les disciplines</Link>
            </div>
          </div>
          <div className="relative min-h-[120px] w-full flex-1 overflow-hidden rounded-[16px] lg:aspect-[544/363] lg:min-h-0 lg:w-auto lg:min-w-0 lg:flex-[0_1_544px]">
            <img
              src="/v3/academy-coach-fist-bump.webp"
              alt="Un coach et un athlète se saluent d’un check des poings à l’entraînement"
              width={960}
              height={640}
              fetchPriority="high"
              className="absolute inset-0 size-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 02 · Catalogue par discipline */}
      <CatalogueSection
        loading={loading}
        loadError={loadError}
        onRetry={loadData}
        onOpenCategory={setOpenCategory}
        admin={
          isAdmin ? (
            <AdminTools
              coaches={coaches}
              editingCoachId={editingCoachId}
              onToggleEditCoach={(id) => setEditingCoachId(editingCoachId === id ? null : id)}
              onAddFormation={handleAddFormation}
              onAddCoach={handleAddCoach}
              onUpdateCoach={handleUpdateCoach}
              onDeleteCoach={handleDeleteCoach}
              onPickPhoto={(id) => openMediathequeForSelection((url) => handleUpdateCoach(id, { photo_url: url }))}
            />
          ) : null
        }
      />

      {/* 03 · Comment fonctionne Academy */}
      <section className="v3-gutter w-full bg-v3-accent py-12 text-white lg:py-[72px]">
        <div className="v3-container flex flex-col items-start gap-6 lg:gap-10">
          <p className="v3-label text-white">L’ACADEMY, SIMPLEMENT</p>
          <h2 className={cx(SECTION_TITLE, "text-white")}>Le programme.<br />Les chapitres.<br />La pratique.</h2>
          <ul className="grid w-full gap-10 lg:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.title} className="flex flex-col gap-4">
                <h3 className="text-[26px] font-semibold leading-8">{step.title}</h3>
                <p className="v3-body">{step.text}</p>
              </li>
            ))}
          </ul>
          {featuredCourse ? (
            <ButtonLink to={`${formationPath(featuredCourse)}#programme`}>Voir le programme</ButtonLink>
          ) : (
            <Link to="#disciplines" className={buttonClass("primary")}>Explorer les disciplines</Link>
          )}
        </div>
      </section>

      {/* 04 · Questions Academy */}
      <section className="v3-gutter w-full bg-v3-clair py-12 text-v3-navy lg:py-[72px]">
        <div className="v3-container flex flex-col items-start gap-6 lg:gap-10">
          <h2 className={SECTION_TITLE}>Avant de commencer.</h2>
          <div className="flex w-full flex-col gap-6 lg:gap-10">
            {QUESTIONS.map((item) => (
              <div key={item.q} className="flex flex-col gap-6 border-t border-v3-border pt-6 lg:gap-10 lg:pt-10">
                <h3 className="text-[26px] font-semibold leading-8 lg:max-w-[1150px]">{item.q}</h3>
                <p className="v3-body text-v3-ink-muted lg:max-w-[1000px]">{item.a}</p>
              </div>
            ))}
          </div>
          <ButtonLink to="/mes-formations">Accéder à mes formations</ButtonLink>
        </div>
      </section>

      <CategoryDialog
        category={activeCategory}
        courses={activeCategory ? coursesByCategory[activeCategory.id] : []}
        coachById={coachById}
        loading={loading}
        loadError={loadError}
        isAdmin={isAdmin}
        onEdit={handleEditFormation}
        onClose={() => setOpenCategory(null)}
      />

      <FormationModal
        isOpen={isFormationModalOpen}
        onClose={() => setIsFormationModalOpen(false)}
        formation={selectedFormation}
        onSuccess={loadData}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 02 · Catalogue                                                       */
/* ------------------------------------------------------------------ */

function CatalogueSection({
  loading,
  loadError,
  onRetry,
  onOpenCategory,
  admin,
}: {
  loading: boolean;
  loadError: boolean;
  onRetry: () => void;
  onOpenCategory: (id: AcademyCategoryId) => void;
  admin: ReactNode;
}) {
  return (
    <section id="disciplines" className="v3-gutter w-full scroll-mt-[72px] bg-v3-clair py-10 text-v3-navy lg:scroll-mt-[104px] lg:py-12">
      <div className="v3-container flex flex-col items-start gap-6">
        <p className="v3-label text-v3-ink-muted">CHOISIS CE QUE TU VEUX TRAVAILLER</p>
        <h2 className={SECTION_TITLE}>Choisis la technique<br />que tu veux travailler.</h2>
        {loadError && (
          <div role="alert" className="flex w-full flex-col items-start gap-4 rounded-[16px] border border-v3-border bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="v3-body text-v3-ink-muted">Le catalogue n’a pas pu être chargé. Réessaie dans un instant.</p>
            <Button variant="outline-dark" compact onClick={onRetry} disabled={loading}>Réessayer</Button>
          </div>
        )}
        <ul className="flex w-full flex-col gap-6">
          {ACADEMY_CATEGORIES.map((category) => (
            <li key={category.id} className="flex flex-col items-start gap-6 border-t border-v3-border pt-6 lg:flex-row">
              <span className="v3-label shrink-0 text-v3-ink-muted">{category.number}</span>
              <div className="flex flex-col gap-4 lg:min-w-0 lg:flex-[0_1_800px]">
                <h3 className="text-[26px] font-semibold leading-8">{category.title}</h3>
                <p className="v3-body text-v3-ink-muted lg:max-w-[760px]">{category.text}</p>
              </div>
              <Button className="shrink-0" aria-haspopup="dialog" onClick={() => onOpenCategory(category.id)}>
                {category.cta}
              </Button>
            </li>
          ))}
        </ul>
        {admin}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Fenêtre de catégorie (liste des formations ou état vide)             */
/* ------------------------------------------------------------------ */

function CategoryDialog({
  category,
  courses,
  coachById,
  loading,
  loadError,
  isAdmin,
  onEdit,
  onClose,
}: {
  category: AcademyCategory | null;
  courses: any[];
  coachById: Map<string, any>;
  loading: boolean;
  loadError: boolean;
  isAdmin: boolean;
  onEdit: (formation: any) => void;
  onClose: () => void;
}) {
  const titleId = useDialogTitleId("academy-categorie");
  const count = courses.length;
  const countLabel = `${count} formation${count > 1 ? "s" : ""} disponible${count > 1 ? "s" : ""}`;
  const ready = !loading && !loadError;

  return (
    <Dialog open={Boolean(category)} onClose={onClose} labelledBy={titleId} panelClassName="max-w-[640px] rounded-[16px] bg-v3-paper p-6 text-v3-navy lg:bg-v3-clair lg:p-10">
      {category && (
        <div className="flex flex-col items-start gap-6">
          <Button onClick={onClose}>
            <span>Fermer <span aria-hidden="true">×</span></span>
          </Button>
          <p className="v3-label text-v3-ink-muted">ACADEMY / {category.title.toUpperCase()}</p>
          <h2 id={titleId} className="text-[26px] font-semibold leading-8 lg:text-[48px] lg:leading-[54px] lg:tracking-[-1px]">{category.title}</h2>
          <p className="v3-body text-v3-ink-muted">
            {category.summary}{" "}
            {loadError
              ? "Le catalogue n’a pas pu être chargé. Réessaie dans un instant."
              : ready && count === 0
                ? "Aucune formation n’est ouverte à l’achat dans cette catégorie pour le moment."
                : ready
                  ? "Choisis une formation pour découvrir son programme."
                  : null}
          </p>
          {loading ? (
            <p role="status" className="v3-label flex items-center gap-2 text-v3-ink-muted">
              <Loader2 aria-hidden="true" className="size-4 animate-spin" /> Chargement du catalogue…
            </p>
          ) : ready ? (
            <p className="v3-label text-v3-ink-muted">{countLabel}</p>
          ) : null}

          {ready && count > 0 && (
            <ul className="flex w-full flex-col">
              {courses.map((course) => (
                <FormationItem key={course.id} course={course} coach={coachById.get(String(course.coach_id))} isAdmin={isAdmin} onEdit={onEdit} />
              ))}
            </ul>
          )}

          {/* Catalogue vide : on propose d'être prévenu des premières formations */}
          {ready && count === 0 && <WaitlistForm interest="academy" tone="light" className="w-full" />}

          <Button onClick={onClose}>Retour aux disciplines</Button>
        </div>
      )}
    </Dialog>
  );
}

function FormationItem({ course, coach, isAdmin, onEdit }: { course: any; coach?: any; isAdmin: boolean; onEdit: (formation: any) => void }) {
  const eyebrow = [disciplineLabel(course.discipline), levelLabel(course.level)].filter(Boolean).join(" · ").toUpperCase();
  const meta = [formatPrice(course.price_cents), formatDuration(course.duration), coach?.name].filter(Boolean).join(" · ");
  return (
    <li className="flex items-start gap-4 border-t border-v3-border py-4">
      <Link to={formationPath(course)} className="group flex min-w-0 flex-1 items-start gap-4 rounded-[8px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-v3-brand">
        <span className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="v3-label text-v3-ink-muted">
            {eyebrow}
            {isAdmin && course.published === false && <span className="ml-2 rounded-full bg-v3-navy/10 px-2 py-0.5 text-[12px] leading-4">Brouillon</span>}
          </span>
          <span className="text-[22px] font-semibold leading-[26px] text-v3-navy group-hover:text-v3-brand">{course.title}</span>
          <span className="v3-small text-v3-ink-muted">{meta}</span>
        </span>
        <ArrowUpRight aria-hidden="true" strokeWidth={2.2} className="mt-7 size-5 shrink-0 text-v3-brand transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </Link>
      {isAdmin && (
        <button
          type="button"
          onClick={() => onEdit(course)}
          aria-label={`Modifier « ${course.title} »`}
          className="mt-5 flex size-11 shrink-0 items-center justify-center rounded-full border border-v3-border bg-white text-v3-navy hover:border-v3-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-v3-brand"
        >
          <Pencil aria-hidden="true" className="size-4" />
        </button>
      )}
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Outils admin (ajout de formation, gestion des coachs)                */
/* ------------------------------------------------------------------ */

function AdminTools({
  coaches,
  editingCoachId,
  onToggleEditCoach,
  onAddFormation,
  onAddCoach,
  onUpdateCoach,
  onDeleteCoach,
  onPickPhoto,
}: {
  coaches: any[];
  editingCoachId: number | string | null;
  onToggleEditCoach: (id: number | string) => void;
  onAddFormation: () => void;
  onAddCoach: () => void;
  onUpdateCoach: (id: number | string, data: any) => void;
  onDeleteCoach: (id: number | string) => void;
  onPickPhoto: (id: number | string) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-6 border-t border-v3-border pt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="v3-label text-v3-ink-muted">OUTILS ADMIN · FORMATIONS ET COACHS</p>
        <div className="flex flex-wrap gap-3">
          <Button compact onClick={onAddFormation}><Plus aria-hidden="true" className="size-4" /> Ajouter une formation</Button>
          <Button compact variant="outline-dark" onClick={onAddCoach}><Plus aria-hidden="true" className="size-4" /> Ajouter un coach</Button>
        </div>
      </div>
      <ul className="grid gap-4 md:grid-cols-2">
        {coaches.map((coach) => {
          const editing = editingCoachId === coach.id;
          return (
            <li key={coach.id} className="flex flex-col gap-4 rounded-[16px] border border-v3-border bg-white p-5">
              <div className="flex items-start gap-4">
                <div className="size-14 shrink-0 overflow-hidden rounded-full bg-v3-paper">
                  {coach.photo_url || coach.image ? (
                    <img loading="lazy" src={coach.photo_url || coach.image} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User aria-hidden="true" className="size-full p-3 text-v3-ink-muted" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="text-[18px] font-semibold leading-7">{coach.name}</p>
                  <p className="v3-small text-v3-ink-muted">{coach.specialties?.slice(0, 3).join(", ")}</p>
                  {coach.slug && (
                    <Link to={`/coaches/${coach.slug}`} className="v3-label inline-flex items-center gap-1 text-v3-brand underline-offset-4 hover:underline">
                      Voir son profil <ArrowUpRight aria-hidden="true" className="size-3.5" />
                    </Link>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" aria-label={editing ? "Terminer la modification" : `Modifier ${coach.name}`} aria-pressed={editing} onClick={() => onToggleEditCoach(coach.id)} className="flex size-10 items-center justify-center rounded-full border border-v3-border text-v3-navy hover:border-v3-brand">
                    {editing ? <Check aria-hidden="true" className="size-4" /> : <Pencil aria-hidden="true" className="size-4" />}
                  </button>
                  <button type="button" aria-label={`Supprimer ${coach.name}`} onClick={() => onDeleteCoach(coach.id)} className="flex size-10 items-center justify-center rounded-full border border-v3-border text-[#c0392b] hover:border-[#c0392b]">
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                </div>
              </div>
              {editing && (
                <div className="flex flex-col gap-3">
                  <label className="v3-field-label !mb-0" htmlFor={`coach-name-${coach.id}`}>Nom</label>
                  <input id={`coach-name-${coach.id}`} className="v3-input" value={coach.name ?? ""} onChange={(e) => onUpdateCoach(coach.id, { name: e.target.value })} />
                  <label className="v3-field-label !mb-0" htmlFor={`coach-specialties-${coach.id}`}>Spécialités (séparées par des virgules)</label>
                  <input id={`coach-specialties-${coach.id}`} className="v3-input" value={coach.specialties?.join(", ") || ""} onChange={(e) => onUpdateCoach(coach.id, { specialties: e.target.value.split(",").map((s: string) => s.trim()) })} />
                  <label className="v3-field-label !mb-0" htmlFor={`coach-bio-${coach.id}`}>Biographie</label>
                  <textarea id={`coach-bio-${coach.id}`} className="v3-input" value={coach.bio ?? ""} onChange={(e) => onUpdateCoach(coach.id, { bio: e.target.value })} />
                  <label className="v3-field-label !mb-0" htmlFor={`coach-photo-${coach.id}`}>URL de la photo</label>
                  <div className="flex gap-2">
                    <input id={`coach-photo-${coach.id}`} className="v3-input" value={coach.photo_url || ""} onChange={(e) => onUpdateCoach(coach.id, { photo_url: e.target.value })} />
                    <button type="button" aria-label="Choisir dans la médiathèque" onClick={() => onPickPhoto(coach.id)} className="flex min-h-14 shrink-0 items-center rounded-[12px] border border-v3-border bg-white px-4 text-v3-navy hover:border-v3-brand">
                      <ImageIcon aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
