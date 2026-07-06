import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Trash2, Sparkles, Loader2, Save } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { showToast } from "../../utils/ui";
import { MediaUploader } from "./MediaUploader";
import { GoogleGenAI } from "@google/genai";

interface Chapter {
  id?: string | number;
  title: string;
  timestamp: string;
  description: string;
  video_url?: string;
  sort_order: number;
}

interface FormationModalProps {
  isOpen: boolean;
  onClose: () => void;
  formation?: any; // If provided, we're editing
  onSuccess: () => void;
  preSelectedCoachId?: string;
}

export function FormationModal({ isOpen, onClose, formation, onSuccess, preSelectedCoachId }: FormationModalProps) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [coaches, setCoaches] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    coach_id: preSelectedCoachId || "",
    level: "debutant",
    discipline: "striking",
    short_description: "",
    long_description: "",
    price: 0,
    trailer_url: "",
    thumbnail_url: "",
    bullets: [] as string[],
    duration_hours: 0,
    duration_minutes: 0,
    rating: 0,
    reviews_count: 0
  });

  const [chapters, setChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadCoaches();
      if (formation) {
        // Parse duration string (e.g., "270m")
        let hours = 0;
        let minutes = 0;
        if (formation.duration) {
          const totalMinutes = parseInt(formation.duration);
          if (!isNaN(totalMinutes)) {
            hours = Math.floor(totalMinutes / 60);
            minutes = totalMinutes % 60;
          }
        }

        setFormData({
          title: formation.title || "",
          coach_id: formation.coach_id || preSelectedCoachId || "",
          level: formation.level || "debutant",
          discipline: formation.discipline || "striking",
          short_description: formation.description || "",
          long_description: typeof formation.long_description === 'string' && formation.long_description.startsWith('{') 
            ? (JSON.parse(formation.long_description) || {}).content || "" 
            : formation.long_description || "",
          price: (formation.price_cents || 0) / 100,
          trailer_url: formation.trailer_url || "",
          thumbnail_url: formation.thumbnail_url || "",
          bullets: typeof formation.long_description === 'string' && formation.long_description.startsWith('{')
            ? (JSON.parse(formation.long_description) || {}).bullets || []
            : [],
          duration_hours: hours,
          duration_minutes: minutes,
          rating: formation.rating || 0,
          reviews_count: formation.reviews_count || 0
        });
        loadChapters(formation.id);
      } else {
        // Reset for new formation
        setFormData({
          title: "",
          coach_id: preSelectedCoachId || "",
          level: "debutant",
          discipline: "striking",
          short_description: "",
          long_description: "",
          price: 0,
          trailer_url: "",
          thumbnail_url: "",
          bullets: [],
          duration_hours: 0,
          duration_minutes: 0,
          rating: 0,
          reviews_count: 0
        });
        setChapters([]);
      }
    }
  }, [isOpen, formation, preSelectedCoachId]);

  const loadCoaches = async () => {
    const { data, error } = await supabase.from('coaches').select('id, name').order('name');
    if (data) setCoaches(data);
    if (error) console.error("Error loading coaches:", error);
  };

  const loadChapters = async (formationId: string | number) => {
    const { data, error } = await supabase
      .from('formation_chapters')
      .select('*')
      .eq('formation_id', formationId)
      .order('sort_order');
    if (data) setChapters(data);
    if (error) console.error("Error loading chapters:", error);
  };

  const handleAddChapter = () => {
    setChapters([...chapters, { title: "", timestamp: "00:00", description: "", video_url: "", sort_order: chapters.length }]);
  };

  const handleRemoveChapter = (index: number) => {
    setChapters(chapters.filter((_, i) => i !== index));
  };

  const handleChapterChange = (index: number, field: keyof Chapter, value: string | number) => {
    setChapters(prev => {
      const newChapters = [...prev];
      newChapters[index] = { ...newChapters[index], [field]: value };
      return newChapters;
    });
  };

  const handleAddBullet = () => {
    setFormData({ ...formData, bullets: [...formData.bullets, ""] });
  };

  const handleRemoveBullet = (index: number) => {
    setFormData({ ...formData, bullets: formData.bullets.filter((_, i) => i !== index) });
  };

  const handleBulletChange = (index: number, value: string) => {
    const newBullets = [...formData.bullets];
    newBullets[index] = value;
    setFormData({ ...formData, bullets: newBullets });
  };

  const generateBullets = async () => {
    if (!formData.title || !formData.short_description) {
      alert("Veuillez remplir le titre et la description courte pour générer des points clés.");
      return;
    }

    setGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Génère 5 points clés (bullet points) courts et percutants pour une formation de MMA intitulée "${formData.title}" avec cette description: "${formData.short_description}". Réponds uniquement avec une liste JSON de chaînes de caractères.`,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text);
      if (Array.isArray(result)) {
        setFormData({ ...formData, bullets: result });
      }
    } catch (error) {
      console.error("Error generating bullets:", error);
      // Fallback
      setFormData({ ...formData, bullets: ["Apprendre les bases", "Maîtriser les techniques avancées", "Améliorer sa condition physique"] });
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const slug = formData.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      
      const formationPayload = {
        title: formData.title,
        slug,
        coach_id: formData.coach_id,
        level: formData.level,
        discipline: formData.discipline,
        description: formData.short_description,
        long_description: JSON.stringify({
          content: formData.long_description,
          bullets: formData.bullets
        }),
        price_cents: Math.round(formData.price * 100),
        trailer_url: formData.trailer_url,
        thumbnail_url: formData.thumbnail_url,
        published: true,
        duration: (formData.duration_hours * 60) + formData.duration_minutes + "m",
        rating: formData.rating,
        reviews_count: formData.reviews_count
      };

      let formationId = formation?.id;

      if (formationId) {
        const { error } = await supabase.from('formations').update(formationPayload).eq('id', formationId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('formations').insert(formationPayload).select().single();
        if (error) throw error;
        formationId = data.id;
      }

      // Handle Chapters
      // Delete existing chapters if editing
      if (formation?.id) {
        await supabase.from('formation_chapters').delete().eq('formation_id', formationId);
      }

      if (chapters.length > 0) {
        const chaptersPayload = chapters.map((ch, idx) => ({
          formation_id: formationId,
          title: ch.title,
          description: ch.description,
          timestamp: ch.timestamp || "00:00-00:00",
          video_url: ch.video_url || "",
          sort_order: idx,
          chapter_number: idx + 1
        }));
        const { error: chError } = await supabase.from('formation_chapters').insert(chaptersPayload);
        if (chError) throw chError;
      }

      showToast(formation ? "Formation mise à jour !" : "Formation créée !");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving formation:", error);
      console.error("Error details:", error.details);
      console.error("Error hint:", error.hint);
      alert("Erreur lors de l'enregistrement: " + (error.message || JSON.stringify(error)));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#1a1a1a] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-white/10 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-display text-white">
            {formation ? "Modifier la formation" : "Ajouter une formation"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-white/50" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white/50 uppercase tracking-wider">Titre</label>
              <input 
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--color-accent-red)] outline-none transition-colors"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Maîtriser le Leg Lock"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white/50 uppercase tracking-wider">Coach</label>
              <select 
                required
                disabled={!!preSelectedCoachId}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--color-accent-red)] outline-none transition-colors disabled:opacity-50"
                value={formData.coach_id}
                onChange={(e) => setFormData({ ...formData, coach_id: e.target.value })}
              >
                <option value="" disabled className="bg-[#1a1a1a]">Sélectionner un coach</option>
                {coaches.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#1a1a1a]">{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white/50 uppercase tracking-wider">Durée</label>
              <div className="flex gap-2">
                <input 
                  type="number"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--color-accent-red)] outline-none transition-colors"
                  value={formData.duration_hours || ""}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setFormData({ ...formData, duration_hours: isNaN(val) ? 0 : val });
                  }}
                  placeholder="Heures"
                />
                <input 
                  type="number"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--color-accent-red)] outline-none transition-colors"
                  value={formData.duration_minutes || ""}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setFormData({ ...formData, duration_minutes: isNaN(val) ? 0 : val });
                  }}
                  placeholder="Minutes"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white/50 uppercase tracking-wider">Note (0-5)</label>
              <input 
                type="number"
                step="0.1"
                min="0"
                max="5"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--color-accent-red)] outline-none transition-colors"
                value={formData.rating ?? ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setFormData({ ...formData, rating: isNaN(val) ? 0 : val });
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white/50 uppercase tracking-wider">Nombre d'avis</label>
              <input 
                type="number"
                min="0"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--color-accent-red)] outline-none transition-colors"
                value={formData.reviews_count ?? ""}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setFormData({ ...formData, reviews_count: isNaN(val) ? 0 : val });
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white/50 uppercase tracking-wider">Niveau</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--color-accent-red)] outline-none transition-colors"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              >
                <option value="debutant" className="bg-[#1a1a1a]">Débutant</option>
                <option value="amateur" className="bg-[#1a1a1a]">Amateur</option>
                <option value="pro" className="bg-[#1a1a1a]">Pro</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white/50 uppercase tracking-wider">Discipline</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--color-accent-red)] outline-none transition-colors"
                value={formData.discipline}
                onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
              >
                <option value="striking" className="bg-[#1a1a1a]">Striking</option>
                <option value="grappling" className="bg-[#1a1a1a]">Grappling</option>
                <option value="mma-gameplan" className="bg-[#1a1a1a]">MMA Gameplan</option>
                <option value="prepa-mentale" className="bg-[#1a1a1a]">Prépa Mentale</option>
                <option value="cut-nutrition" className="bg-[#1a1a1a]">Cut & Nutrition</option>
                <option value="conditioning" className="bg-[#1a1a1a]">Conditioning</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white/50 uppercase tracking-wider">Prix (€)</label>
              <input 
                type="number"
                step="0.01"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--color-accent-red)] outline-none transition-colors"
                value={formData.price ?? ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setFormData({ ...formData, price: isNaN(val) ? 0 : val });
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/50 uppercase tracking-wider">Description Courte</label>
            <textarea 
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--color-accent-red)] outline-none transition-colors h-24"
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              placeholder="Résumé rapide de la formation..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/50 uppercase tracking-wider">Description Longue</label>
            <textarea 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--color-accent-red)] outline-none transition-colors h-48"
              value={formData.long_description}
              onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
              placeholder="Détails complets de la formation..."
            />
          </div>

          {/* Media */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-sm font-semibold text-white/50 uppercase tracking-wider">Thumbnail (Image)</label>
              <MediaUploader 
                accept="image"
                bucket="admin-media"
                onUpload={(url) => setFormData(prev => ({ ...prev, thumbnail_url: url }))}
                currentMedia={formData.thumbnail_url}
              />
            </div>
            <div className="space-y-4">
              <label className="text-sm font-semibold text-white/50 uppercase tracking-wider">Vidéo Principale (Trailer)</label>
              <MediaUploader 
                accept="video"
                bucket="formations-videos"
                onUpload={(url) => setFormData(prev => ({ ...prev, trailer_url: url }))}
                currentMedia={formData.trailer_url}
              />
            </div>
          </div>

          {/* Bullet Points */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-white/50 uppercase tracking-wider">Ce que vous allez apprendre</label>
              <button 
                type="button"
                onClick={generateBullets}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-xl text-sm font-semibold transition-all border border-purple-600/30 disabled:opacity-50"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Générer automatiquement
              </button>
            </div>
            <div className="space-y-3">
              {formData.bullets.map((bullet, idx) => (
                <div key={idx} className="flex gap-3">
                  <input 
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-[var(--color-accent-red)] outline-none transition-colors"
                    value={bullet}
                    onChange={(e) => handleBulletChange(idx, e.target.value)}
                    placeholder="Ex: Maîtriser les sorties de garde"
                  />
                  <button 
                    type="button"
                    onClick={() => handleRemoveBullet(idx)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button 
                type="button"
                onClick={handleAddBullet}
                className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" /> Ajouter manuellement
              </button>
            </div>
          </div>

          {/* Chapters */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-white/50 uppercase tracking-wider">Chapitres</label>
              <button 
                type="button"
                onClick={handleAddChapter}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-all border border-white/10"
              >
                <Plus className="w-4 h-4" /> Ajouter un chapitre
              </button>
            </div>
            <div className="space-y-4">
              {chapters.map((chapter, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 relative">
                  <button 
                    type="button"
                    onClick={() => handleRemoveChapter(idx)}
                    className="absolute top-4 right-4 p-2 text-white/20 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-semibold text-white/30 uppercase">Titre du chapitre</label>
                      <input 
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white outline-none"
                        value={chapter.title}
                        onChange={(e) => handleChapterChange(idx, 'title', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-white/30 uppercase">Timestamp (MM:SS)</label>
                      <input 
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white outline-none"
                        value={chapter.timestamp}
                        onChange={(e) => handleChapterChange(idx, 'timestamp', e.target.value)}
                        placeholder="00:00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/30 uppercase">Description courte</label>
                    <input 
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white outline-none"
                      value={chapter.description}
                      onChange={(e) => handleChapterChange(idx, 'description', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/30 uppercase">Vidéo du chapitre</label>
                    <MediaUploader 
                      accept="video"
                      bucket="formations-videos"
                      onUpload={(url) => handleChapterChange(idx, 'video_url', url)}
                      currentMedia={chapter.video_url}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-8 border-t border-white/10 flex justify-end gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-semibold transition-all"
            >
              Annuler
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-[var(--color-accent-red)] to-[#ff4d5e] text-white rounded-2xl font-semibold shadow-[0_10px_20px_-5px_rgba(230,41,58,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {formation ? "Enregistrer les modifications" : "Créer la formation"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
