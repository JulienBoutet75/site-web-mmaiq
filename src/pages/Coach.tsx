import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Play, Clock, Pencil, Plus, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { showToast } from "../utils/ui";
import { supabase } from "../lib/supabase";
import { Badge } from "../components/ui/Badge";
import { MediaUploader } from "../components/admin/MediaUploader";
import { FormationModal } from "../components/admin/FormationModal";

export function Coach() {
  const navigate = useNavigate();
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

  const canEdit = isAdmin || (coachSession?.coachId === coachData?.id) || (profile?.role === 'coach' && profile?.id === coachData?.profile_id);

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
      <div className="bg-[#04050A] text-white min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-accent-red)]"></div>
      </div>
    );
  }

  if (!coachData) {
    return (
      <div className="bg-[#04050A] text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-display mb-4">Coach introuvable</h1>
          <Link to="/instructional" className="text-[var(--color-accent-red)] hover:underline">
            Retour à l'Academy
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#04050A] text-white pt-32 pb-24 min-h-screen selection:bg-[var(--color-accent-red)] selection:text-white relative">
      {/* Admin Toolbar */}
      {canEdit && (
        <div className="fixed top-24 left-0 right-0 z-[60] px-6">
          <div className="max-w-7xl mx-auto flex justify-end gap-4">
            {isEditing ? (
              <>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 font-ui font-semibold flex items-center gap-2 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-ui font-bold flex items-center gap-2 transition-colors"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </>
            ) : (
              <button 
                onClick={startEditing}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 font-ui font-bold flex items-center gap-2 transition-colors backdrop-blur-md"
              >
                <Pencil size={16} /> Modifier ce profil
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Formation Modal */}
      {canEdit && coachData && (
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

      {/* Back Link */}
      <div className="px-6 max-w-7xl mx-auto mb-10 md:mb-16 relative z-10">
        <Link to="/instructional" className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-white transition-colors font-ui text-sm font-semibold group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Retour à l'Academy
        </Link>
      </div>

      {/* Profile Header */}
      <section className="px-6 max-w-7xl mx-auto mb-24 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
          {/* Coach Photo */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-[320px] mx-auto lg:mx-0 lg:w-[400px] shrink-0"
          >
            <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-white/10 group bg-[#0C0E18] shadow-[0_0_50px_rgba(255,23,68,0.1)]">
              <img 
                src={isEditing && editData ? editData.photo_url : coachData.photo_url} 
                alt={coachData.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#04050A] via-transparent to-transparent opacity-80 z-10"></div>
              
              {isEditing && editData && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-6 z-30">
                  <MediaUploader 
                    label="Changer photo (4:5)" 
                    accept="image" 
                    bucket="admin-media"
                    onUpload={(url) => setEditData((prev: any) => prev ? {...prev, photo_url: url} : prev)} 
                    currentMedia={editData.photo_url || undefined} 
                    uploadedBy="admin" 
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* Coach Details */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="flex-1 space-y-8 w-full text-center lg:text-left mt-4 lg:mt-0"
          >
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-center lg:justify-start gap-4 mb-2">
                <Badge color="red" className="bg-[var(--color-accent-red)]/10 border-[var(--color-accent-red)]/20 text-[var(--color-accent-red)] uppercase tracking-widest px-4 py-1.5 font-bold text-xs">Expert Coach</Badge>
                {(coachSession?.coachId === coachData.id || (profile?.role === 'coach' && profile?.id === coachData.profile_id)) && (
                  <Link 
                    to="/coach" 
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all font-ui text-xs font-semibold"
                  >
                    Tableau de bord
                  </Link>
                )}
              </div>
              
              {isEditing && editData ? (
                <input 
                  value={editData.name}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  className="text-5xl md:text-7xl font-display leading-[0.9] tracking-tight bg-white/5 border border-white/10 rounded-xl px-4 py-2 w-full outline-none focus:border-[var(--color-accent-red)] text-white text-center lg:text-left"
                />
              ) : (
                <h1 className="text-5xl md:text-7xl font-display leading-[0.9] tracking-tight text-white mb-2">
                  {coachData.name}
                </h1>
              )}
              
              {isEditing && editData ? (
                <input 
                  value={editData.tagline}
                  onChange={(e) => setEditData({...editData, tagline: e.target.value})}
                  className="text-xl md:text-2xl text-[var(--color-text-secondary)] font-body font-medium bg-white/5 border border-white/10 rounded-xl px-4 py-2 w-full outline-none focus:border-[var(--color-accent-red)] text-center lg:text-left"
                />
              ) : (
                <p className="text-xl md:text-2xl text-[var(--color-text-secondary)] font-body font-medium">
                  {coachData.tagline}
                </p>
              )}
            </div>

            {/* Specialties */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              {isEditing && editData ? (
                <input 
                  value={editData.specialties.join(', ')}
                  onChange={(e) => setEditData({...editData, specialties: e.target.value.split(',').map((s: string) => s.trim())})}
                  placeholder="Spécialités (séparées par des virgules)"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-ui text-white outline-none focus:border-[var(--color-accent-red)] w-full text-center lg:text-left"
                />
              ) : (
                coachData.specialties?.map((spec: string, i: number) => (
                  <span key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-ui font-semibold text-white/80 tracking-wide">
                    {spec}
                  </span>
                ))
              )}
            </div>

            {/* Video Presentation */}
            {(!isEditing || (isEditing && editData)) && (coachData.presentation_video_url || isEditing) && (
              <div className="pt-2">
                {isEditing && editData ? (
                  <input 
                    value={editData.presentation_video_url || ''}
                    onChange={(e) => setEditData({...editData, presentation_video_url: e.target.value})}
                    placeholder="Url de la vidéo de présentation (ex: Youtube, Vimeo)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-ui outline-none focus:border-[var(--color-accent-red)] text-center lg:text-left"
                  />
                ) : coachData.presentation_video_url ? (
                  <a 
                    href={coachData.presentation_video_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 bg-[var(--color-accent-red)] hover:bg-[#ff4d5e] text-white px-6 py-3 rounded-full font-ui font-bold transition-all shadow-[0_0_20px_rgba(255,23,68,0.3)] hover:shadow-[0_0_30px_rgba(255,23,68,0.5)] hover:-translate-y-0.5"
                  >
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <Play className="w-3 h-3 text-white ml-0.5" fill="currentColor" />
                    </div>
                    Voir la présentation vidéo
                  </a>
                ) : null}
              </div>
            )}

            {/* Bio */}
            <div className="prose prose-invert max-w-none pt-4">
              {isEditing && editData ? (
                <textarea 
                  value={editData.bio}
                  onChange={(e) => setEditData({...editData, bio: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-base md:text-lg text-white/80 outline-none focus:border-[var(--color-accent-red)] h-48 font-body leading-relaxed text-center lg:text-left"
                />
              ) : (
                <p className="text-base md:text-lg text-white/80 leading-relaxed font-body whitespace-pre-wrap text-left">
                  {coachData.bio}
                </p>
              )}
            </div>
            
          </motion.div>
        </div>
      </section>

      {/* Formations Section */}
      <section className="px-6 py-16 bg-[#04050A] relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
            <h2 className="text-3xl md:text-4xl font-display text-white">Ses Formations</h2>
            
            <div className="hidden md:block h-px flex-grow mx-8 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            
            {canEdit && (
              <button 
                onClick={() => setIsFormationModalOpen(true)}
                className="shrink-0 flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-xl transition-colors font-ui text-sm font-semibold"
              >
                <Plus size={16} /> Ajouter une formation
              </button>
            )}
          </div>

          {coachCourses.length > 0 ? (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {coachCourses.map((course: any, i: number) => (
                  <motion.div
                    key={course.id || i}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.4 }}
                    className="relative group flex flex-col h-full bg-white/[0.04] border border-white/[0.05] rounded-3xl overflow-hidden hover:border-[var(--color-accent-red)]/40 hover:-translate-y-2 transition-all duration-300"
                  >
                    {canEdit && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingCourse(course);
                          setIsFormationModalOpen(true);
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
                      <div className="aspect-video bg-[#12152A] relative overflow-hidden shrink-0">
                        <img 
                          src={course.thumbnail_url || "https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/images/default-formation.jpg"}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0E18] via-[#0C0E18]/20 to-transparent"></div>
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500 z-10"></div>
                        
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
                          <div className="w-16 h-16 rounded-full bg-[var(--color-accent-red)] flex items-center justify-center backdrop-blur-md shadow-[0_0_40px_rgba(255,23,68,0.6)] transform scale-75 group-hover:scale-100 transition-transform duration-500">
                            <Play className="w-6 h-6 ml-1 text-white" fill="currentColor" />
                          </div>
                        </div>

                        <div className="absolute top-4 left-4 z-20">
                          <Badge
                            color={course.level === "Débutant" ? "green" : course.level === "Amateur" ? "purple" : "red"}
                            className="bg-black/80 backdrop-blur-md border-white/5 font-bold tracking-widest text-[10px]"
                          >
                            {course.level}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="p-6 flex flex-col flex-grow relative">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex items-center gap-2 relative z-30">
                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                              <img src={coachData.photo_url || coachData.image} alt={coachData.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <span className="font-ui text-xs md:text-sm font-semibold text-white/90">{coachData.name}</span>
                          </div>
                          
                          <span className="text-white/30 text-xs">•</span>
                          
                          <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)] text-xs md:text-sm font-ui">
                            <Clock size={14} /> {course.duration || "N/A"}
                          </div>
                        </div>

                        <h3 className="font-display text-xl md:text-2xl mb-3 text-white group-hover:text-[var(--color-accent-red)] transition-colors line-clamp-2 leading-tight">
                          {course.title}
                        </h3>
                        
                        <p className="font-body text-[var(--color-text-secondary)] text-sm md:text-base mb-5 flex-grow line-clamp-1 leading-relaxed">
                          {course.short_description || course.description || course.desc}
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
                            <span className="font-display text-2xl text-white">{course.price}€</span>
                            
                            <div className="flex items-center gap-2">
                              <button className="hidden sm:block bg-white/[0.05] hover:bg-white/[0.1] text-white font-ui font-semibold py-2.5 px-4 rounded-xl transition-colors border border-white/10 text-xs md:text-sm text-center">
                                Voir le teaser
                              </button>
                              <button className="bg-[var(--color-accent-red)] hover:bg-[#ff4d5e] text-white font-ui font-bold py-2.5 px-4 md:px-5 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs md:text-sm shadow-[0_0_15px_rgba(255,23,68,0.2)]">
                                Découvrir <ArrowRight size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-16 md:p-20 text-center">
              <p className="text-xl md:text-2xl text-[var(--color-text-secondary)] font-display mb-4">Aucune formation disponible pour le moment.</p>
              {canEdit && (
                <button 
                  onClick={() => setIsFormationModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-accent-red)] hover:bg-[#ff4d5e] text-white font-ui font-semibold transition-all shadow-lg"
                >
                  <Plus size={18} /> Créer la première formation
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="px-6 max-w-4xl mx-auto text-center py-16">
        <Link 
          to="/instructional" 
          className="inline-flex items-center text-white font-ui text-sm md:text-base font-semibold bg-white/5 border border-white/10 px-8 py-4 rounded-full hover:bg-[var(--color-accent-red)] hover:border-[var(--color-accent-red)] transition-all duration-300 shadow-sm hover:shadow-[0_0_30px_rgba(255,23,68,0.3)] hover:-translate-y-1"
        >
          Découvrir tous les instructionals <ArrowRight className="ml-3 w-5 h-5" />
        </Link>
      </section>
    </div>
  );
}
