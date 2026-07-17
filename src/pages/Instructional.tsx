import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { showToast } from "../utils/ui";
import { Badge } from "../components/ui/Badge";
import { 
  Play, Star, Clock, User, ArrowRight, Search, Plus, Trash2, Pencil, 
  CheckCircle2, ChevronRight, ChevronLeft, ImageIcon, Video, Target, 
  Shield, Zap, Crosshair, Award, MonitorSmartphone, ChevronDown, CheckCircle,
  MessageSquare
} from "lucide-react";
import { useSite } from "../context/SiteContext";
import { useAuth } from "../context/AuthContext";
import { fetchData, updateData, deleteData, supabase } from "../lib/supabase";
import { FormationModal } from "../components/admin/FormationModal";

export function Instructional() {
  const navigate = useNavigate();
  const { isAdmin, openMediathequeForSelection } = useSite();
  const { user, session, loading: authLoading } = useAuth();
  // Jeton d'accès dérivé de la session Supabase (utilisé par les actions admin)
  const accessToken = session?.access_token;
  
  // Existing state
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCoachId, setEditingCoachId] = useState<number | string | null>(null);
  const [expandedCoaches, setExpandedCoaches] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const [courses, setCourses] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFormationModalOpen, setIsFormationModalOpen] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState<any>(null);

  const [levelFilter, setLevelFilter] = useState("");
  const [coachFilter, setCoachFilter] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("");

  // New state for FAQ
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Vidéo de fond du hero : si l'URL devient inaccessible (bucket
  // formations-videos passé en privé), on retire le <video> et le fond
  // existant (dégradés/overlay) prend le relais.
  const [heroVideoOk, setHeroVideoOk] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [f, c] = await Promise.all([
        fetchData("formations", "*", "&order=created_at.desc"),
        fetchData("coaches", "*", "&order=name.asc")
      ]);
      setCourses(f || []);
      setCoaches(c || []);
    } catch (error) {
      console.error("Error loading instructional data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  const filteredCourses = useMemo(() => {
    // Brouillons (published=false) réservés aux admins : le serveur refuse
    // leur achat, on les exclut donc du catalogue public.
    let filtered = isAdmin ? courses : courses.filter((c: any) => c.published !== false);

    if (levelFilter) filtered = filtered.filter((c: any) => c.level === levelFilter);
    if (coachFilter) filtered = filtered.filter((c: any) => String(c.coach_id) === coachFilter);
    if (disciplineFilter) filtered = filtered.filter((c: any) => c.discipline === disciplineFilter);

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((c: any) => {
        const coach = coaches.find(coach => coach.id === c.coach_id);
        return (
          c.title?.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          coach?.name?.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [courses, coaches, levelFilter, coachFilter, disciplineFilter, searchQuery, isAdmin]);

  // Libellés capitalisés des niveaux (stockés en minuscules en base)
  const levelLabels: Record<string, string> = {
    debutant: "Débutant",
    amateur: "Amateur",
    pro: "Pro"
  };

  const hasActiveFilters = Boolean(searchQuery.trim() || levelFilter || coachFilter || disciplineFilter);

  const resetFilters = () => {
    setSearchQuery("");
    setLevelFilter("");
    setCoachFilter("");
    setDisciplineFilter("");
  };

  // Tronque la description affichée sur les cartes (~140 caractères)
  const truncateDescription = (text?: string) =>
    text && text.length > 140 ? `${text.slice(0, 140).trimEnd()}…` : text;

  const handleAddCoach = async () => {
    const name = prompt("Nom du coach :");
    if (!name) return;
    const specialties = prompt("Spécialités (séparées par des virgules) :", "Striking, Grappling");
    const tagline = prompt("Tagline :", "Expert MMA");
    const bio = prompt("Biographie :", "Biographie du coach...");
    const photoUrl = prompt("URL de la photo :", "https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/images/default-coach.jpg");
    const videoUrl = prompt("URL de la vidéo de présentation :", "");

    const accessKey = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map(b => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[b % 36]).join('')

    try {
      const { error } = await supabase.from('coaches').insert({
        name,
        slug: name.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        access_key: accessKey,
        specialties: specialties ? specialties.split(',').map(s => s.trim()).filter(Boolean) : [],
        tagline,
        bio,
        photo_url: photoUrl,
        presentation_video_url: videoUrl,
        is_featured: false,
        sort_order: 0
      }).select()

      if (error) {
        console.error("Supabase error adding coach:", error);
        alert(`Erreur Supabase (${error.code}): ${error.message}`);
      } else {
        showToast('Coach ajouté avec succès !');
        await loadData();
      }
    } catch (err: any) {
      console.error("Unexpected error adding coach:", err);
      alert(`Erreur inattendue: ${err.message}`);
    }
  };

  const handleUpdateCoach = async (id: string | number, data: any) => {
    try {
      await updateData("coaches", id, data, accessToken);
      loadData();
    } catch (error) {
      console.error("Error updating coach:", error);
    }
  };

  const handleDeleteCoach = async (id: string | number) => {
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
    setSelectedFormation(formation);
    setIsFormationModalOpen(true);
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const categories = [
    { name: "Striking", value: "striking", icon: Target },
    { name: "Lutte", value: "lutte", icon: Shield },
    { name: "Grappling", value: "grappling", icon: Zap },
    { name: "Gameplan", value: "mma-gameplan", icon: Crosshair },
    { name: "Prépa Mentale", value: "prepa-mentale", icon: Award },
    { name: "Conditioning", value: "conditioning", icon: MonitorSmartphone },
  ];

  const faqItems = [
    {
      q: "Ai-je accès à la formation à vie après l'achat ?",
      a: "Oui. Une fois achetée, la formation est ajoutée à votre compte et reste accessible en illimité, 24h/24 et 7j/7 sans aucun frais supplémentaire."
    },
    {
      q: "Y a-t-il des teasers avant d'acheter ?",
      a: "Absolument. Chaque instructional possède une bande-annonce et une description détaillée des chapitres abordés pour que vous sachiez exactement ce que vous allez apprendre."
    },
    {
      q: "À quel niveau s'adressent ces contenus ?",
      a: "Nous couvrons tous les niveaux. Chaque formation possède un badge clair (Débutant, Amateur, Pro) pour vous orienter vers le contenu le plus adapté à votre progression."
    },
    {
      q: "Puis-je regarder les vidéos sur mon téléphone ?",
      a: "Oui, la plateforme est 100% optimisée pour mobile, tablette et ordinateur. Vous pouvez étudier les techniques directement depuis la salle d'entraînement."
    }
  ];

  return (
    <div className="bg-[var(--color-bg-base)] text-white selection:bg-[var(--color-accent-red)] selection:text-white min-h-screen font-body">
      
      {/* BLOC 1 — HERO */}
      <section className="relative w-full min-h-[85vh] flex flex-col items-center justify-center text-center overflow-hidden pt-32 pb-16">
        <div className="absolute inset-0 z-0 bg-[var(--color-bg-base)]">
          {/* À remplacer par un asset local public/ ou un bucket public :
              cette URL cassera quand formations-videos passera en privé. */}
          {heroVideoOk && (
            <video
              autoPlay loop muted playsInline
              onError={() => setHeroVideoOk(false)}
              className="w-full h-full object-cover opacity-50 relative"
              src="https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/formations-videos/BMPCC%204K%20_%20Jessie%20Wilcox%20Boxing.mp4"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg-base)]/70 via-[var(--color-bg-base)]/40 to-[var(--color-bg-base)]"></div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 px-6 max-w-5xl mx-auto flex flex-col items-center"
        >
          <Badge color="red" className="mb-8 bg-[var(--color-bg-elevated)] backdrop-blur-md border-[var(--color-accent-red)]/30 text-white uppercase tracking-[0.2em] px-4 py-2 text-xs">
            MMA IQ ACADEMY
          </Badge>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-white mb-6 tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Le savoir combat,<br />
            <span className="text-[var(--color-accent-red)]">à l'essentiel.</span>
          </h1>
          <p className="font-body text-base md:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Des instructionals experts, ciblés et immédiatement utiles. Des coachs crédibles. Des formats justes. Une pédagogie claire.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              onClick={() => scrollTo('instructionals')}
              className="bg-[var(--color-accent-red)] hover:bg-[#ff4d5e] text-white font-ui font-semibold py-4 px-8 rounded-full transition-all duration-300 shadow-xl flex items-center justify-center gap-2"
            >
              Découvrir les vidéos <ArrowRight size={18} />
            </button>
          </div>
          {!authLoading && !user && (
            <Link
              to="/connexion?mode=signup&redirect=/instructional"
              className="mt-4 font-ui text-sm text-[var(--color-text-secondary)] hover:text-white underline underline-offset-4 decoration-white/20 hover:decoration-white/60 transition-colors"
            >
              Créer un compte gratuit →
            </Link>
          )}
        </motion.div>
      </section>

      {/* BLOC 2 — COACHS / EXPERTS (DÉPLACÉ ICI) */}
      <section className="px-6 py-24 md:py-32 bg-[var(--color-bg-base)] relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl md:text-5xl text-white mb-4">Des coachs qui savent transmettre.</h2>
              <p className="font-body text-lg text-[var(--color-text-secondary)]">Nous ne cherchons pas seulement des grands sportifs. Nous cherchons des coachs capables d'expliquer clairement et de faire progresser.</p>
            </div>
            {isAdmin && (
              <button
                onClick={handleAddCoach}
                className="flex items-center gap-2 bg-[var(--color-accent-primary)] hover:bg-[var(--color-violet-400)] text-white px-6 py-3 rounded-full text-sm font-bold transition-all shrink-0"
              >
                <Plus size={18} /> Ajouter un coach
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {coaches.map((coach: any, i: number) => (
              <motion.div
                key={coach.id || i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative group bg-[var(--color-bg-surface)] border border-white/5 hover:border-white/20 rounded-3xl p-6 md:p-8 flex flex-col items-center text-center transition-all duration-300"
              >
                {isAdmin && (
                  <div className="absolute top-3 right-3 z-30 flex gap-2">
                    <button onClick={() => setEditingCoachId(editingCoachId === coach.id ? null : coach.id)} className="w-8 h-8 rounded-full bg-black/50 hover:bg-black flex items-center justify-center text-white border border-white/10 transition-colors">
                      {editingCoachId === coach.id ? <CheckCircle2 size={14} /> : <Pencil size={14} />}
                    </button>
                    <button onClick={() => handleDeleteCoach(coach.id)} className="w-8 h-8 rounded-full bg-[var(--color-accent-secondary)]/20 hover:bg-[var(--color-accent-secondary)] flex items-center justify-center text-[var(--color-accent-secondary)] hover:text-white border border-[var(--color-accent-secondary)]/50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                {editingCoachId === coach.id ? (
                  <div className="w-full flex flex-col gap-3 text-left relative z-20" onClick={(e) => e.stopPropagation()}>
                    <input className="bg-[var(--color-bg-elevated)] border border-white/10 rounded-xl p-3 text-sm text-white" value={coach.name} onChange={(e) => handleUpdateCoach(coach.id, { name: e.target.value })} placeholder="Nom du coach" />
                    <input className="bg-[var(--color-bg-elevated)] border border-white/10 rounded-xl p-3 text-sm text-white" value={coach.specialties?.join(', ') || ""} onChange={(e) => handleUpdateCoach(coach.id, { specialties: e.target.value.split(',').map((s: string) => s.trim()) })} placeholder="Spécialités" />
                    <textarea className="bg-[var(--color-bg-elevated)] border border-white/10 rounded-xl p-3 text-sm text-white h-24 resize-none" value={coach.bio} onChange={(e) => handleUpdateCoach(coach.id, { bio: e.target.value })} placeholder="Biographie" />
                    <div className="flex gap-2">
                      <input className="bg-[var(--color-bg-elevated)] border border-white/10 rounded-xl p-3 text-white flex-1 text-xs" value={coach.photo_url || ""} onChange={(e) => handleUpdateCoach(coach.id, { photo_url: e.target.value })} placeholder="URL Photo" />
                      <button onClick={() => openMediathequeForSelection((url) => handleUpdateCoach(coach.id, { photo_url: url }))} className="px-4 bg-[var(--color-bg-elevated)] rounded-xl border border-white/10 hover:bg-white/5"><ImageIcon size={16} /></button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center w-full">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--color-bg-elevated)] mb-6 shadow-xl shrink-0 pointer-events-none group-hover:border-[var(--color-accent-red)]/50 transition-colors duration-500">
                      <img loading="lazy" src={coach.photo_url || coach.image} alt={coach.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <h3 className="font-display text-xl text-white mb-2">{coach.name}</h3>
                    <p className="text-[var(--color-accent-red)] font-ui text-xs font-bold uppercase tracking-widest mb-4">
                      {coach.specialties?.slice(0, 2).join(', ')}
                    </p>
                    <p className="font-body text-[var(--color-text-secondary)] text-sm mb-8 line-clamp-3 leading-relaxed">
                      {coach.bio}
                    </p>
                    <button 
                      onClick={() => navigate(`/coaches/${coach.slug}`)}
                      className="mt-auto font-ui text-sm font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full py-2.5 w-full transition-colors flex items-center justify-center gap-2 group-hover:border-white/30"
                    >
                      Voir son profil <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STICKY SEARCH & FILTERS */}
      <div id="instructionals" className="sticky top-[56px] md:top-[80px] z-40 bg-[var(--color-bg-base)]/95 backdrop-blur-xl border-y border-white/5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)] scroll-mt-[180px]">
        <div className="px-6 max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text" 
              aria-label="Rechercher une technique ou un coach" placeholder="Rechercher une technique, un coach..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--color-bg-elevated)] border border-white/10 rounded-full py-3 pl-11 pr-4 text-sm text-white placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent-red)]/50 focus:bg-white/5 transition-all"
            />
          </div>
          
          <div className="relative w-full flex-1 min-w-0 md:flex md:justify-end">
            <div className="flex flex-row gap-2 w-full md:justify-end overflow-x-auto pb-2 md:pb-0 scrollbar-hide" ref={scrollRef}>
              <select 
                aria-label="Filtrer par niveau"
                className="bg-[var(--color-bg-elevated)] border border-white/10 text-white rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-accent-red)] flex-none cursor-pointer"
                onChange={(e) => setLevelFilter(e.target.value)}
                value={levelFilter}
              >
                <option value="">Tous les niveaux</option>
                <option value="debutant">Débutant</option>
                <option value="amateur">Amateur</option>
                <option value="pro">Pro</option>
              </select>

              <select
                className="bg-[var(--color-bg-elevated)] border border-white/10 text-white rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-accent-red)] flex-none cursor-pointer"
                aria-label="Filtrer par coach" onChange={(e) => setCoachFilter(e.target.value)}
                value={coachFilter}
              >
                <option value="">Tous les coachs</option>
                {coaches.map((coach: any) => (
                  <option key={coach.id} value={String(coach.id)}>{coach.name}</option>
                ))}
              </select>

              <select
                className="bg-[var(--color-bg-elevated)] border border-white/10 text-white rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-accent-red)] flex-none cursor-pointer"
                aria-label="Filtrer par discipline" onChange={(e) => setDisciplineFilter(e.target.value)}
                value={disciplineFilter}
              >
                <option value="">Toutes les disciplines</option>
                <option value="striking">Striking</option>
                <option value="grappling">Grappling</option>
                <option value="mma-gameplan">MMA Gameplan</option>
                <option value="prepa-mentale">Prépa Mentale</option>
                <option value="cut-nutrition">Cut & Nutrition</option>
                <option value="conditioning">Conditioning</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* BLOC 4 — INSTRUCTIONALS GRILLE */}
      <section className="px-6 py-16 bg-[var(--color-bg-base)] relative z-10 min-h-[50vh]">
        <div className="max-w-7xl mx-auto">
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredCourses.map((course: any, i: number) => {
                const coach = coaches.find(c => c.id === course.coach_id);
                return (
                  <motion.div
                    key={course.id || i}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.4 }}
                    className="relative group flex flex-col h-full bg-white/[0.04] border border-white/[0.05] rounded-3xl overflow-hidden hover:border-[var(--color-accent-red)]/40 hover:-translate-y-2 transition-all duration-300"
                  >
                    {isAdmin && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEditFormation(course);
                        }}
                        className="absolute top-4 right-4 z-40 p-3 bg-black/80 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-[var(--color-accent-red)] transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    <div 
                      onClick={() => navigate(`/course/${course.slug || course.id}`)}
                      className="cursor-pointer flex flex-col h-full"
                    >
                      <div className="aspect-video bg-[var(--color-bg-elevated)] relative overflow-hidden shrink-0">
                        <img loading="lazy" 
                          src={course.thumbnail_url || "https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/images/default-formation.jpg"}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-surface)] via-[var(--color-bg-surface)]/20 to-transparent"></div>
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500 z-10"></div>
                        
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
                          <div className="w-16 h-16 rounded-full bg-[var(--color-accent-red)] flex items-center justify-center backdrop-blur-md shadow-[0_0_40px_rgba(255,23,68,0.6)] transform scale-75 group-hover:scale-100 transition-transform duration-500">
                            <Play className="w-6 h-6 ml-1 text-white" fill="currentColor" />
                          </div>
                        </div>

                        <div className="absolute top-4 left-4 z-20 flex gap-2">
                          <Badge
                            color={course.level?.toLowerCase() === "debutant" ? "green" : course.level?.toLowerCase() === "amateur" ? "purple" : "red"}
                            className="bg-black/80 backdrop-blur-md border-white/5 font-bold tracking-widest text-[10px]"
                          >
                            {levelLabels[course.level?.toLowerCase()] || course.level}
                          </Badge>
                          {/* Repère admin : formation invisible du public */}
                          {isAdmin && course.published === false && (
                            <Badge color="gray" className="bg-black/80 backdrop-blur-md border-white/5 font-bold tracking-widest text-[10px]">
                              Brouillon
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-6 flex flex-col flex-grow relative">
                        <div className="flex items-center gap-3 mb-4">
                          {coach && (
                            <Link 
                              to={`/coaches/${coach.slug}`} 
                              className="flex items-center gap-2 hover:opacity-80 transition-opacity relative z-30"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                                <img loading="lazy" src={coach.photo_url || coach.image} alt={coach.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <span className="font-ui text-xs md:text-sm font-semibold text-white/90">{coach.name}</span>
                            </Link>
                          )}
                          {!coach && <span className="font-ui text-xs md:text-sm font-semibold text-white/90">Coach</span>}
                          
                          <span className="text-white/30 text-xs">•</span>
                          
                          <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)] text-xs md:text-sm font-ui">
                            <Clock size={14} /> {course.duration || "N/A"}
                          </div>
                        </div>

                        <h3 className="font-display text-xl md:text-2xl mb-3 text-white group-hover:text-[var(--color-accent-red)] transition-colors line-clamp-2 leading-tight">
                          {course.title}
                        </h3>
                        
                        <p className="font-body text-[var(--color-text-secondary)] text-sm md:text-base mb-5 flex-grow line-clamp-1 leading-relaxed">
                          {truncateDescription(course.description)}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                          {course.discipline && (
                            <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] md:text-xs font-ui text-[var(--color-text-secondary)]">
                              {course.discipline}
                            </span>
                          )}
                          {course.duration && course.duration.includes('h') ? (
                            <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] md:text-xs font-ui text-[var(--color-text-secondary)]">Format expert</span>
                          ) : (
                            <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] md:text-xs font-ui text-[var(--color-text-secondary)]">Format court</span>
                          )}
                        </div>
                        
                        <div className="mt-auto pt-6 border-t border-white/5">
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-display text-2xl text-white">{course.price_cents ? (course.price_cents / 100).toFixed(2) : course.price || 0}€</span>
                            
                            <div className="flex items-center gap-2">
                              {course.trailer_url && (
                                <span className="hidden sm:inline-block text-xs text-[var(--color-text-secondary)]">Teaser gratuit inclus</span>
                              )}
                              <button className="bg-[var(--color-accent-red)] hover:bg-[#ff4d5e] text-white font-ui font-bold py-2.5 px-4 md:px-5 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs md:text-sm shadow-[0_0_15px_rgba(255,23,68,0.2)]">
                                Découvrir <ArrowRight size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
          
          {isAdmin && (
            <div className="mt-12">
              <motion.button 
                onClick={handleAddFormation}
                className="w-full py-8 rounded-3xl border-2 border-dashed border-white/10 hover:border-white/30 bg-[var(--color-bg-elevated)]/50 hover:bg-[var(--color-bg-elevated)] transition-all group relative overflow-hidden flex flex-col items-center gap-3"
              >
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-[var(--color-accent-red)]/20">
                  <Plus className="w-6 h-6 text-white group-hover:text-[var(--color-accent-red)] transition-colors" />
                </div>
                <span className="text-lg font-display text-white">Ajouter une formation</span>
                <span className="text-sm font-body text-[var(--color-text-secondary)]">Créer un nouveau programme d'entraînement</span>
              </motion.button>
            </div>
          )}
          
          {filteredCourses.length === 0 && !loading && (
            hasActiveFilters ? (
              /* Filtres ou recherche actifs sans résultat */
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32">
                <p className="font-display text-2xl text-white mb-2">Aucun format ne correspond.</p>
                <p className="font-body text-[var(--color-text-secondary)] mb-8">Ajustez vos filtres pour découvrir le catalogue.</p>
                <button
                  onClick={resetFilters}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-white font-ui text-sm font-semibold py-3 px-6 rounded-full transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              </motion.div>
            ) : (
              /* Catalogue réellement vide */
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32">
                <p className="font-display text-2xl text-white mb-2">Catalogue en préparation</p>
                <p className="font-body text-[var(--color-text-secondary)]">Les premières formations arrivent très bientôt.</p>
              </motion.div>
            )
          )}
        </div>
      </section>

      {/* BLOC 5 — POURQUOI MMA IQ ACADEMY */}
      <section className="px-6 py-24 md:py-32 bg-[var(--color-bg-elevated)] relative z-10 border-t border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="w-full md:w-1/2">
            <h2 className="font-display text-3xl md:text-5xl text-white mb-6 leading-tight">
              Pourquoi choisir<br />
              <span className="text-[var(--color-accent-red)]">MMA IQ ACADEMY ?</span>
            </h2>
            <p className="font-body text-lg md:text-xl text-[var(--color-text-secondary)] mb-8 leading-relaxed">
              Le milieu du JJB et du MMA est saturé d'instructionals interminables, souvent mal filmés et vendus à des prix exorbitants. Nous avons décidé de faire l'inverse.
            </p>
            <div className="space-y-4">
              {[
                "Aller directement à l'essentiel, sans blabla.",
                "Une pédagogie validée et reconnue.",
                "Des formats plus justes, à des prix raisonnables.",
                "Totalement intégré à l'écosystème MMA IQ."
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-4 bg-[var(--color-bg-surface)] border border-white/5 p-4 rounded-2xl">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--color-accent-red)]/20 flex items-center justify-center text-[var(--color-accent-red)]">
                    <CheckCircle size={16} />
                  </div>
                  <span className="font-body text-white font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <div className="aspect-[4/5] bg-[var(--color-bg-base)] border border-[var(--color-accent-red)]/20 rounded-3xl overflow-hidden relative shadow-[0_0_50px_rgba(255,23,68,0.15)]">
              <img loading="lazy" 
                src="https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/images/about/mission.jpg" 
                alt="MMA IQ Setup"
                className="w-full h-full object-cover mix-blend-luminosity opacity-70"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-surface)] to-transparent"></div>
              <div className="absolute bottom-10 left-10 right-10">
                <p className="font-display text-3xl text-white italic">"Plus ciblé. Plus utile. Plus juste."</p>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* BLOC 8 — FAQ */}
      <section className="px-6 py-24 md:py-32 bg-[var(--color-bg-base)] relative z-10 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-5xl text-white mb-12 text-center">Vos questions, nos réponses.</h2>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <div 
                key={i} 
                className="bg-[var(--color-bg-surface)] border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button 
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-display text-lg text-white pr-8">{item.q}</span>
                  <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 transition-transform duration-300 ${activeFaq === i ? "rotate-180 bg-[var(--color-accent-red)] text-white" : "text-[var(--color-text-secondary)]"}`}>
                    <ChevronDown size={18} />
                  </div>
                </button>
                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6"
                    >
                      <p className="font-body text-[var(--color-text-secondary)] leading-relaxed pt-2 border-t border-white/5">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>



      <FormationModal 
        isOpen={isFormationModalOpen}
        onClose={() => setIsFormationModalOpen(false)}
        formation={selectedFormation}
        onSuccess={loadData}
      />
    </div>
  );
}
