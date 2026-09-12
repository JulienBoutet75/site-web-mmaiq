import { useState, useEffect } from "react";
import { motion } from 'motion/react';
import { Link } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { EditableText, EditableImage, EditableSelect } from "../components/admin/Editable";
import { useAuth } from "../context/AuthContext";
import { useSite } from "../context/SiteContext";
import { fetchData } from "../lib/supabase";
import { Play, ArrowRight, PlayCircle, Video, ChevronLeft, ChevronRight, CalendarDays, Target, ChartNoAxesCombined } from "lucide-react";
import { powerUpVariant, textRevealVariant } from "../animations";
import PricingSection from "../components/PricingSection";
import { TrustBar } from "../components/TrustBar";
import { PhoneFrame } from "../components/PhoneFrame";
import { WaitlistForm } from "../components/WaitlistForm";
import { FaqAccordion } from "../components/FaqAccordion";
import { Seo } from "../components/Seo";
import { CoachIntroduction } from "../components/CoachIntroduction";
import { faqs } from "../data/faq";

export function Home() {
  const { accessToken } = useAuth();
  const { siteData, isAdmin } = useSite();
  const [coaches, setCoaches] = useState<any[]>([]);
  const [formations, setFormations] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchData("coaches", "id,name,slug,photo_url,tagline,bio", "&order=name.asc", accessToken),
      fetchData("formations", "*", "&order=created_at.desc", accessToken),
    ]).then(([c, f]) => {
      if (cancelled) return;
      setCoaches(c || []);
      setFormations((f || []).filter((formation: any) => formation.published !== false));
    }).catch(error => console.error("Error loading coaches/formations", error));
    return () => { cancelled = true; };
  }, [accessToken]);

  return (
    <div className="bg-[var(--color-bg-base)] text-white">
      <Seo title="MMA IQ — Ta semaine de MMA, avec un plan clair" description="Entraînement, suivi de progression et préparation des combats. Découvre l'application MMA IQ et inscris-toi gratuitement pour être prévenu du lancement." canonicalPath="/" />
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0" aria-hidden="true">
          <EditableImage path="home.hero.main.bg" defaultSrc="https://tmmtabzxcgxlmsgfgxwx.supabase.co/storage/v1/object/public/images/22.png" className="h-full w-full" imgClassName="h-full w-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg-base)] via-[var(--color-bg-base)]/90 to-[var(--color-bg-base)]/60" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--color-bg-base)] to-transparent" />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pt-28 pb-14 sm:pt-36 sm:pb-20 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div className="min-w-0 max-w-2xl">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-violet-300)]/25 bg-[var(--color-accent-primary)]/10 px-3 py-2 text-xs font-semibold tracking-wide text-[var(--color-violet-200)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-violet-300)]" aria-hidden="true" /> Bientôt sur iOS et Android
            </p>
            <EditableText as="h1" path="home.launch.title" defaultText="Ta semaine de MMA, avec un plan clair." className="font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl" />
            <EditableText as="p" path="home.launch.subtitle" defaultText="Organise tes entraînements, suis ta progression et prépare tes combats avec MMA IQ. Une application pensée pour accompagner ta pratique, séance après séance." className="mt-6 max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg" />
            <div className="mt-7 max-w-xl">
              <p className="mb-4 text-base font-semibold">Sois prévenu du lancement.</p>
              <WaitlistForm id="home-waitlist" />
            </div>
            <a href="#demo" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white hover:text-[var(--color-violet-200)]">
              <PlayCircle className="h-5 w-5" aria-hidden="true" /> Voir la démonstration <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <figure className="hidden lg:block">
            <PhoneFrame src="/app/videos/hero-performance.mp4" poster="/app/videos/hero-performance-poster.webp" label="Démonstration du suivi de progression dans MMA IQ" eager />
            <figcaption className="mx-auto mt-5 max-w-xs text-center text-sm leading-relaxed text-[var(--color-text-secondary)]">Capture réelle de l'application.<br />Ton suivi de progression, au même endroit.</figcaption>
          </figure>
        </div>
      </section>

      <TrustBar />

      <section id="demo" className="scroll-mt-24 border-b border-white/10 px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-semibold text-[var(--color-violet-300)]">À l'intérieur de l'app</p>
              <h2 className="font-display text-4xl leading-tight sm:text-5xl">De ton prochain entraînement<br className="hidden sm:block" /> à tes prochains progrès.</h2>
            </div>
            <Link to="/app" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--color-violet-200)] hover:text-white">Explorer l'application <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
          <video controls playsInline preload="none" poster="/app/videos/montage-full-poster.webp" aria-label="Démonstration des modules de l'application MMA IQ" className="aspect-video w-full rounded-2xl border border-white/10 bg-[var(--color-bg-surface)]">
            <source src="/app/videos/montage-full.mp4" type="video/mp4" />
          </video>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Une capture de l'application en préparation. Lance la vidéo et agrandis-la pour explorer les écrans.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: CalendarDays, title: 'Organise ta semaine', desc: 'Retrouve ton programme et les séances prévues selon ton objectif.' },
              { icon: Target, title: 'Sache quoi travailler', desc: 'Appuie-toi sur les tutoriels et leurs consignes pour préparer tes séances.' },
              { icon: ChartNoAxesCombined, title: 'Suis ta progression', desc: 'Consulte tes indicateurs et leur évolution pour faire le point sur ta pratique.' },
            ].map(({ icon: Icon, title, desc }) => (
              <article key={title} className="border-t border-white/15 pt-6">
                <Icon className="mb-4 h-6 w-6 text-[var(--color-violet-300)]" aria-hidden="true" />
                <h3 className="font-display text-2xl tracking-wide">{title}</h3>
                <p className="mt-2 text-base leading-relaxed text-[var(--color-text-secondary)]">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <CoachIntroduction coaches={coaches} />

      {/* SECTION 5 — LES FORMATIONS (masquée tant qu'aucune formation n'est
          publiée : un titre au-dessus d'un carrousel vide ferait site cassé) */}
      {(formations.length > 0 || isAdmin) && (
      <section className="py-16 md:py-24 px-6 bg-[var(--color-bg-elevated)] border-t border-[var(--color-border)] relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={textRevealVariant}
            className="text-center mb-12 md:mb-16 flex flex-col items-center"
          >
            <EditableText as="h2" path="home.courses.title" defaultText="Coaching vidéo : MMA IQ Academy" className="text-lg sm:text-2xl md:text-5xl lg:text-6xl font-display uppercase tracking-tighter text-white mb-2 text-center" />
            <EditableText as="p" path="home.courses.subtitle" defaultText="Des formations pour approfondir ta technique, achetées à l’unité." className="text-[var(--color-text-secondary)] font-body text-xs sm:text-sm md:text-xl text-center" />
          </motion.div>

          <div className="relative flex items-center justify-center w-full max-w-5xl mx-auto px-0 md:px-12">
            <button
              aria-label="Formations précédentes" className="hidden md:flex absolute left-0 p-3 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full text-white hover:bg-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10"
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
                  formation = filteredFormations[i - 1];
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
                            className="w-full h-full object-cover"
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
                        <span className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-indigo)] text-white font-ui font-semibold rounded-lg text-xs py-2 h-auto pointer-events-none">
                          {formation?.price_cents ? `Accéder (${formation.price_cents / 100}€)` : "Découvrir"}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
            </div>
            <button
              aria-label="Formations suivantes" className="hidden md:flex absolute right-0 p-3 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full text-white hover:bg-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10"
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
      )}

      <PricingSection compact />

      <section className="border-t border-white/10 px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 font-display text-4xl sm:text-5xl">Avant de nous rejoindre.</h2>
          <FaqAccordion items={faqs.filter(f => f.featured)} />
          <Link to="/faq" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--color-violet-200)] hover:text-white">Toutes les questions <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
      <section className="border-t border-white/10 bg-[var(--color-bg-surface)] px-6 py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <p className="mb-3 text-sm font-semibold text-[var(--color-violet-300)]">L'application arrive.</p>
            <h2 className="font-display text-4xl sm:text-5xl">On te prévient quand c'est prêt.</h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)]">Laisse ton email pour être informé de sa disponibilité sur iOS et Android.</p>
          </div>
          <WaitlistForm id="home-footer-waitlist" />
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-12 md:grid-cols-2">
        <Link to="/instructional" className="group rounded-2xl border border-white/10 p-6 transition-colors hover:border-[var(--color-violet-300)]/50">
          <p className="text-sm font-semibold text-[var(--color-violet-300)]">MMA IQ Academy</p>
          <h2 className="mt-2 font-display text-2xl">Approfondis ta technique.</h2>
          <p className="mt-2 text-base leading-relaxed text-[var(--color-text-secondary)]">Découvre le projet Academy, ses coachs et ses formations vidéo.</p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">Découvrir l'Academy <ArrowRight className="h-4 w-4" /></span>
        </Link>
        <Link to="/partenaires" className="group rounded-2xl border border-white/10 p-6 transition-colors hover:border-[var(--color-violet-300)]/50">
          <p className="text-sm font-semibold text-[var(--color-violet-300)]">Pour les salles et les clubs</p>
          <h2 className="mt-2 font-display text-2xl">Prépare la suite avec tes adhérents.</h2>
          <p className="mt-2 text-base leading-relaxed text-[var(--color-text-secondary)]">Découvre le programme partenaires et son fonctionnement pour ta salle.</p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">Voir le programme <ArrowRight className="h-4 w-4" /></span>
        </Link>
      </section>
    </div>
  );
}
