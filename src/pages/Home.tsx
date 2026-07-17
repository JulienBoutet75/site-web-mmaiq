import { useState, useEffect, useRef } from "react";
import { motion } from 'motion/react';
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { EditableText, EditableImage, EditableSelect } from "../components/admin/Editable";
import { useAuth } from "../context/AuthContext";
import { useSite } from "../context/SiteContext";
import { fetchData } from "../lib/supabase";
import {
  Play, ArrowRight, Smartphone, PlayCircle, Video, ChevronLeft, ChevronRight
} from "lucide-react";
import { powerUpVariant, speedImpactVariant, speedImpactRightVariant, textRevealVariant } from "../animations";
import PricingSection from "../components/PricingSection";
import { PhoneFrame } from "../components/PhoneFrame";
import { FaqAccordion } from "../components/FaqAccordion";
import { faqs } from "../data/faq";

export function Home() {
  const montageRef = useRef<HTMLVideoElement>(null);

  // La démo complète pèse ~4,5 Mo : on ne la télécharge et ne la lit que
  // lorsqu'elle entre à l'écran, et pas du tout en prefers-reduced-motion.
  useEffect(() => {
    const el = montageRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const { accessToken } = useAuth();
  const { siteData, isAdmin } = useSite();
  const [coaches, setCoaches] = useState<any[]>([]);
  const [formations, setFormations] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [c, f] = await Promise.all([
          fetchData("coaches", "*", "&order=name.asc", accessToken),
          fetchData("formations", "*", "&order=created_at.desc", accessToken)
        ]);
        setCoaches(c || []);
        setFormations(f || []);
      } catch (err) {
        console.error("Error loading coaches/formations", err);
      }
    };
    loadData();
  }, [accessToken]);

  return (
    <div className="bg-[var(--color-bg-base)] text-white selection:bg-[var(--color-accent-purple)] selection:text-white">
      {/* HERO — PROPOSITION DE VALEUR */}
      <section className="relative min-h-[88vh] md:min-h-[92vh] flex items-center overflow-hidden w-full">
        {/* Fond photo + voile sombre lisible */}
        <div className="absolute inset-0 z-0">
          <EditableImage
            path="home.hero.main.bg"
            defaultSrc="https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/images/22.png"
            className="w-full h-full"
            imgClassName="w-full h-full object-cover object-center opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg-base)] via-[var(--color-bg-base)]/85 to-[var(--color-bg-base)]/25"></div>
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[var(--color-bg-base)] to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-32 pb-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-2xl"
          >
            <EditableText
              as="p"
              path="home.hero.main.kicker"
              defaultText="La plateforme de performance MMA"
              className="font-ui text-xs md:text-sm font-bold tracking-[0.25em] uppercase text-[var(--color-accent-primary)] mb-4 md:mb-6"
            />
            <EditableText
              as="h1"
              path="home.hero.main.title"
              defaultText="Progresse en MMA avec méthode."
              className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] uppercase text-white mb-4 md:mb-6"
            />
            <EditableText
              as="p"
              path="home.hero.main.subtitle"
              defaultText="Plans d'entraînement, gameplans tactiques et cours vidéo des meilleurs coachs francophones — dans une seule app. Du débutant au compétiteur."
              className="font-body text-base md:text-xl text-[var(--color-text-secondary)] leading-relaxed mb-8 md:mb-10 max-w-xl"
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/app"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--color-accent-primary)] hover:opacity-90 text-white rounded-full font-ui font-bold text-base shadow-[0_0_30px_rgba(123,47,255,0.4)] transition-all"
              >
                <Smartphone className="w-5 h-5" />
                <EditableText path="home.hero.main.cta1" defaultText="Découvrir l'application" />
              </Link>
              <Link
                to="/instructional"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/15 text-white rounded-full font-ui font-bold text-base transition-all"
              >
                <PlayCircle className="w-5 h-5" />
                <EditableText path="home.hero.main.cta2" defaultText="Voir les cours vidéo" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="relative">
        {/* SECTION 1 & 2 MERGED — L'ÉCOSYSTÈME & LA MÉTHODE */}
        <section className="py-16 md:py-24 px-6 bg-[var(--color-bg-elevated)] relative overflow-hidden border-y border-[var(--color-border)]">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--color-accent-primary)] to-transparent opacity-50"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={powerUpVariant}
            className="text-center mb-16 max-w-3xl mx-auto"
          >
            <div className="relative inline-block mb-4">
              <EditableText
                as="h2"
                path="home.ecosystem.title"
                defaultText="Un écosystème complet. Un seul objectif."
                className="text-4xl md:text-5xl lg:text-6xl font-display uppercase tracking-tighter text-white relative z-10"
              />
            </div>
            
            <EditableText
              as="p"
              path="home.ecosystem.subtitle"
              defaultText="Centralise et professionnalise ta progression MMA du débutant au compétiteur. Ne laisse plus rien au hasard."
              className="text-[var(--color-text-secondary)] font-body text-[12px] sm:text-sm md:text-xl max-w-2xl mx-auto leading-relaxed px-2"
            />
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={powerUpVariant}
            className="relative max-w-5xl mx-auto aspect-video rounded-[2rem] overflow-hidden border border-[var(--color-border)] shadow-[0_0_50px_rgba(123,47,255,0.2)]"
          >
            {/* Montage produit complet : les 9 modules de l'app (01/09 → 09/09) */}
            <video
              ref={montageRef}
              src="/app/videos/montage-full.mp4"
              poster="/app/videos/montage-full-poster.webp"
              aria-label="Démo complète de l'app MMA IQ : les 9 modules, de l'onboarding à la communauté"
              muted
              loop
              playsInline
              preload="none"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* SECTION 3 — ENTRAÎNE-TOI AVEC MÉTHODE */}
      <section className="py-16 md:py-24 px-6 bg-[var(--color-bg-base)] relative overflow-hidden">
        {/* Cyborg Background Elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA0MCAwIEwgMCAwIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[var(--color-accent-primary)]/5 to-transparent pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.h2 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={textRevealVariant}
            className="text-4xl md:text-5xl lg:text-6xl text-center mb-16 md:mb-24 font-display uppercase text-white tracking-tighter relative inline-block left-1/2 -translate-x-1/2"
          >
            Entraîne-toi avec méthode.
            <div className="absolute -bottom-4 left-0 w-full h-1 bg-[var(--color-accent-energy)] shadow-[0_0_15px_var(--color-accent-energy)]"></div>
            <div className="absolute -bottom-4 left-0 w-1/3 h-1 bg-white animate-pulse"></div>
          </motion.h2>

          <div className="space-y-16 md:space-y-32 relative">
            {/* Connecting Line - Tech Style */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-[var(--color-border)] transform -translate-x-1/2">
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--color-accent-energy)] rounded-full shadow-[0_0_10px_var(--color-accent-energy)]"></div>
              <div className="absolute top-2/4 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--color-accent-primary)] rounded-full shadow-[0_0_10px_var(--color-accent-primary)]"></div>
              <div className="absolute top-3/4 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--color-accent-secondary)] rounded-full shadow-[0_0_10px_var(--color-accent-secondary)]"></div>
            </div>

            {[
              { step: '01', title: 'Évalue ton niveau', desc: 'Passe nos tests physiques et techniques pour définir ton point de départ.', color: 'var(--color-accent-energy)', stat: 'DATA.SYNC', video: '/app/videos/onboarding.mp4', posterImg: '/app/videos/onboarding-poster.webp', label: "Onboarding de l'app : disciplines, années de pratique, niveau et mensurations" },
              { step: '02', title: 'Suis ton plan', desc: 'Reçois un programme adapté à tes objectifs et ton emploi du temps.', color: 'var(--color-accent-primary)', stat: 'SYS.ACTIVE', video: '/app/videos/entrainement-live.mp4', posterImg: '/app/videos/entrainement-live-poster.webp', label: "Séance d'entraînement guidée en temps réel dans l'app" },
              { step: '03', title: 'Mesure l\'impact', desc: 'Analyse tes progrès avec des données concrètes et ajuste le tir.', color: 'var(--color-accent-secondary)', stat: 'CALC.OPTIM', video: '/app/videos/hero-performance.mp4', posterImg: '/app/videos/hero-performance-poster.webp', label: "Tableau de bord performance de l'app : score global de forme et courbes" }
            ].map((block, i) => (
              <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-12 relative z-10`}>
                <motion.div 
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={i % 2 === 0 ? speedImpactVariant : speedImpactRightVariant}
                  className="w-full md:w-1/2 relative"
                >
                  {/* Vraie capture de l'app dans un cadre téléphone, comme sur la page /app */}
                  <PhoneFrame
                    src={block.video}
                    poster={block.posterImg}
                    label={block.label}
                  />
                  {/* Step Number Overlay */}
                  <div className={`absolute ${i % 2 === 0 ? '-right-4 md:-right-8' : '-left-4 md:-left-8'} -top-8 md:-top-12 text-6xl md:text-[150px] font-accent font-black text-white/5 select-none pointer-events-none`}>
                    {block.step}
                  </div>
                </motion.div>
                
                <motion.div 
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={textRevealVariant}
                  className="w-full md:w-1/2 md:px-12"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-px bg-white/20"></div>
                    <div className="text-sm font-ui tracking-widest" style={{ color: block.color }}>PHASE_{block.step}</div>
                  </div>
                  <EditableText as="h3" path={`home.method.title${i}`} defaultText={block.title} className="text-3xl md:text-4xl lg:text-5xl font-display mb-4 text-white leading-tight uppercase tracking-tight" />
                  <EditableText as="p" path={`home.method.desc${i}`} defaultText={block.desc} className="text-[var(--color-text-secondary)] font-body text-base md:text-lg mb-6 md:mb-8" />
                  <Link to="/app" className="inline-flex bg-transparent border border-[var(--color-border)] text-white font-ui font-semibold px-6 py-4 md:px-8 md:py-5 hover:bg-white/5 transition-all duration-300 relative overflow-hidden group">
                    <span className="relative z-10 flex items-center gap-2 text-sm tracking-wider uppercase">Découvrir l'app <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-[var(--color-accent-energy)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  </Link>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — LES FORMATIONS */}
      <section className="py-16 md:py-24 px-6 bg-[var(--color-bg-elevated)] border-t border-[var(--color-border)] relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }} 
            variants={textRevealVariant}
            className="text-center mb-12 md:mb-16 flex flex-col items-center"
          >
            <EditableText as="h2" path="home.courses.title" defaultText="Coaching vidéo : MMA IQ Academy" className="text-lg sm:text-2xl md:text-5xl lg:text-6xl font-display uppercase tracking-tighter text-white mb-2 text-center whitespace-nowrap" />
            <EditableText as="p" path="home.courses.subtitle" defaultText="Apprends des meilleurs. Domine la cage." className="text-[var(--color-text-secondary)] font-body text-xs sm:text-sm md:text-xl text-center whitespace-nowrap" />
          </motion.div>

          <div className="relative flex items-center justify-center w-full max-w-5xl mx-auto px-0 md:px-12">
            <button 
              className="hidden md:flex absolute left-0 p-3 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full text-white hover:bg-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10" 
              onClick={() => document.getElementById('formations-scroll')?.scrollBy({ left: -400, behavior: 'smooth' })}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div id="formations-scroll" className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:gap-6 pb-8 scrollbar-hide scroll-smooth w-full px-4 md:px-0">
              {[1, 2].map((i) => {
                const selectedCoachId = siteData.texts[`home.featured_course_coach_${i}`];
                const selectedFormationId = siteData.texts[`home.featured_course_${i}`];
                
                const coach = coaches.find(c => String(c.id) === String(selectedCoachId));
                const filteredFormations = selectedCoachId 
                  ? formations.filter(f => String(f.coach_id) === String(selectedCoachId))
                  : formations;
                
                let formation = selectedFormationId 
                  ? formations.find(f => String(f.id) === String(selectedFormationId))
                  : null;
                  
                if (!formation || (selectedCoachId && String(formation.coach_id) !== String(selectedCoachId))) {
                  formation = filteredFormations[0];
                }

                const formationCoach = coaches.find(c => String(c.id) === String(formation?.coach_id));

                if (!formation && !isAdmin) return null;

                return (
                  <motion.div 
                    key={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={powerUpVariant}
                    className="w-[85vw] max-w-[300px] md:max-w-none md:w-[calc(50%-12px)] bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-3 md:p-6 text-center group hover:border-[var(--color-accent-primary)] transition-colors snap-center relative overflow-hidden flex-shrink-0"
                  >
                  {isAdmin && (
                    <div className="absolute top-2 right-2 z-50 bg-black/90 p-2 rounded-lg border border-purple-500/50 backdrop-blur-md shadow-xl text-left w-[200px]">
                      <div className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-1">Coach {i}</div>
                      <EditableSelect 
                        path={`home.featured_course_coach_${i}`}
                        options={coaches.map(c => ({ value: String(c.id), label: c.name }))}
                        defaultText="Choisir un coach..."
                        className="text-xs mb-2"
                      />
                      <div className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-1">Formation {i}</div>
                      <EditableSelect 
                        path={`home.featured_course_${i}`}
                        options={filteredFormations.map(f => ({ value: String(f.id), label: f.title }))}
                        defaultText="Choisir une formation..."
                        className="text-xs"
                      />
                    </div>
                  )}
                  <Link to={formation ? `/course/${formation.slug}` : "#"} className="block w-full h-full">
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-accent-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="w-full aspect-video mx-auto mb-3 md:mb-6 relative mt-2 md:mt-6 rounded-xl overflow-hidden">
                      <div className="absolute inset-0 bg-[var(--color-accent-primary)] rounded-xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity animate-aura-pulse"></div>
                      <div className="w-full h-full rounded-xl overflow-hidden border-2 border-[var(--color-border)] group-hover:border-[var(--color-accent-primary)] transition-colors relative z-10">
                        {formation?.thumbnail_url ? (
                          <img loading="lazy"
                            src={formation.thumbnail_url}
                            alt={formation.title}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-surface)] flex items-center justify-center">
                            <Video className="w-10 h-10 text-white/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-[var(--color-accent-primary)]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-[var(--color-accent-primary)]">
                            <Play className="w-5 h-5 text-white ml-1" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-2xl font-ui font-bold text-white mb-2">{formation?.title || "Sélectionne une formation"}</h3>
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                      {formation?.level && (
                        <Badge className="bg-white/5 text-[var(--color-accent-primary)] border-[var(--color-accent-primary)]/30 font-ui text-xs">
                          {formation.level}
                        </Badge>
                      )}
                      {formation?.duration && (
                        <Badge className="bg-white/5 text-[var(--color-accent-primary)] border-[var(--color-accent-primary)]/30 font-ui text-xs">
                          {formation.duration}
                        </Badge>
                      )}
                    </div>

                    {formation?.description && (
                      <p className="text-sm font-body text-[var(--color-text-secondary)] mb-6 line-clamp-3">
                        {formation.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 border-t border-[var(--color-border)] pt-4 items-center">
                      <div className="flex flex-col items-center">
                        {(formationCoach?.photo_url || coach?.photo_url) ? (
                          <img loading="lazy"
                            src={formationCoach?.photo_url || coach?.photo_url}
                            alt={formationCoach?.name || coach?.name || "Coach"}
                            className="w-10 h-10 rounded-full object-cover mb-1 border border-[var(--color-border)]"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center mb-1">
                            <span className="font-display text-sm text-white/40">{(formationCoach?.name || coach?.name || "?").charAt(0)}</span>
                          </div>
                        )}
                        <div className="text-[10px] font-ui text-[var(--color-text-secondary)] uppercase tracking-wider">{formationCoach?.name || coach?.name || "Coach"}</div>
                      </div>
                      <div>
                        <Button className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-indigo)] text-white font-ui font-semibold rounded-lg text-xs py-2 h-auto pointer-events-none">
                          {formation?.price_cents ? `Accéder (${formation.price_cents / 100}€)` : "Découvrir"}
                        </Button>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
            </div>
            <button 
              className="hidden md:flex absolute right-0 p-3 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full text-white hover:bg-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10" 
              onClick={() => document.getElementById('formations-scroll')?.scrollBy({ left: 400, behavior: 'smooth' })}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          
          <div className="mt-2 text-center md:hidden">
            <div className="text-[var(--color-text-secondary)] text-xs mb-4 animate-pulse">
              ← Glissez pour voir plus →
            </div>
            <Link to="/instructional" className="inline-flex items-center gap-2 text-[var(--color-accent-primary)] font-ui font-bold hover:underline">
              Voir tout le catalogue <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
      </div>

      {/* SECTION 7 — ACCÈS PREMIUM */}
      <PricingSection />

      {/* SECTION 8 — FAQ */}
      <section className="py-16 md:py-24 px-6 bg-[var(--color-bg-base)] border-t border-[var(--color-border)]">
        <div className="max-w-3xl mx-auto">
          <motion.h2 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={textRevealVariant}
            className="text-3xl md:text-4xl text-center mb-12 font-display uppercase tracking-tighter text-white w-full leading-tight"
          >
            Questions fréquentes
          </motion.h2>
          <FaqAccordion items={faqs.filter(f => f.featured)} />
          <div className="mt-8 text-center">
            <Link to="/faq" className="inline-flex items-center gap-2 text-[var(--color-accent-primary)] font-ui font-bold hover:underline">
              Toutes les questions <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
