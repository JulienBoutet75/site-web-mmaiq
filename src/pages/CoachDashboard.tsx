import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Play, Plus, Trash2, Edit2, Save, LogOut, ArrowLeft, 
  CheckCircle2, AlertCircle, GraduationCap, User, 
  Video, PlusCircle, X, ExternalLink, Lock, Unlock, Eye
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { 
  fetchData, insertData, updateData, deleteData, uploadFile
} from "../lib/supabase";
import { VideoPlayer } from "../components/VideoPlayer";
import { MediaUploader } from "../components/admin/MediaUploader";

// --- Helpers ---
const isYoutubeUrl = (url: string) => url.includes('youtube.com') || url.includes('youtu.be');

// --- Video Component ---
// Removed local VideoPlayer in favor of shared one

export function CoachDashboard() {
  const { user, profile, accessToken, coachSession, loading: authLoading, signOut, isLoggedIn, isCoach, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"formations" | "profile">("formations");
  const [loading, setLoading] = useState(true);
  const [coach, setCoach] = useState<any>(null);
  const [instructionals, setInstructionals] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInstructionals() {
      try {
        const data = await fetchData("formations", "category") as any[];
        const uniqueCategories = Array.from(new Set(data.map((f: any) => f.category)));
        setCategories(uniqueCategories as string[]);
      } catch (err) {
        console.error("Error loading categories:", err);
      }
    }
    loadInstructionals();
  }, []);

  // Auth check
  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn || (!isCoach && !isAdmin)) {
        navigate('/connexion');
      } else {
        loadInitialData();
      }
    }
  }, [authLoading, isLoggedIn, isCoach, isAdmin]);

  async function loadInitialData() {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      // 1. Get coach profile
      let myCoach = null;
      
      if (coachSession) {
        // Use coach session from localStorage
        const coachData = await fetchData("coaches", "*", `&id=eq.${coachSession.coachId}`, accessToken);
        if (coachData && coachData.length > 0) {
          myCoach = coachData[0];
        }
      } else if (user) {
        // Use real auth session
        const coachData = await fetchData("coaches", "*", `&profile_id=eq.${user.id}`, accessToken);
        if (coachData && coachData.length > 0) {
          myCoach = coachData[0];
        }
      }

      if (myCoach) {
        setCoach(myCoach);
        
        // 2. Get formations + chapters
        const formationsData = await fetchData("formations", "*,formation_chapters(*)", `&coach_id=eq.${myCoach.id}&order=created_at.desc`, accessToken);
        setInstructionals(formationsData);
      } else {
        setError("Profil coach introuvable. Veuillez contacter un administrateur.");
      }
    } catch (err: any) {
      setError("Erreur lors du chargement des données.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/connexion');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-accent-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-white font-body">
      {/* Header */}
      <header className="bg-[var(--color-bg-surface)] border-b border-white/10 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="font-display text-xl tracking-tighter">
              <span className="font-days-one tracking-normal">MMA IQ</span> <span className="text-[var(--color-accent-primary)]">COACH</span>
            </Link>
            <div className="h-6 w-[1px] bg-white/10 hidden md:block"></div>
            <div className="flex flex-col">
              <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-semibold">Espace Coach</span>
              <span className="text-sm font-medium">Bienvenue, {coach?.display_name || profile?.full_name}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {coach && (
              <Link 
                to={`/coaches/${coach.slug}`} 
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-violet-400)] hover:shadow-[0_0_20px_rgba(123,47,255,0.4)] transition-all text-sm font-bold text-white group"
              >
                <Eye size={18} className="group-hover:scale-110 transition-transform" />
                Voir ma page coach
              </Link>
            )}
            <Link to="/" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium">
              <ArrowLeft size={16} /> Voir le site
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors text-sm font-medium"
            >
              <LogOut size={16} /> Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex items-center gap-3">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-8">
          <button
            onClick={() => setActiveTab("formations")}
            className={`px-6 py-4 flex items-center gap-2 font-medium transition-all border-b-2 ${
              activeTab === "formations" 
                ? "border-[var(--color-accent-primary)] text-[var(--color-accent-primary)]" 
                : "border-transparent text-[var(--color-text-secondary)] hover:text-white"
            }`}
          >
            <GraduationCap size={20} /> Mes formations
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-4 flex items-center gap-2 font-medium transition-all border-b-2 ${
              activeTab === "profile" 
                ? "border-[var(--color-accent-primary)] text-[var(--color-accent-primary)]" 
                : "border-transparent text-[var(--color-text-secondary)] hover:text-white"
            }`}
          >
            <User size={20} /> Mon profil
          </button>
        </div>

        {/* Content */}
        {activeTab === "formations" ? (
          <CoachInstructional coach={coach} instructional={instructionals} onUpdate={loadInitialData} categories={categories} />
        ) : (
          <CoachProfile coach={coach} onUpdate={loadInitialData} />
        )}
      </main>
    </div>
  );
}

// --- Sub-components ---

function CoachInstructional({ coach, instructional, onUpdate, categories }: { coach: any, instructional: any[], onUpdate: () => void, categories: string[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingFormation, setEditingFormation] = useState<any>(null);

  if (isAdding || editingFormation) {
    return (
      <FormationForm 
        coach={coach} 
        initialData={editingFormation} 
        onCancel={() => { setIsAdding(false); setEditingFormation(null); }} 
        onSuccess={() => { setIsAdding(false); setEditingFormation(null); onUpdate(); }} 
        categories={categories}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display">Mes Instructional</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[var(--color-accent-primary)] hover:bg-[var(--color-violet-400)] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(123,47,255,0.3)]"
        >
          <Plus size={20} /> Ajouter un instructional
        </button>
      </div>

      {instructional.length === 0 ? (
        <div className="bg-[var(--color-bg-surface)] border border-white/10 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={32} className="text-[var(--color-text-secondary)]" />
          </div>
          <h3 className="text-xl font-medium mb-2">Aucun instructional pour le moment</h3>
          <p className="text-[var(--color-text-secondary)] mb-6">Commencez par créer votre premier instructional pour le partager avec vos élèves.</p>
          <button 
            onClick={() => setIsAdding(true)}
            className="text-[var(--color-accent-primary)] font-bold hover:underline"
          >
            Créer un instructional
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instructional.map((f) => (
            <div key={f.id} className="bg-[var(--color-bg-surface)] border border-white/10 rounded-2xl overflow-hidden hover:border-[var(--color-accent-primary)]/30 transition-all group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    f.published ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                  }`}>
                    {f.published ? "Publié" : "Brouillon"}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingFormation(f)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-[var(--color-text-secondary)] hover:text-white transition-colors">
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-xl font-display mb-2 line-clamp-1">{f.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4 line-clamp-2 h-10">{f.description}</p>
                
                <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)] mb-6">
                  <span className="flex items-center gap-1"><Video size={14} /> {f.formation_chapters?.length || 0} chapitres</span>
                  <span className="flex items-center gap-1"><Play size={14} /> {f.discipline}</span>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="font-display text-lg text-[var(--color-accent-primary)]">{f.price_cents / 100}€</span>
                  <span className="text-xs text-[var(--color-text-secondary)]">{f.level}</span>
                </div>
              </div>
              
              {/* Chapters Preview */}
              <div className="bg-[var(--color-bg-base)]/50 p-4 border-t border-white/10">
                <h4 className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest mb-2">Aperçu du contenu</h4>
                <div className="space-y-1">
                  {f.formation_chapters?.slice(0, 3).map((ch: any) => (
                    <div key={ch.id} className="flex items-center justify-between text-[11px] text-[var(--color-text-secondary)]">
                      <span className="truncate pr-2"># {ch.chapter_number} - {ch.title}</span>
                      {ch.is_preview ? <Unlock size={10} className="text-green-500" /> : <Lock size={10} />}
                    </div>
                  ))}
                  {f.formation_chapters?.length > 3 && (
                    <div className="text-[10px] text-[var(--color-text-secondary)] italic">+{f.formation_chapters.length - 3} autres chapitres...</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormationForm({ coach, initialData, onCancel, onSuccess, categories }: { coach: any, initialData?: any, onCancel: () => void, onSuccess: () => void, categories: string[] }) {
  const { profile, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    try {
      const url = await uploadFile("formations-videos", file, accessToken);
      updateChapter(index, "video_url", url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingIndex(null);
    }
  };
  
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    price_cents: initialData?.price_cents || 0,
    level: initialData?.level || "debutant",
    discipline: initialData?.discipline || "striking",
    category: initialData?.category || "Technique",
    published: initialData?.published || false,
    thumbnail_url: initialData?.thumbnail_url || "https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/images/default-formation.jpg",
    // La colonne réelle est trailer_url (trailer_video_url n'existe pas)
    trailer_url: initialData?.trailer_url || "",
  });

  const isSuperAdmin = profile?.role === 'super_admin';

  const [chapters, setChapters] = useState<any[]>(
    initialData?.formation_chapters?.sort((a: any, b: any) => a.sort_order - b.sort_order) || []
  );

  const handleTrailerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const url = await uploadFile("formations-videos", file, accessToken);
      setFormData({ ...formData, trailer_url: url });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addChapter = () => {
    const nextNum = chapters.length + 1;
    setChapters([...chapters, { 
      chapter_number: nextNum, 
      title: "", 
      video_url: "", 
      is_preview: false, 
      sort_order: nextNum 
    }]);
  };

  const updateChapter = (index: number, field: string, value: any) => {
    const newChapters = [...chapters];
    newChapters[index] = { ...newChapters[index], [field]: value };
    setChapters(newChapters);
  };

  const removeChapter = (index: number) => {
    setChapters(chapters.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let formationId = initialData?.id;
      const payload = { ...formData, coach_id: coach.id };

      if (formationId) {
        await updateData("formations", formationId, payload, accessToken);
      } else {
        const res = await insertData("formations", payload, accessToken);
        if (res && res.length > 0) {
          formationId = res[0].id;
        } else {
          throw new Error("Erreur lors de la création de la formation (pas de réponse)");
        }
      }

      // Handle chapters
      // Delete existing chapters if updating
      if (initialData?.id) {
        // We could do a more complex sync, but for MVP we delete and re-insert
        // Note: This is simplified. In production, you'd want to update existing and delete removed.
        const existingChapters = await fetchData("formation_chapters", "id", `&formation_id=eq.${formationId}`, accessToken);
        for (const ch of existingChapters) {
          await deleteData("formation_chapters", ch.id, accessToken);
        }
      }

      // Insert new chapters
      for (const ch of chapters) {
        await insertData("formation_chapters", {
          ...ch,
          formation_id: formationId,
        }, accessToken);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la sauvegarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--color-bg-surface)] border border-white/10 rounded-2xl p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-display">{initialData ? "Modifier la formation" : "Nouvelle formation"}</h2>
        <button onClick={onCancel} className="text-[var(--color-text-secondary)] hover:text-white"><X size={24} /></button>
      </div>

      {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Titre de la formation</label>
              <input 
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, "-") })}
                className="w-full bg-[var(--color-bg-surface)] border border-white/10 rounded-xl py-3 px-4 text-white focus:border-[var(--color-accent-primary)] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Slug (URL)</label>
              <input 
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full bg-[var(--color-bg-surface)] border border-white/10 rounded-xl py-3 px-4 text-white focus:border-[var(--color-accent-primary)] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Prix (en euros - ex: 49 pour 49€)</label>
              <input 
                type="number"
                required
                value={formData.price_cents / 100}
                onChange={(e) => setFormData({ ...formData, price_cents: Math.round(parseFloat(e.target.value) * 100) || 0 })}
                className="w-full bg-[var(--color-bg-surface)] border border-white/10 rounded-xl py-3 px-4 text-white focus:border-[var(--color-accent-primary)] outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Niveau</label>
                <select 
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full bg-[var(--color-bg-surface)] border border-white/10 rounded-xl py-3 px-4 text-white focus:border-[var(--color-accent-primary)] outline-none"
                >
                  <option value="debutant">Débutant</option>
                  <option value="amateur">Amateur</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Discipline</label>
                <select 
                  value={formData.discipline}
                  onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                  className="w-full bg-[var(--color-bg-surface)] border border-white/10 rounded-xl py-3 px-4 text-white focus:border-[var(--color-accent-primary)] outline-none"
                >
                  <option value="striking">Striking</option>
                  <option value="grappling">Grappling</option>
                  <option value="mma-gameplan">MMA Gameplan</option>
                  <option value="prepa-mentale">Prépa Mentale</option>
                  <option value="cut-nutrition">Cut & Nutrition</option>
                  <option value="conditioning">Conditioning</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Catégorie</label>
              {categories.length > 0 ? (
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-[var(--color-bg-surface)] border border-white/10 rounded-xl py-3 px-4 text-white focus:border-[var(--color-accent-primary)] outline-none"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              ) : (
                <input 
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-[var(--color-bg-surface)] border border-white/10 rounded-xl py-3 px-4 text-white focus:border-[var(--color-accent-primary)] outline-none"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Description</label>
              <textarea 
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-[var(--color-bg-surface)] border border-white/10 rounded-xl py-3 px-4 text-white focus:border-[var(--color-accent-primary)] outline-none resize-none"
              />
            </div>
            <div>
              <MediaUploader 
                label="Miniature" 
                accept="image" 
                bucket="admin-media"
                onUpload={(url) => setFormData({ ...formData, thumbnail_url: url })} 
                currentMedia={formData.thumbnail_url || undefined} 
                uploadedBy="coach" 
              />
            </div>
            <div>
              <MediaUploader 
                label="Vidéo de présentation (Trailer)" 
                accept="video" 
                bucket="formations-videos"
                onUpload={(url) => setFormData({ ...formData, trailer_url: url })}
                currentMedia={formData.trailer_url || undefined}
                uploadedBy="coach" 
              />
            </div>
            {isSuperAdmin && (
              <label className="flex items-center gap-3 cursor-pointer group/check">
                <div className="relative">
                  <input 
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${formData.published ? "bg-green-500" : "bg-white/10"}`}></div>
                  <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${formData.published ? "translate-x-5" : ""}`}></div>
                </div>
                <span className="text-sm text-[var(--color-text-secondary)] group-hover/check:text-white">Publier la formation</span>
              </label>
            )}
          </div>
        </div>

        {/* Chapters Section */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-display">Chapitres Vidéo</h3>
            <button 
              type="button"
              onClick={addChapter}
              className="flex items-center gap-2 text-[var(--color-accent-primary)] font-bold hover:text-[var(--color-violet-400)] transition-colors"
            >
              <PlusCircle size={20} /> Ajouter un chapitre
            </button>
          </div>

          <div className="space-y-6">
            {chapters.map((ch, index) => (
              <div key={index} className="bg-[var(--color-bg-surface)] border border-white/10 rounded-2xl p-6 relative group">
                <button 
                  type="button"
                  onClick={() => removeChapter(index)}
                  className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[var(--color-accent-primary)]/10 rounded-full flex items-center justify-center text-[var(--color-accent-primary)] font-bold">
                        {ch.chapter_number}
                      </div>
                      <input 
                        placeholder="Titre de la vidéo"
                        required
                        value={ch.title}
                        onChange={(e) => updateChapter(index, "title", e.target.value)}
                        className="flex-1 bg-transparent border-b border-white/10 py-2 text-white focus:border-[var(--color-accent-primary)] outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-[var(--color-text-secondary)] mb-2">Vidéo du chapitre</label>
                      {ch.video_url && (
                        <p className="text-xs text-green-400 mb-2">✓ Vidéo chargée</p>
                      )}
                      <label className="inline-block cursor-pointer bg-white/10 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg text-xs transition-colors">
                        {uploadingIndex === index ? "Upload en cours..." : "Importer une vidéo"}
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleFileUpload(index, e)}
                          className="hidden"
                          disabled={uploadingIndex === index}
                        />
                      </label>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer group/check">
                      <div className="relative">
                        <input 
                          type="checkbox"
                          checked={ch.is_preview}
                          onChange={(e) => updateChapter(index, "is_preview", e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-10 h-5 rounded-full transition-colors ${ch.is_preview ? "bg-[var(--color-accent-primary)]" : "bg-white/10"}`}></div>
                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${ch.is_preview ? "translate-x-5" : ""}`}></div>
                      </div>
                      <span className="text-sm text-[var(--color-text-secondary)] group-hover/check:text-white">Gratuit (aperçu)</span>
                    </label>
                  </div>

                  <div>
                    {ch.video_url && <VideoPlayer url={ch.video_url} className="w-full h-full" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex justify-end gap-4">
          <button 
            type="button"
            onClick={onCancel}
            className="px-8 py-3 rounded-xl border border-white/10 text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5 transition-all"
          >
            Annuler
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="px-12 py-3 rounded-xl bg-[var(--color-accent-primary)] hover:bg-[var(--color-violet-400)] text-white font-bold transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(123,47,255,0.3)]"
          >
            {loading ? "Sauvegarde..." : "Sauvegarder la formation"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CoachProfile({ coach, onUpdate }: { coach: any, onUpdate: () => void }) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: coach?.name || "",
    tagline: coach?.tagline || "",
    bio: coach?.bio || "",
    photo_url: coach?.photo_url || "",
    presentation_video_url: coach?.presentation_video_url || "",
  });

  useEffect(() => {
    if (coach) {
      setFormData({
        name: coach.name || "",
        tagline: coach.tagline || "",
        bio: coach.bio || "",
        photo_url: coach.photo_url || "",
        presentation_video_url: coach.presentation_video_url || "",
      });
    }
  }, [coach]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateData("coaches", coach.id, formData, accessToken);
      setSuccess(true);
      onUpdate();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--color-bg-surface)] border border-white/10 rounded-2xl p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--color-accent-primary)]/30">
          <img src={formData.photo_url || "https://picsum.photos/seed/mma/200"} alt="Profile" className="w-full h-full object-cover" />
        </div>
        <div>
          <h2 className="text-2xl font-display">Mon Profil Coach</h2>
          <p className="text-[var(--color-text-secondary)] text-sm">Gérez vos informations publiques affichées sur le site.</p>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 flex items-center gap-3">
          <CheckCircle2 size={20} />
          <span>✅ Profil mis à jour !</span>
        </div>
      )}

      {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Nom complet</label>
            <input 
              required
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[var(--color-bg-surface)] border border-white/10 rounded-xl py-3 px-4 text-white focus:border-[var(--color-accent-primary)] outline-none"
              placeholder="Ex: Johnny Frachey"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Tagline (Slogan)</label>
            <input 
              required
              value={formData.tagline || ""}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full bg-[var(--color-bg-surface)] border border-white/10 rounded-xl py-3 px-4 text-white focus:border-[var(--color-accent-primary)] outline-none"
              placeholder="Ex: Spécialiste Grappling & Sambo"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Biographie complète</label>
          <textarea 
            required
            rows={8}
            value={formData.bio || ""}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full bg-[var(--color-bg-surface)] border border-white/10 rounded-xl py-3 px-4 text-white focus:border-[var(--color-accent-primary)] outline-none resize-none"
            placeholder="Racontez votre parcours, votre palmarès et votre vision du combat..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <MediaUploader 
              label="Photo de profil" 
              accept="image" 
              bucket="admin-media"
              onUpload={(url) => setFormData({ ...formData, photo_url: url })} 
              currentMedia={formData.photo_url || undefined} 
              uploadedBy="coach" 
              aspectRatio={1}
            />
          </div>
          <div>
            <MediaUploader 
              label="Vidéo de présentation" 
              accept="video" 
              bucket="formations-videos"
              onUpload={(url) => setFormData({ ...formData, presentation_video_url: url })} 
              currentMedia={formData.presentation_video_url || undefined} 
              uploadedBy="coach" 
            />
          </div>
        </div>

        <div className="pt-6 border-t border-white/10">
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-violet-400)] text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(123,47,255,0.3)] flex items-center justify-center gap-2"
          >
            {loading ? "Mise à jour..." : <><Save size={20} /> Sauvegarder mon profil</>}
          </button>
        </div>
      </form>
    </div>
  );
}
