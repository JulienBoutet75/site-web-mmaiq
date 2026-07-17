import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Clock, GraduationCap, Play } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

// Libellés capitalisés des niveaux (stockés en minuscules en base)
const levelLabels: Record<string, string> = {
  debutant: "Débutant",
  amateur: "Amateur",
  pro: "Pro"
};

// Espace « Mes formations » : liste les instructionals débloqués sur le compte
// connecté (achats Stripe ou codes d'accès). Les visiteurs non connectés sont
// renvoyés vers /connexion avec un retour automatique ici après connexion.
export function MesFormations() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [formations, setFormations] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(false);
      try {
        // 1) Achats complétés du compte (la RLS « own purchases » limite déjà
        // la lecture aux lignes de l'utilisateur, le filtre explicite est une ceinture).
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
          }
          return;
        }

        // 2) Formations correspondantes — requête séparée plutôt qu'une jointure
        // embed : la relation FK purchases→formations n'est pas garantie côté schéma.
        const { data: rows, error: fErr } = await supabase
          .from("formations")
          .select("*")
          .in("id", ids);
        if (fErr) throw new Error(fErr.message);

        // On préserve l'ordre d'achat (le plus récent en premier).
        const byId = new Map((rows || []).map((f: any) => [f.id, f]));
        const ordered = ids.map((id) => byId.get(id)).filter(Boolean);

        // Coachs pour l'affichage des cartes (facultatif : la carte reste valide sans).
        const coachIds = [...new Set(ordered.map((f: any) => f.coach_id).filter(Boolean))];
        let coachRows: any[] = [];
        if (coachIds.length > 0) {
          const { data: cData } = await supabase
            .from("coaches")
            .select("id, name, slug, photo_url")
            .in("id", coachIds);
          coachRows = cData || [];
        }

        if (!cancelled) {
          setFormations(ordered);
          setCoaches(coachRows);
        }
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

  // Session en cours de résolution : spinner sobre (même style que PageLoader).
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-[var(--color-accent-primary)] animate-spin"></div>
      </div>
    );
  }

  // Pas de compte connecté : direction la connexion, avec retour ici après.
  if (!user) {
    return <Navigate to="/connexion?redirect=/mes-formations" replace />;
  }

  return (
    <div className="bg-[var(--color-bg-base)] text-white selection:bg-[var(--color-accent-red)] selection:text-white min-h-screen font-body">
      {/* En-tête */}
      <section className="px-6 pt-32 md:pt-40 pb-10 md:pb-14 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          >
            <Badge color="red" className="mb-6 bg-[var(--color-bg-elevated)] border border-[var(--color-accent-red)]/30 text-white tracking-[0.2em] px-4 py-2 text-xs">
              MMA IQ ACADEMY
            </Badge>
            <h1 className="font-display text-4xl md:text-6xl text-white mb-4 tracking-tight">
              Mes formations
            </h1>
            <p className="font-body text-base md:text-lg text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
              Retrouve ici tous les instructionals débloqués sur ton compte, accessibles en illimité.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Grille des formations */}
      <section className="px-6 py-12 md:py-16 min-h-[50vh]">
        <div className="max-w-7xl mx-auto">
          {loading && (
            <div className="flex items-center justify-center py-32">
              <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-[var(--color-accent-primary)] animate-spin"></div>
            </div>
          )}

          {!loading && loadError && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32">
              <p className="font-display text-2xl text-white mb-2">Impossible de charger tes formations.</p>
              <p className="font-body text-[var(--color-text-secondary)]">Réessaie dans un instant — si le problème persiste, contacte-nous.</p>
            </motion.div>
          )}

          {!loading && !loadError && formations.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24 md:py-32 flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-[var(--color-accent-red)]">
                <GraduationCap size={28} />
              </div>
              <p className="font-display text-2xl md:text-3xl text-white mb-3">Tu n'as pas encore de formation</p>
              <p className="font-body text-[var(--color-text-secondary)] mb-8 max-w-md">
                Explore le catalogue : des instructionals ciblés, à l'essentiel, par des coachs qui savent transmettre.
              </p>
              <Link
                to="/instructional"
                className="bg-[var(--color-accent-red)] hover:opacity-90 text-white font-ui font-semibold py-4 px-8 rounded-full transition-all duration-300 shadow-xl flex items-center justify-center gap-2"
              >
                Découvrir le catalogue <ArrowRight size={18} />
              </Link>
            </motion.div>
          )}

          {!loading && !loadError && formations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {formations.map((formation: any, i: number) => {
                const coach = coaches.find((c: any) => c.id === formation.coach_id);
                const coursePath = `/course/${formation.slug || formation.id}`;
                return (
                  <motion.div
                    key={formation.id || i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="relative group flex flex-col h-full bg-white/[0.04] border border-white/[0.05] rounded-3xl overflow-hidden hover:border-[var(--color-accent-red)]/40 hover:-translate-y-2 transition-all duration-300"
                  >
                    <div
                      onClick={() => navigate(coursePath)}
                      className="cursor-pointer flex flex-col h-full"
                    >
                      <div className="aspect-video bg-[var(--color-bg-elevated)] relative overflow-hidden shrink-0">
                        {formation.thumbnail_url ? (
                          <img
                            loading="lazy"
                            src={formation.thumbnail_url}
                            alt={formation.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          // Repli sans vignette : bloc dégradé aux tokens de la
                          // carte plutôt qu'une image par défaut inexistante.
                          <div className="w-full h-full bg-gradient-to-br from-[var(--color-bg-elevated)] via-[var(--color-bg-surface)] to-[var(--color-accent-red)]/20 flex items-center justify-center">
                            <GraduationCap size={48} className="text-white/20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-surface)] via-[var(--color-bg-surface)]/20 to-transparent"></div>

                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
                          <div className="w-16 h-16 rounded-full bg-[var(--color-accent-red)] flex items-center justify-center backdrop-blur-md shadow-[0_0_40px_rgba(255,23,68,0.6)] transform scale-75 group-hover:scale-100 transition-transform duration-500">
                            <Play className="w-6 h-6 ml-1 text-white" fill="currentColor" />
                          </div>
                        </div>

                        {formation.level && (
                          <div className="absolute top-4 left-4 z-20">
                            <Badge
                              color={formation.level?.toLowerCase() === "debutant" ? "green" : formation.level?.toLowerCase() === "amateur" ? "purple" : "red"}
                              className="bg-black/80 backdrop-blur-md border-white/5 font-bold tracking-widest text-[10px]"
                            >
                              {levelLabels[formation.level?.toLowerCase()] || formation.level}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex items-center gap-3 mb-4">
                          {coach ? (
                            <Link
                              to={`/coaches/${coach.slug}`}
                              className="flex items-center gap-2 hover:opacity-80 transition-opacity relative z-30"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                                <img loading="lazy" src={coach.photo_url} alt={coach.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <span className="font-ui text-xs md:text-sm font-semibold text-white/90">{coach.name}</span>
                            </Link>
                          ) : (
                            <span className="font-ui text-xs md:text-sm font-semibold text-white/90">Coach</span>
                          )}

                          {formation.duration && (
                            <>
                              <span className="text-white/30 text-xs">•</span>
                              <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)] text-xs md:text-sm font-ui">
                                <Clock size={14} /> {formation.duration}
                              </div>
                            </>
                          )}
                        </div>

                        <h3 className="font-display text-xl md:text-2xl mb-4 text-white group-hover:text-[var(--color-accent-red)] transition-colors line-clamp-2 leading-tight">
                          {formation.title}
                        </h3>

                        <div className="mt-auto pt-5 border-t border-white/5">
                          <button className="w-full bg-[var(--color-accent-red)] hover:opacity-90 text-white font-ui font-bold py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-[0_0_15px_rgba(255,23,68,0.2)]">
                            Reprendre <ArrowRight size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
