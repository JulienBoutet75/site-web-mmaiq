import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  Play, ChevronDown, CheckCircle2, Clock, User, 
  Star, ShoppingCart, ArrowLeft, Lock, Unlock,
  Info, AlertCircle, Check, PlayCircle, ArrowRight,
  Edit2, Save, X, Plus, Trash2, Loader2, UploadCloud
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { VideoPlayer } from "../components/VideoPlayer";
import { createFormationCheckout, redeemAccessCode, getVideoUrl } from "../services/stripeService";
import { MediaUploader } from "../components/admin/MediaUploader";
import { showToast } from "../utils/ui";

export function Course() {
  const { slug } = useParams();
  const { user, session, profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [formation, setFormation] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [activeChapter, setActiveChapter] = useState<any>(null);
  // Modale post-échec d'achat : 'unconfigured' si le serveur répond que
  // Stripe n'est pas configuré, 'error' pour tout autre échec réel.
  const [purchaseModal, setPurchaseModal] = useState<'unconfigured' | 'error' | null>(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  // URLs de lecture résolues côté serveur (signées quand le bucket est privé)
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [chapterUrl, setChapterUrl] = useState<string | null>(null);
  const [chapterLoading, setChapterLoading] = useState(false);

  // Admin Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [editChapters, setEditChapters] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // isAdmin (useAuth) couvre les rôles admin/super_admin ET l'admin reconnu
  // par email (fallback VITE_ADMIN_EMAIL sans ligne profiles).
  const canEdit = isAdmin || (profile?.role === 'coach' && formation?.coach_id === profile?.id);

  // Chemins de redirection auth (convention /connexion?mode=...&redirect=...)
  const coursePath = `/course/${slug}`;
  const signupUrl = `/connexion?mode=signup&redirect=${encodeURIComponent(coursePath)}`;
  const signinUrl = `/connexion?redirect=${encodeURIComponent(coursePath)}`;

  const startEditing = () => {
    if (!formation) {
      console.error("No formation data found to edit!");
      return;
    }
    
    let longDesc = { content: "", bullets: [] };
    if (typeof formation.long_description === 'string' && formation.long_description.startsWith('{')) {
      try {
        longDesc = JSON.parse(formation.long_description);
      } catch (e) {
        longDesc = { content: formation.long_description, bullets: [] };
      }
    } else if (typeof formation.long_description === 'object' && formation.long_description !== null) {
      longDesc = formation.long_description as any;
    } else {
      longDesc = { content: formation.long_description || "", bullets: [] };
    }

    setEditData({
      title: formation.title,
      description: formation.description,
      long_description: longDesc.content || "",
      bullets: longDesc.bullets || [],
      access_code: (longDesc as any).access_code || "",
      trailer_url: formation.trailer_url || "",
      thumbnail_url: formation.thumbnail_url || "",
      price_cents: formation.price_cents,
      level: formation.level,
      discipline: formation.discipline,
      coach_bio: formation.coaches?.bio || "",
      coach_tagline: formation.coaches?.tagline || "",
      duration: formation.duration || "",
      rating: formation.rating,
      reviews_count: formation.reviews_count
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
        duration: editData.duration,
        rating: editData.rating,
        reviews_count: editData.reviews_count
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
    async function loadData() {
      if (!slug) return;
      setLoading(true);
      try {
        // 1. Load formation + coach
        const { data: fData, error: fError } = await supabase
          .from("formations")
          .select("*, coaches(id, name, slug, photo_url, tagline, bio)")
          .eq("slug", slug)
          .single();

        if (fError) throw fError;
        if (fData) {
          setFormation(fData);

          // 2. Load chapters
          const { data: chData, error: chError } = await supabase
            .from("formation_chapters")
            .select("*")
            .eq("formation_id", fData.id)
            .order("sort_order");

          if (chError) throw chError;
          setChapters(chData || []);

          // 3. Check purchase if logged in (seule source de vérité : purchases)
          if (user) {
            const { data: pData } = await supabase
              .from("purchases")
              .select("id")
              .eq("user_id", user.id)
              .eq("formation_id", fData.id)
              .eq("status", "completed");
            setHasPurchased(!!(pData && pData.length > 0));
          } else {
            setHasPurchased(false);
          }
        }
      } catch (err) {
        console.error("Error loading formation:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug, user?.id]);

  // Teaser : URL résolue côté serveur pour les utilisateurs connectés
  // (signée si le bucket est privé, URL stockée en mode dégradé).
  useEffect(() => {
    let cancelled = false;
    async function loadTrailer() {
      if (!formation?.trailer_url || !user || !session?.access_token) {
        setTrailerUrl(null);
        return;
      }
      setTrailerLoading(true);
      try {
        const { url } = await getVideoUrl(formation.id, 'trailer', session.access_token);
        if (!cancelled) setTrailerUrl(url);
      } catch (err) {
        console.error("Erreur de chargement du teaser:", err);
        // Repli : URL stockée telle quelle (bucket encore public)
        if (!cancelled) setTrailerUrl(formation.trailer_url);
      } finally {
        if (!cancelled) setTrailerLoading(false);
      }
    }
    loadTrailer();
    return () => { cancelled = true; };
  }, [formation?.id, formation?.trailer_url, user?.id, session?.access_token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-accent-primary)]"></div>
      </div>
    );
  }

  if (!formation) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-3xl font-display mb-4 text-white">Formation introuvable</h2>
        <Link to="/instructional">
          <Button variant="outline" className="text-white border-white/20">Retour à l'Academy</Button>
        </Link>
      </div>
    );
  }

  const coach = formation.coaches;
  const longDescData = typeof formation.long_description === 'string' && formation.long_description.startsWith('{')
    ? JSON.parse(formation.long_description)
    : (typeof formation.long_description === 'object' && formation.long_description !== null) 
      ? formation.long_description 
      : { content: formation.long_description, bullets: [], access_code: '' };

  // Le code d'accès est validé exclusivement côté serveur : plus aucune
  // comparaison locale ni déblocage localStorage (zéro sécurité côté client).
  const handleCodeSubmit = async (e: React.FormEvent) => {
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
    if (!user || !session?.access_token) {
      navigate(signupUrl);
      return;
    }

    try {
      // Le prix est résolu côté serveur depuis la table formations
      await createFormationCheckout(formation.id, session.access_token);
    } catch (error: any) {
      // Le placeholder « bientôt disponible » est réservé au cas où le
      // serveur indique explicitement que Stripe n'est pas configuré.
      setPurchaseModal(error?.message === 'Stripe is not configured' ? 'unconfigured' : 'error');
    }
  };

  // Sélection d'un chapitre : l'URL signée est récupérée à la demande
  // (les URLs signées expirent, on ne les précharge pas toutes).
  const openChapter = async (ch: any) => {
    if (!user || !session?.access_token) {
      navigate(signinUrl);
      return;
    }
    if (!hasPurchased && !canEdit) {
      showToast("Achetez la formation ou utilisez un code d'accès pour accéder à ce chapitre.");
      return;
    }
    setActiveChapter(ch);
    setChapterUrl(null);
    setChapterLoading(true);
    window.scrollTo({ top: 400, behavior: 'smooth' });
    try {
      const { url } = await getVideoUrl(formation.id, ch.id, session.access_token);
      setChapterUrl(url);
    } catch (err) {
      console.error("Erreur de chargement du chapitre:", err);
      showToast("Impossible de charger la vidéo de ce chapitre.");
    } finally {
      setChapterLoading(false);
    }
  };

  return (
    <div className="bg-[var(--color-bg-base)] text-white pt-32 pb-24 min-h-screen selection:bg-[var(--color-accent-primary)] selection:text-white">
      {/* Admin Toolbar */}
      {canEdit && (
        <div className="fixed top-24 left-0 right-0 z-[60] px-6">
          <div className="max-w-7xl mx-auto flex justify-end gap-4">
            {isEditing ? (
              <>
                <Button 
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <X size={20} className="mr-2" /> Annuler
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold"
                >
                  {saving ? <Loader2 size={20} className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                  Enregistrer
                </Button>
              </>
            ) : (
              <Button 
                onClick={startEditing}
                className="bg-[var(--color-accent-primary)] hover:bg-[var(--color-violet-400)] text-white font-bold"
              >
                <Edit2 size={20} className="mr-2" /> Modifier la page
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Hero Section - Coach Focused */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-20 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--color-accent-primary)] blur-[150px] rounded-full"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500 blur-[150px] rounded-full"></div>
        </div>

        <div className="px-6 max-w-7xl mx-auto relative z-10">
          {/* Coach Info (Top) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-row gap-4 md:gap-8 items-start text-left mb-8 pb-8 border-b border-white/10"
          >
            {/* Coach Photo */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden shrink-0 border border-white/10">
              <img loading="lazy" src={coach?.photo_url} alt={coach?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            
            {/* Coach Details */}
            <div className="space-y-2 md:space-y-4 flex-1">
              <div className="flex gap-2 mb-2">
                <Badge color="red" className="bg-red-500/20 border-red-500/30 text-red-500 uppercase tracking-widest px-3 py-1.5 backdrop-blur-md text-xs shadow-lg">
                  {isEditing && editData ? (
                    <select 
                      value={editData.discipline}
                      onChange={(e) => setEditData({...editData, discipline: e.target.value})}
                      className="bg-transparent border-none outline-none text-red-500"
                    >
                      <option value="striking">Striking</option>
                      <option value="grappling">Grappling</option>
                      <option value="mma-gameplan">MMA Gameplan</option>
                    </select>
                  ) : formation.discipline}
                </Badge>
                <Badge color="purple" className="bg-purple-500/20 border-purple-500/30 text-purple-400 uppercase tracking-widest px-3 py-1.5 backdrop-blur-md text-xs shadow-lg">
                  {isEditing && editData ? (
                    <select 
                      value={editData.level}
                      onChange={(e) => setEditData({...editData, level: e.target.value})}
                      className="bg-transparent border-none outline-none text-purple-400"
                    >
                      <option value="debutant">Débutant</option>
                      <option value="amateur">Amateur</option>
                      <option value="pro">Pro</option>
                    </select>
                  ) : formation.level}
                </Badge>
              </div>
              <div className="text-xs md:text-sm text-[var(--color-accent-primary)] font-bold uppercase tracking-[0.2em]">Profil du Coach</div>
              <h1 className="text-2xl md:text-5xl font-display leading-[0.85] tracking-tighter">
                {coach?.name}
              </h1>
              {isEditing && editData ? (
                <input 
                  value={editData.coach_tagline}
                  onChange={(e) => setEditData({...editData, coach_tagline: e.target.value})}
                  placeholder="Tagline du coach"
                  className="text-sm md:text-lg text-[var(--color-accent-primary)] font-display italic bg-white/5 border border-white/10 rounded-xl px-3 py-1 w-full outline-none focus:border-[var(--color-accent-primary)]"
                />
              ) : (
                <p className="text-sm md:text-lg text-[var(--color-accent-primary)] font-display italic">
                  {coach?.tagline}
                </p>
              )}
              
              <div className="prose prose-invert max-w-none">
                {isEditing && editData ? (
                  <textarea 
                    value={editData.coach_bio}
                    onChange={(e) => setEditData({...editData, coach_bio: e.target.value})}
                    placeholder="Bio du coach"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs md:text-sm text-white/70 outline-none focus:border-[var(--color-accent-primary)] h-20"
                  />
                ) : (
                  <p className="text-xs md:text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                    {coach?.bio}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap justify-start gap-2 md:gap-4 pt-1">
                <Link to={`/coaches/${coach?.slug}`}>
                  <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full px-4 py-1.5 font-bold transition-all flex items-center gap-2 text-xs md:text-sm">
                    <User size={14} />
                    Voir ma page coach
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center md:items-start">
            {/* Left Column: Photo, Title, About */}
            <div className="w-full md:max-w-[280px] shrink-0 flex flex-col items-center md:items-start space-y-8">
              {/* Photo & Badges */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-[200px] md:max-w-full relative aspect-video rounded-3xl overflow-hidden border border-white/10 group"
              >
                {isEditing && editData ? (
                  <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="w-full space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 text-center">Miniature</label>
                      <MediaUploader 
                        accept="image"
                        bucket="admin-media"
                        onUpload={(url) => setEditData(prev => prev ? {...prev, thumbnail_url: url} : prev)}
                        currentMedia={editData.thumbnail_url}
                      />
                    </div>
                  </div>
                ) : (
                  <img loading="lazy" 
                    src={formation.thumbnail_url || "https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/images/default-formation.jpg"} 
                    alt={formation.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
              </motion.div>

              {/* Formation Actuelle */}
              <div className="w-full text-center md:text-left space-y-6 pt-4 border-t border-white/10">
                <div>
                  <div className="text-sm text-[var(--color-text-secondary)] uppercase tracking-widest font-bold mb-4">Formation Actuelle</div>
                  {isEditing && editData ? (
                    <input 
                      value={editData.title}
                      onChange={(e) => setEditData({...editData, title: e.target.value})}
                      className="text-3xl md:text-4xl font-display bg-white/5 border border-white/10 rounded-2xl px-4 py-2 w-full outline-none focus:border-[var(--color-accent-primary)] transition-colors text-center md:text-left"
                    />
                  ) : (
                    <h2 className="text-3xl md:text-4xl font-display leading-tight">{formation.title}</h2>
                  )}
                </div>

                <div className="flex flex-wrap justify-center md:justify-start items-center gap-6">
                  <div className="flex items-center gap-2 text-white/60">
                    <Clock size={20} className="text-[var(--color-accent-primary)]" />
                    {isEditing && editData ? (
                      <input 
                        value={editData.duration || ""}
                        onChange={(e) => setEditData({...editData, duration: e.target.value})}
                        className="text-base font-bold bg-white/5 border border-white/10 rounded-lg px-2 py-1 w-24 outline-none focus:border-[var(--color-accent-primary)]"
                      />
                    ) : (
                      <span className="text-base font-bold">{formation.duration || "—"}</span>
                    )}
                  </div>
                  {(isEditing || (formation.rating && formation.reviews_count)) && (
                    <div className="flex items-center gap-2 text-white/60">
                      <Star size={20} className="text-yellow-500 fill-yellow-500" />
                      {isEditing && editData ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={editData.rating ?? ""}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setEditData({...editData, rating: isNaN(val) ? 0 : val});
                            }}
                            className="text-base font-bold bg-white/5 border border-white/10 rounded-lg px-2 py-1 w-16 outline-none focus:border-[var(--color-accent-primary)]"
                            placeholder="Note"
                          />
                          <input
                            type="number"
                            value={editData.reviews_count ?? ""}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setEditData({...editData, reviews_count: isNaN(val) ? 0 : val});
                            }}
                            className="text-base font-bold bg-white/5 border border-white/10 rounded-lg px-2 py-1 w-20 outline-none focus:border-[var(--color-accent-primary)]"
                            placeholder="Nb avis"
                          />
                        </div>
                      ) : (
                        <span className="text-base font-bold">{formation.rating} ({formation.reviews_count} avis)</span>
                      )}
                    </div>
                  )}
                </div>

                {/* À propos de cette formation */}
                <div className="pt-6 space-y-4">
                  <h3 className="text-xl font-display text-white/90">À propos de cette formation</h3>
                  {isEditing && editData ? (
                    <textarea 
                      value={editData.description}
                      onChange={(e) => setEditData({...editData, description: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[var(--color-accent-primary)] h-32 text-center md:text-left"
                    />
                  ) : (
                    <p className="text-sm text-white/70 leading-relaxed">
                      {formation.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: What you'll learn */}
            <div className="flex-1 w-full space-y-12">

              {/* Teaser Video */}
              {isEditing ? (
                <div className="w-full aspect-video bg-white/5 border border-white/10 rounded-3xl overflow-hidden relative flex flex-col items-center justify-center">
                  <div className="absolute inset-0 z-20 flex items-center justify-center p-8 bg-black/60 backdrop-blur-md">
                    <div className="w-full space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-accent-primary)] text-center mb-4">
                        Teaser de la formation (Public)
                      </label>
                      {editData && (
                        <MediaUploader 
                          accept="video"
                          bucket="formations-videos"
                          onUpload={(url) => setEditData(prev => prev ? {...prev, trailer_url: url} : prev)}
                          currentMedia={editData.trailer_url}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ) : formation?.trailer_url ? (
                user ? (
                  <div className="w-full aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative group">
                    {trailerLoading ? (
                      <div className="w-full h-full flex items-center justify-center bg-black/40">
                        <Loader2 size={32} className="animate-spin text-[var(--color-accent-primary)]" />
                      </div>
                    ) : (
                      <VideoPlayer
                        url={trailerUrl || ''}
                        poster={formation.thumbnail_url}
                        className="w-full h-full"
                      />
                    )}
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full border border-white/10 pointer-events-none">
                      Extrait Gratuit
                    </div>
                  </div>
                ) : (
                  /* Teaser verrouillé : compte gratuit requis */
                  <div className="w-full aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
                    {formation.thumbnail_url && (
                      <img loading="lazy"
                        src={formation.thumbnail_url}
                        alt={formation.title}
                        className="w-full h-full object-cover opacity-30"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center gap-4">
                      <Lock className="text-[var(--color-accent-primary)]" size={40} />
                      <h3 className="text-xl md:text-2xl font-display">Crée ton compte gratuit pour regarder le teaser</h3>
                      <Link to={signupUrl}>
                        <Button className="bg-[var(--color-accent-primary)] hover:bg-[var(--color-violet-400)] text-white font-bold rounded-xl px-6 py-3 flex items-center gap-2">
                          <PlayCircle size={18} />
                          Créer mon compte gratuit
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              ) : null}

              {/* Ce que vous allez apprendre */}
              <div className="pt-12 border-t border-white/10">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-display">Ce que vous allez apprendre</h2>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {(isEditing && editData ? editData.bullets : longDescData.bullets)?.map((bullet: string, i: number) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0 mt-0.5">
                        <Check size={14} />
                      </div>
                      {isEditing && editData ? (
                        <div className="flex-1 flex gap-2">
                          <input 
                            value={bullet}
                            onChange={(e) => {
                              const newBullets = [...editData.bullets];
                              newBullets[i] = e.target.value;
                              setEditData({...editData, bullets: newBullets});
                            }}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white outline-none focus:border-[var(--color-accent-primary)]"
                          />
                          <button 
                            onClick={() => setEditData({...editData, bullets: editData.bullets.filter((_: any, idx: number) => idx !== i)})}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-white/80 leading-snug font-medium">{bullet}</p>
                      )}
                    </div>
                  ))}
                  {isEditing && editData && (
                    <button 
                      onClick={() => setEditData({...editData, bullets: [...editData.bullets, ""]})}
                      className="flex items-center gap-2 p-3 rounded-xl border-2 border-dashed border-white/10 text-white/40 hover:text-white hover:border-[var(--color-accent-primary)] transition-all text-sm"
                    >
                      <Plus size={16} /> Ajouter un point
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="px-6 max-w-4xl mx-auto py-24 space-y-12">
        <div className="w-full">
          {/* Video Player Section */}
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-display flex items-center gap-4">
                <PlayCircle size={32} className="text-[var(--color-accent-primary)]" />
                {activeChapter ? `Chapitre : ${activeChapter.title}` : (isEditing && editData ? editData.title : formation.title)}
              </h2>
              {activeChapter && (
                <button
                  onClick={() => { setActiveChapter(null); setChapterUrl(null); }}
                  className="text-sm font-bold text-[var(--color-text-secondary)] hover:text-white transition-colors uppercase tracking-widest"
                >
                  Retour à la vue globale
                </button>
              )}
            </div>
            
            <div className="relative aspect-video rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 bg-black group">
              {isEditing && editData ? (
                <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex items-center justify-center p-12">
                  <div className="w-full max-w-md space-y-4">
                    <label className="block text-sm font-bold uppercase tracking-widest text-white/50 text-center">Changer la vidéo de la formation (principale)</label>
                    <MediaUploader 
                      accept="video"
                      bucket="formations-videos"
                      onUpload={(url) => setEditData(prev => prev ? {...prev, trailer_url: url} : prev)}
                      currentMedia={editData.trailer_url}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {(chapterLoading || (!activeChapter && trailerLoading)) ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 size={40} className="animate-spin text-[var(--color-accent-primary)]" />
                    </div>
                  ) : (
                    <VideoPlayer
                      url={activeChapter ? (chapterUrl || '') : (trailerUrl || '')}
                      poster={formation.thumbnail_url}
                      className="w-full h-full"
                    />
                  )}
                  {!user && (
                    <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                      <Lock className="text-[var(--color-accent-primary)] mb-4" size={48} />
                      <h3 className="text-2xl font-display mb-2">Contenu verrouillé</h3>
                      <p className="text-white/70 mb-6 max-w-sm">Crée ton compte gratuit pour regarder le teaser de cette formation.</p>
                      <Link to={signupUrl}>
                        <Button className="bg-[var(--color-accent-primary)] hover:bg-[var(--color-violet-400)] text-white font-bold rounded-xl px-6 py-3">
                          Créer mon compte gratuit
                        </Button>
                      </Link>
                    </div>
                  )}
                  {user && !hasPurchased && !canEdit && (
                    <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                      <Lock className="text-[var(--color-accent-primary)] mb-4" size={48} />
                      <h3 className="text-2xl font-display mb-2">Contenu verrouillé</h3>
                      <p className="text-white/70 mb-6 max-w-sm">Achetez la formation ou entrez votre code d'accès pour débloquer les chapitres.</p>
                      <form onSubmit={handleCodeSubmit} className="flex gap-2 w-full max-w-xs">
                        <input
                          type="text"
                          placeholder="Entrez votre code"
                          value={enteredCode}
                          onChange={(e) => setEnteredCode(e.target.value)}
                          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-accent-primary)]"
                        />
                        <Button type="submit" disabled={redeeming} className="bg-[var(--color-accent-primary)] hover:bg-[var(--color-violet-400)] disabled:opacity-50">
                          {redeeming ? <Loader2 size={18} className="animate-spin" /> : "Débloquer"}
                        </Button>
                      </form>
                      {codeError && <p className="text-red-500 mt-2 text-sm">Code incorrect</p>}
                    </div>
                  )}
                </>
              )}
            </div>

            {activeChapter && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-6">
                <h3 className="text-xl font-display mb-2">{activeChapter.title}</h3>
                <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{activeChapter.description}</p>
              </div>
            )}
          </section>
        </div>

        {/* Chapters Section */}
        <div className="w-full">
          <div className="bg-[var(--color-bg-surface)] border border-white/5 rounded-[3rem] p-10 shadow-2xl">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-display">Programme</h3>
              <div className="flex items-center gap-3">
                <Badge color="gray" className="bg-white/5 border-white/10 text-white/50">{(isEditing && editData ? editChapters : chapters).length} chapitres</Badge>
                {isEditing && editData && (
                  <button 
                    onClick={addChapter}
                    className="p-2 bg-[var(--color-accent-primary)]/20 text-[var(--color-accent-primary)] rounded-xl hover:bg-[var(--color-accent-primary)]/30 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {(isEditing && editData ? editChapters : chapters).map((ch: any, idx: number) => {
                const isActive = activeChapter?.id === ch.id;

                if (isEditing && editData) {
                  return (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 relative group">
                      <button 
                        onClick={() => removeChapter(idx)}
                        className="absolute top-4 right-4 text-white/20 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      
                      <div className="space-y-4">
                        <input 
                          value={ch.title}
                          onChange={(e) => updateChapter(idx, 'title', e.target.value)}
                          placeholder="Titre du chapitre"
                          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-accent-primary)]"
                        />
                        <div className="flex flex-wrap gap-2 items-center text-sm">
                          <input 
                            value={ch.timestamp || "00:00-00:00"}
                            onChange={(e) => updateChapter(idx, 'timestamp', e.target.value)}
                            placeholder="00:00-00:00"
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-accent-primary)]"
                          />
                        </div>
                        <textarea 
                          value={ch.description || ""}
                          onChange={(e) => updateChapter(idx, 'description', e.target.value)}
                          placeholder="Description..."
                          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[var(--color-accent-primary)] h-24"
                        />
                        <div className="space-y-2">
                          <label className="text-xs text-white/50 uppercase tracking-widest font-bold">Vidéo du chapitre</label>
                          <MediaUploader 
                            accept="video"
                            bucket="formations-videos"
                            onUpload={(url) => updateChapter(idx, 'video_url', url)}
                            currentMedia={ch.video_url}
                          />
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={ch.id}
                    onClick={() => openChapter(ch)}
                    className={`w-full flex items-center gap-5 p-5 rounded-[1.5rem] transition-all text-left border group ${
                      isActive 
                        ? "bg-[var(--color-accent-primary)]/10 border-[var(--color-accent-primary)]/30 text-white" 
                        : "bg-white/[0.02] border-transparent hover:bg-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                      isActive ? "bg-[var(--color-accent-primary)] text-white" : "bg-black/40 text-[var(--color-text-secondary)] group-hover:text-white"
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-base font-bold truncate ${isActive ? "text-white" : "text-[var(--color-text-secondary)] group-hover:text-white"}`}>
                        {ch.title}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-widest font-black">
                          {ch.timestamp || "00:00-00:00"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Price Section at the bottom */}
      {!hasPurchased && (
        <section className="px-6 max-w-7xl mx-auto py-12 md:py-16 border-t border-white/5">
          <div className="bg-gradient-to-br from-[var(--color-bg-surface)] to-[var(--color-bg-base)] border border-[var(--color-accent-primary)]/30 rounded-[2rem] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_0_50px_rgba(123,47,255,0.1)]">
            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-display mb-2">Prêt à passer au niveau supérieur ?</h2>
              <p className="text-base text-[var(--color-text-secondary)] max-w-lg">
                Débloquez l'accès complet à cette formation et apprenez les techniques des meilleurs coachs MMA.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 text-center min-w-[250px] w-full md:w-auto">
              <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-widest font-bold mb-2">Prix de la formation</div>
              <div className="text-4xl font-display mb-6 text-white">
                {isEditing && editData ? (
                  <div className="flex items-center justify-center gap-2">
                    <input 
                      type="number"
                      value={editData.price_cents / 100}
                      onChange={(e) => setEditData({...editData, price_cents: Math.round(parseFloat(e.target.value) * 100)})}
                      className="w-24 bg-white/5 border border-white/10 rounded-xl px-2 py-1 text-3xl outline-none text-center"
                    />
                    <span>€</span>
                  </div>
                ) : `${(formation.price_cents / 100).toFixed(2)} €`}
              </div>
              {!canEdit && (
                <div className="space-y-4">
                  <Button 
                    onClick={handlePurchase}
                    className="w-full py-4 rounded-xl bg-[var(--color-accent-primary)] hover:bg-[var(--color-violet-400)] text-white font-bold text-base shadow-[0_10px_20px_-10px_rgba(123,47,255,0.5)] transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={18} />
                    Acheter maintenant
                  </Button>
                  
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-[var(--color-text-secondary)] mb-3">Vous avez un code d'accès ?</p>
                    <form onSubmit={handleCodeSubmit} className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Entrez votre code"
                        value={enteredCode}
                        onChange={(e) => setEnteredCode(e.target.value)}
                        className={`flex-1 bg-[var(--color-bg-base)] border rounded-lg px-3 py-2 text-sm outline-none transition-colors ${codeError ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-[var(--color-accent-primary)]'}`}
                      />
                      <button type="submit" disabled={redeeming} className="border border-white/20 hover:bg-white/10 text-xs px-3 rounded-lg text-white font-semibold transition-colors disabled:opacity-50">
                        {redeeming ? "..." : "Valider"}
                      </button>
                    </form>
                    {codeError && <p className="text-red-500 text-xs mt-2 text-left">Code invalide. Veuillez réessayer.</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Modale d'échec d'achat (placeholder ou erreur réelle) */}
      <AnimatePresence>
        {purchaseModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPurchaseModal(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-[var(--color-bg-surface)] border border-[var(--color-accent-primary)]/30 rounded-[3rem] p-12 max-w-lg w-full text-center shadow-[0_0_100px_rgba(123,47,255,0.3)]"
            >
              <div className="w-24 h-24 bg-[var(--color-accent-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-8 text-[var(--color-accent-primary)]">
                <AlertCircle size={48} />
              </div>
              {purchaseModal === 'unconfigured' ? (
                <>
                  <h3 className="text-3xl font-display mb-6">Paiement bientôt disponible</h3>
                  <p className="text-lg text-[var(--color-text-secondary)] mb-10 leading-relaxed">
                    Nous finalisons actuellement notre système de paiement sécurisé.
                    Revenez très bientôt pour débloquer vos formations <span className="font-days-one tracking-normal">MMA IQ</span>!
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-3xl font-display mb-6">Paiement momentanément indisponible</h3>
                  <p className="text-lg text-[var(--color-text-secondary)] mb-10 leading-relaxed">
                    Réessaie dans un instant.
                  </p>
                </>
              )}
              <Button
                onClick={() => setPurchaseModal(null)}
                className="w-full py-5 rounded-2xl bg-[var(--color-accent-primary)] hover:bg-[var(--color-violet-400)] font-bold text-lg"
              >
                Compris !
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
