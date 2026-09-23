import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowUpRight, Loader2, Pencil, Plus, Save, User, X } from "lucide-react";
import { Seo } from "../components/Seo";
import { MediaUploader } from "../components/admin/MediaUploader";
import { FormationModal } from "../components/admin/FormationModal";
import { Breadcrumb, Button, ButtonLink, buttonClass } from "../v3/ui";
import { useAuth } from "../context/AuthContext";
import { showToast } from "../utils/ui";
import { supabase } from "../lib/supabase";
import { disciplineLabel, formatDuration, formatPrice, formationPath, levelLabel } from "../data/academy";

// Profil coach (/coaches/:slug) : pas de maquette dédiée, même langage V3 que la fiche formation
// (bandeau clair de présentation, liste sombre des formations).

/** Titre de section : 36/40 Medium −1,08 px sur mobile, 48/54 SemiBold −1 px sur desktop. */
const SECTION_TITLE = "text-[36px] font-medium leading-10 tracking-[-1.08px] lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]";

export function Coach() {
  const { slug } = useParams();
  const { isAdmin, coachSession, profile } = useAuth();
  const [coachData, setCoachData] = useState<any>(null);
  const [coachCourses, setCoachCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [isFormationModalOpen, setIsFormationModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  const isOwnProfile = (coachSession?.coachId === coachData?.id) || (profile?.role === 'coach' && profile?.id === coachData?.profile_id);
  const canEdit = isAdmin || isOwnProfile;

  const startEditing = () => {
    if (!coachData) return;
    setEditData({
      name: coachData.name,
      tagline: coachData.tagline,
      bio: coachData.bio,
      specialties: coachData.specialties || [],
      photo_url: coachData.photo_url,
      presentation_video_url: coachData.presentation_video_url,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('coaches')
        .update({
          name: editData.name,
          tagline: editData.tagline,
          bio: editData.bio,
          specialties: editData.specialties,
          photo_url: editData.photo_url,
          presentation_video_url: editData.presentation_video_url,
        })
        .eq('id', coachData.id);

      if (error) throw error;

      showToast("Modifications enregistrées !");
      setIsEditing(false);
      loadCoachData(); // Reload data
    } catch (error: any) {
      console.error("Error saving coach:", error);
      alert("Erreur lors de l'enregistrement: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadCoachData();
  }, [slug]);

  const loadCoachData = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const { data: coach, error: coachError } = await supabase
        .from("coaches")
        .select("*")
        .eq("slug", slug)
        .single();

      if (coachError) throw coachError;
      if (coach) {
        setCoachData(coach);

        const { data: courses, error: coursesError } = await supabase
          .from("formations")
          .select("*")
          .eq("coach_id", coach.id)
          .eq("published", true)
          .order("created_at", { ascending: false });

        if (coursesError) throw coursesError;
        setCoachCourses(courses || []);
      }
    } catch (error) {
      console.error("Error loading coach data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="v3-first-screen v3-gutter flex w-full items-center justify-center bg-v3-clair" role="status" aria-label="Chargement du profil">
        <div className="size-10 animate-spin rounded-full border-2 border-v3-navy/10 border-t-v3-brand" />
      </section>
    );
  }

  if (!coachData) {
    return (
      <>
        <Seo title="Coach introuvable — Academy | MMA IQ" canonicalPath={`/coaches/${slug}`} />
        <section className="v3-first-screen v3-gutter flex w-full flex-col justify-center bg-v3-clair py-12 text-v3-navy">
          <div className="v3-container flex flex-col items-start gap-6">
            <Breadcrumb tone="light" items={[{ label: "ACADEMY", to: "/academy" }, { label: "COACH" }]} />
            <h1 className="v3-heading">Coach introuvable.</h1>
            <p className="v3-body text-v3-ink-muted lg:max-w-[640px]">Ce profil n’existe pas ou n’est plus en ligne.</p>
            <ButtonLink to="/academy">Retour à l’Academy</ButtonLink>
          </div>
        </section>
      </>
    );
  }

  const editing = isEditing && editData;
  const photo = editing ? editData.photo_url : coachData.photo_url;

  return (
    <>
      <Seo
        title={`${coachData.name} — Coach Academy | MMA IQ`}
        description={coachData.tagline ? `${coachData.name}, ${coachData.tagline}. Ses formations vidéo sur MMA IQ Academy.` : `${coachData.name} : ses formations vidéo sur MMA IQ Academy.`}
        canonicalPath={`/coaches/${coachData.slug || slug}`}
      />

      {/* Présentation du coach */}
      <section className="v3-gutter w-full bg-v3-clair py-12 text-v3-navy lg:py-[72px]">
        <div className="v3-container flex flex-col gap-6 lg:gap-10">
          {canEdit && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="v3-label text-v3-ink-muted">ÉDITION</span>
              {isEditing ? (
                <>
                  <Button compact variant="outline-dark" onClick={() => setIsEditing(false)}><X aria-hidden="true" className="size-4" /> Annuler</Button>
                  <Button compact onClick={handleSave} disabled={saving} aria-busy={saving}>
                    {saving ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}
                    {saving ? "Enregistrement…" : "Enregistrer"}
                  </Button>
                </>
              ) : (
                <Button compact variant="outline-dark" onClick={startEditing}><Pencil aria-hidden="true" className="size-4" /> Modifier ce profil</Button>
              )}
              {isOwnProfile && <ButtonLink compact variant="outline-dark" to="/coach/dashboard">Tableau de bord</ButtonLink>}
            </div>
          )}

          <Breadcrumb tone="light" items={[{ label: "ACADEMY", to: "/academy" }, { label: coachData.name.toUpperCase() }]} />

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-16">
            <div className="relative aspect-[4/5] w-full max-w-[342px] shrink-0 overflow-hidden rounded-[16px] bg-v3-paper lg:w-[420px] lg:max-w-none">
              {photo ? (
                <img src={photo} alt={`Portrait de ${coachData.name}`} fetchPriority="high" referrerPolicy="no-referrer" className="absolute inset-0 size-full object-cover" />
              ) : (
                <User aria-hidden="true" className="absolute inset-0 m-auto size-16 text-v3-ink-muted" />
              )}
              {editing && (
                <div className="absolute inset-0 flex items-center justify-center bg-v3-navy/70 p-6">
                  <MediaUploader
                    label="Changer photo (4:5)"
                    accept="image"
                    bucket="admin-media"
                    onUpload={(url) => setEditData((prev: any) => prev ? { ...prev, photo_url: url } : prev)}
                    currentMedia={editData.photo_url || undefined}
                    uploadedBy="admin"
                  />
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col items-start gap-6">
              <p className="v3-label text-v3-ink-muted">COACH ACADEMY</p>
              {editing ? (
                <div className="flex w-full flex-col gap-4">
                  <div>
                    <label htmlFor="coach-name" className="v3-field-label">Nom</label>
                    <input id="coach-name" className="v3-input" value={editData.name ?? ""} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="coach-tagline" className="v3-field-label">Tagline</label>
                    <input id="coach-tagline" className="v3-input" value={editData.tagline ?? ""} onChange={(e) => setEditData({ ...editData, tagline: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="coach-specialties" className="v3-field-label">Spécialités (séparées par des virgules)</label>
                    <input id="coach-specialties" className="v3-input" value={editData.specialties.join(', ')} onChange={(e) => setEditData({ ...editData, specialties: e.target.value.split(',').map((s: string) => s.trim()) })} />
                  </div>
                  <div>
                    <label htmlFor="coach-video" className="v3-field-label">Vidéo de présentation (YouTube, Vimeo…)</label>
                    <input id="coach-video" className="v3-input" value={editData.presentation_video_url || ''} onChange={(e) => setEditData({ ...editData, presentation_video_url: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="coach-bio" className="v3-field-label">Biographie</label>
                    <textarea id="coach-bio" rows={8} className="v3-input" value={editData.bio ?? ""} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="v3-heading">{coachData.name}</h1>
                  {coachData.tagline && <p className="text-[18px] font-medium leading-7 text-v3-ink-muted">{coachData.tagline}</p>}
                  {coachData.specialties?.length > 0 && (
                    <ul className="flex flex-wrap gap-2" aria-label="Spécialités">
                      {coachData.specialties.map((spec: string, i: number) => (
                        <li key={i} className="v3-label rounded-full border border-v3-border bg-white px-3 py-1.5 text-v3-navy">{spec}</li>
                      ))}
                    </ul>
                  )}
                  {coachData.bio && <p className="v3-body whitespace-pre-wrap text-v3-ink-muted lg:max-w-[720px]">{coachData.bio}</p>}
                  {coachData.presentation_video_url && (
                    <a href={coachData.presentation_video_url} target="_blank" rel="noopener noreferrer" className={buttonClass("primary")}>
                      Voir la présentation vidéo <ArrowUpRight aria-hidden="true" strokeWidth={2.2} className="size-4" />
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Formations du coach */}
      <section className="v3-gutter w-full bg-v3-fond py-12 text-white lg:py-[72px]">
        <div className="v3-container flex flex-col items-start gap-6 lg:gap-10">
          <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-6 lg:gap-10">
              <p className="v3-label text-v3-lavender">SES FORMATIONS</p>
              <h2 className={SECTION_TITLE}>Apprendre avec {coachData.name}.</h2>
            </div>
            {canEdit && (
              <Button compact variant="outline" onClick={() => { setEditingCourse(null); setIsFormationModalOpen(true); }}>
                <Plus aria-hidden="true" className="size-4" /> Ajouter une formation
              </Button>
            )}
          </div>

          {coachCourses.length > 0 ? (
            <ol className="flex w-full flex-col gap-6 lg:gap-10">
              {coachCourses.map((course: any, idx: number) => {
                const meta = [disciplineLabel(course.discipline), levelLabel(course.level), formatDuration(course.duration), formatPrice(course.price_cents)].filter(Boolean).join(" · ");
                return (
                  <li key={course.id ?? idx} className="flex items-start gap-4 border-t border-v3-border pt-6 lg:pt-10">
                    <Link to={formationPath(course)} className="group flex min-w-0 flex-1 flex-col items-start gap-4 lg:flex-row lg:gap-8">
                      <span className="v3-label shrink-0 text-v3-lavender">{String(idx + 1).padStart(2, "0")}</span>
                      <span className="text-[26px] font-semibold leading-8 text-white transition-colors group-hover:text-v3-lavender lg:min-w-0 lg:flex-[0_1_480px]">{course.title}</span>
                      <span className="v3-body text-v3-muted lg:min-w-0 lg:flex-[0_1_640px]">{meta}</span>
                      <ArrowUpRight aria-hidden="true" strokeWidth={2.2} className="hidden size-5 shrink-0 text-v3-lavender lg:ml-auto lg:block" />
                    </Link>
                    {canEdit && (
                      <button
                        type="button"
                        aria-label={`Modifier « ${course.title} »`}
                        onClick={() => { setEditingCourse(course); setIsFormationModalOpen(true); }}
                        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-white hover:border-v3-lavender"
                      >
                        <Pencil aria-hidden="true" className="size-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="flex w-full flex-col items-start gap-6 border-t border-v3-border pt-6 lg:pt-10">
              <p className="v3-body text-v3-muted">Aucune formation disponible pour le moment.</p>
              {canEdit && (
                <Button onClick={() => { setEditingCourse(null); setIsFormationModalOpen(true); }}>
                  <Plus aria-hidden="true" className="size-4" /> Créer la première formation
                </Button>
              )}
            </div>
          )}

          <ButtonLink to="/academy" variant="light">Retour à l’Academy</ButtonLink>
        </div>
      </section>

      {canEdit && (
        <FormationModal
          isOpen={isFormationModalOpen}
          onClose={() => {
            setIsFormationModalOpen(false);
            setEditingCourse(null);
          }}
          onSuccess={() => {
            setIsFormationModalOpen(false);
            setEditingCourse(null);
            loadCoachData();
          }}
          preSelectedCoachId={String(coachData.id)}
          formation={editingCourse}
        />
      )}
    </>
  );
}
