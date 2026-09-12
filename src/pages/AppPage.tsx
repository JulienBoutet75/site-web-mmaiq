import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, Link } from 'react-router-dom';
import {
  CheckCircle2, X, ChevronRight, Timer, Users,
  Bell, Loader2, AlertCircle
} from "lucide-react";
import { AmbientBackground } from '../components/AmbientBackground';
import { PhoneFrame } from '../components/PhoneFrame';
import { submitLead } from '../lib/supabase';
import { getReferral, normalizeRefCode, saveReferral } from '../lib/referral';

// --- ANIMATION VARIANTS ---
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const glitchLeft = {
  hidden: { opacity: 0, x: -50, filter: "blur(4px)" },
  show: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.5, type: "spring" } }
};

const powerRight = {
  hidden: { opacity: 0, x: 50, scale: 0.8 },
  show: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.6, type: "spring", bounce: 0.4 } }
};

// Les 8 modules réels du dashboard de l'app (mêmes noms, mêmes illustrations).
const MODULES = [
  { img: '/app/modules/entrainement.webp', title: 'ENTRAÎNEMENT', desc: 'Plans périodisés & séances guidées' },
  { img: '/app/modules/nutrition.webp', title: 'NUTRITION', desc: 'Plan alimentaire & scan de repas IA' },
  { img: '/app/modules/performance.webp', title: 'PERFORMANCE', desc: 'Tes stats sur 5 tableaux de bord' },
  { img: '/app/modules/tutoriels.webp', title: 'TUTORIELS', desc: 'Bibliothèque vidéo technique' },
  { img: '/app/modules/medecine.webp', title: 'MÉDECINE', desc: 'Dossier médical & documents' },
  { img: '/app/modules/gameplan.webp', title: 'GAMEPLAN', desc: 'Fiche adversaire & stratégie IA' },
  { img: '/app/modules/analyse_video.webp', title: 'ANALYSE VIDÉO', desc: 'Décorticage IA de combats' },
  { img: '/app/modules/cutting.webp', title: 'CUTTING', desc: 'Cut Companion : coupe encadrée' },
];

// Une description factuelle par capture. Chaque texte suit exactement le
// parcours visible dans la vidéo au lieu de répéter une promesse marketing.
const VIDEO_DEMOS = [
  {
    number: '01',
    label: 'Tutoriels techniques',
    title: 'Le geste, puis les consignes.',
    description: "Choisis une zone du corps ou une discipline. Chaque fiche réunit la démonstration, l'objectif de l'exercice, son exécution et les points à surveiller.",
    steps: ['Voir la technique en vidéo', "Suivre les étapes d'exécution", 'Repérer les erreurs à éviter'],
    src: '/app/videos/tutoriels.mp4',
    poster: '/app/videos/tutoriels-poster.webp',
    videoLabel: "Un tutoriel MMA IQ avec sa démonstration, son objectif, ses consignes d'exécution et ses points d'attention",
  },
  {
    number: '02',
    label: 'Journal nutritionnel',
    title: 'Une photo, puis tu gardes la main.',
    description: "Photographie ton repas. L'app propose les aliments reconnus et leurs quantités : tu les vérifies avant de les ajouter à ton suivi de la journée.",
    steps: ['Photographier le repas', 'Corriger aliments et quantités', 'Ajouter calories et macros au journal'],
    src: '/app/videos/nutrition-scan.mp4',
    poster: '/app/videos/nutrition-scan-poster.webp',
    videoLabel: "Le scan d'un repas, la vérification des aliments détectés et leur ajout au journal nutritionnel",
  },
  {
    number: '03',
    label: 'Analyse de combat',
    title: 'Retrouve les séquences qui comptent.',
    description: "Importe un fichier ou un lien YouTube. Le résultat rassemble un résumé du combat et des séquences horodatées, classées par thème pour revenir directement aux actions clés.",
    steps: ['Importer la vidéo du combat', 'Lire le résumé généré', 'Ouvrir les séquences striking et wrestling'],
    src: '/app/videos/analyse-video.mp4',
    poster: '/app/videos/analyse-video-poster.webp',
    videoLabel: "Une analyse de combat avec un résumé et des séquences horodatées classées par thème",
  },
];

export function AppPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  // Code salle partenaire : pré-rempli si un lien ?ref= / une landing /s/:slug
  // a déjà déposé un code, modifiable par le visiteur (champ optionnel).
  const [waitlistCode, setWaitlistCode] = useState(() => getReferral()?.code ?? "");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (waitlistStatus === "loading") return;
    setWaitlistStatus("loading");
    try {
      const referralCode = normalizeRefCode(waitlistCode) ?? getReferral()?.code;
      if (referralCode) saveReferral(referralCode);
      await submitLead({
        type: "waitlist",
        email: waitlistEmail,
        ...(referralCode ? { referral_code: referralCode } : {}),
      });
      setWaitlistStatus("success");
      setWaitlistEmail("");
    } catch (err) {
      console.error("Waitlist error:", err);
      setWaitlistStatus("error");
    }
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Arrivée depuis une autre page avec /app#download : scroll vers la liste d'attente
  const location = useLocation();
  useEffect(() => {
    if (location.hash === "#download") {
      setTimeout(() => {
        document.getElementById("download")?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  }, [location]);

  return (
    <div className="bg-[var(--color-bg-base)] text-[var(--color-text-primary)] min-h-screen relative overflow-hidden selection:bg-[var(--color-accent-primary)] selection:text-white font-body">
      <style dangerouslySetInnerHTML={{__html: `
        .text-gradient-primary {
          background: linear-gradient(to right, var(--color-accent-primary), var(--color-violet-300));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}} />

      <AmbientBackground />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(123,47,255,0.15)_0%,transparent_50%)] pointer-events-none z-0"></div>

      {/* ==========================================
          SECTION 1 — HERO : la vraie app, en vidéo
          ========================================== */}
      <section className="relative z-20 pt-20 sm:pt-28 pb-12 sm:pb-20 px-6 w-full max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="lg:col-span-7 flex flex-col justify-center z-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 mx-auto lg:mx-0 shadow-[0_0_20px_rgba(123,47,255,0.15)] w-fit">
              <span className="w-2 h-2 rounded-full bg-[var(--color-accent-primary)] animate-pulse"></span>
              <span className="text-xs font-ui font-bold text-white tracking-widest uppercase">Bientôt sur iOS &amp; Android</span>
            </div>
            <h1 className="font-display text-display-2xl leading-[0.92] uppercase tracking-wide text-white mb-5">
              Il y a un avant<br/>et un après <span className="font-days-one tracking-normal text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-violet-300)]">MMA IQ</span>.
            </h1>
            <p className="text-[var(--color-text-secondary)] text-base sm:text-xl font-body mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
              L'app tout-en-un du combattant : entraînement, nutrition, cutting, gameplan et analyse vidéo IA.
              Pour les <span className="font-bold text-white">débutants</span>, les <span className="font-bold text-white">amateurs</span>, les <span className="font-bold text-white">pros</span> et les <span className="font-bold text-white">coachs</span>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href="#download" className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-violet-300)] text-white rounded-full font-body font-bold text-sm sm:text-base hover:scale-105 transition-all shadow-[0_0_30px_rgba(123,47,255,0.4)]">
                <Bell className="w-5 h-5" /> Être prévenu du lancement
              </a>
            </div>
          </div>

          {/* Right : vraie capture d'écran du module Performance */}
          <div className="lg:col-span-5 relative z-10">
            <PhoneFrame
              src="/app/videos/hero-performance.mp4"
              poster="/app/videos/hero-performance-poster.webp"
              label="Le module Performance de MMA IQ : score global et courbes d'évolution"
              eager
            />
            <div className="max-w-[300px] mx-auto mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent-energy)] shadow-[0_0_12px_var(--color-accent-energy)]" aria-hidden="true"></span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">Capture réelle · Performance</p>
                <p className="mt-1 text-xs leading-relaxed text-white/80">Score global, évolution des macros et répartition des calories sur 4 semaines.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 1.5 — DÉMONSTRATIONS PRODUIT
          ========================================== */}
      <section id="product-demos" className="relative z-10 py-16 sm:py-28 px-4 sm:px-6 max-w-[1400px] mx-auto scroll-mt-24">
        <div className="text-center max-w-3xl mx-auto relative mb-12 sm:mb-16">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[560px] h-[240px] bg-[var(--color-accent-primary)]/20 blur-[120px] rounded-full pointer-events-none" aria-hidden="true"></div>
          <p className="relative z-10 text-xs font-ui font-bold text-[var(--color-violet-300)] tracking-[0.2em] uppercase mb-4">
            Trois parcours réels
          </p>
          <h2 className="relative z-10 text-display-xl font-display tracking-wide text-white mb-5 uppercase leading-[0.92]">
            Ce que l'app fait.<br />
            <span className="text-gradient-primary">Écran par écran.</span>
          </h2>
          <p className="relative z-10 text-[var(--color-text-secondary)] text-sm sm:text-lg font-body max-w-2xl mx-auto leading-relaxed">
            Les vidéos ci-dessous sont des captures de l'application. Voici précisément ce qui se passe dans chacune d'elles.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 items-stretch">
          {VIDEO_DEMOS.map((demo) => (
            <article
              key={demo.number}
              className="relative min-w-0 overflow-hidden rounded-[28px] sm:rounded-[32px] border border-white/10 bg-[var(--color-bg-surface)]/80 shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
            >
              <div className="relative px-5 pt-8 pb-7 sm:px-7 sm:pt-10 sm:pb-8 bg-[linear-gradient(180deg,rgba(123,47,255,0.08),transparent)]">
                <span className="absolute top-5 left-5 sm:left-7 font-display text-4xl text-white/[0.08]" aria-hidden="true">
                  {demo.number}
                </span>
                <PhoneFrame
                  src={demo.src}
                  poster={demo.poster}
                  label={demo.videoLabel}
                />
              </div>

              <div className="border-t border-white/10 p-6 sm:p-7">
                <p className="text-[11px] font-ui font-bold uppercase tracking-[0.18em] text-[var(--color-violet-300)] mb-3">
                  {demo.label}
                </p>
                <h3 className="font-display text-3xl leading-none tracking-wide text-white mb-4">
                  {demo.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] mb-6">
                  {demo.description}
                </p>
                <ol className="space-y-3 border-t border-white/10 pt-5">
                  {demo.steps.map((step, index) => (
                    <li key={step} className="flex items-start gap-3 text-sm text-white/80">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--color-accent-primary)]/40 bg-[var(--color-accent-primary)]/10 text-[10px] font-bold text-[var(--color-violet-300)]">
                        {index + 1}
                      </span>
                      <span className="pt-0.5 leading-snug">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </article>
          ))}
        </div>

        {/* Offre coach, séparée des démonstrations vidéo pour ne pas brouiller leur lecture. */}
        <div className="relative mt-12 sm:mt-16 overflow-hidden rounded-[28px] border border-[var(--color-tier-coach)]/25 bg-[linear-gradient(110deg,rgba(155,126,255,0.12),rgba(12,14,24,0.86)_45%)] p-6 sm:p-9">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[var(--color-tier-coach)]/10 blur-[70px] pointer-events-none" aria-hidden="true"></div>
          <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-7 lg:gap-12 items-center">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-tier-coach)] mb-3">
                <Users className="h-4 w-4" /> Pour les coachs
              </p>
              <h3 className="font-display text-3xl sm:text-4xl tracking-wide text-white mb-3">Le suivi de l'équipe, au même endroit.</h3>
              <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-[var(--color-text-secondary)]">
                Coach Suite rassemble le planning, les données de performance et les échanges avec chaque athlète dans un tableau de bord multi-profils.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {['Planning partagé', 'Suivi multi-athlètes', 'Messagerie', '150 crédits IA / mois'].map((feature) => (
                  <span key={feature} className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/75">
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-start lg:items-end gap-4 border-t border-white/10 pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <div>
                <span className="font-accent text-3xl text-white">19,99€</span>
                <span className="text-[var(--color-text-secondary)] text-sm"> / mois</span>
              </div>
              <Link to="/tarifs" className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-tier-coach)]/30 bg-[var(--color-tier-coach)]/15 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--color-tier-coach)]/25">
                Voir Coach Suite <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 2 — SÉANCE CARDIO
          ========================================== */}
      <section className="relative z-10 py-20 sm:py-28 border-y border-white/5 bg-gradient-to-b from-transparent via-[var(--color-bg-elevated)]/40 to-transparent">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 border border-[var(--color-accent-primary)]/30 bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] font-ui font-bold tracking-widest text-xs sm:text-sm px-4 py-1.5 rounded-full mb-6 uppercase shadow-[0_0_15px_rgba(123,47,255,0.15)]">
              <Timer className="w-4 h-4" /> Séance cardio
            </div>
            <h2 className="font-display text-display-lg mb-6 uppercase leading-[0.92] tracking-wide">
              Lance ta séance.<br/><span className="text-gradient-primary">Garde les chiffres sous les yeux.</span>
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] mb-8 leading-relaxed max-w-xl">
              Depuis ton planning, choisis une activité avec ou sans GPS, puis démarre. Pendant l'effort, l'écran affiche le temps, la distance, l'allure, la vitesse instantanée et les calories.
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-10" aria-label="Étapes montrées dans la vidéo">
              {[
                { step: 'Avant', detail: "Choisir l'activité" },
                { step: 'Départ', detail: 'Compte à rebours' },
                { step: 'Pendant', detail: 'Mesures en direct' },
              ].map((item) => (
                <div key={item.step} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-violet-300)] mb-1.5">{item.step}</p>
                  <p className="text-xs sm:text-sm leading-snug text-white/80">{item.detail}</p>
                </div>
              ))}
            </div>
            <a href="#download" className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 hover:bg-[var(--color-accent-primary)] text-white rounded-full font-ui font-bold text-lg transition-all hover:shadow-[0_0_40px_rgba(123,47,255,0.5)] hover:scale-[1.02]">
              Être prévenu du lancement <ChevronRight className="w-5 h-5" />
            </a>
          </div>
          <div className="flex justify-center">
            <PhoneFrame
              src="/app/videos/entrainement-live.mp4"
              poster="/app/videos/entrainement-live-poster.webp"
              label="Le choix d'une activité cardio puis le suivi en direct du temps, de la distance, de l'allure et des calories"
            />
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 3 — SANS / AVEC (Visual Battle)
          ========================================== */}
      <section className="relative z-10 pt-12 pb-24 px-6 max-w-6xl mx-auto overflow-hidden">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="font-display text-4xl md:text-5xl mb-4 uppercase tracking-wide">
            L'AVANT / APRÈS EST <motion.span animate={{ color: ["#F0F4FF", "#FF1744", "#F0F4FF"], scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="inline-block text-white/30 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">BRUTAL</motion.span>
          </h2>
          <p className="text-[var(--color-text-secondary)] text-sm sm:text-lg max-w-2xl mx-auto">La différence entre ceux qui stagnent et ceux qui performent.</p>
        </div>

        <div className="relative grid grid-cols-2 gap-2 sm:gap-16 items-start">

          {/* SANS MMA IQ */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-2 sm:space-y-4 order-1"
          >
            <h3 className="font-display text-xl sm:text-2xl text-white/40 text-center md:text-left mb-4 sm:mb-8 uppercase tracking-widest">Sans <span className="font-days-one tracking-normal">MMA IQ</span></h3>
            {[
              "Notes éparpillées",
              "Nutrition au feeling",
              "Zéro analyse",
              "Charge inconnue",
              "Coach isolé"
            ].map((text, i) => (
              <motion.div
                key={i}
                variants={glitchLeft}
                className="flex items-center gap-2 sm:gap-4 p-2 sm:p-5 rounded-xl sm:rounded-2xl bg-white/5 border border-[var(--color-accent-red)]/10"
              >
                <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <X className="w-3 h-3 sm:w-5 sm:h-5 text-white/30" />
                </div>
                <p className="text-[10px] sm:text-base text-[var(--color-text-secondary)] line-through decoration-white/30 leading-tight">{text}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* AVEC MMA IQ */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-2 sm:space-y-4 order-2"
          >
            <h3 className="font-display text-xl sm:text-2xl text-[var(--color-accent-primary)] text-center md:text-left mb-4 sm:mb-8 uppercase tracking-widest glow-text">Avec <span className="font-days-one tracking-normal">MMA IQ</span></h3>
            {[
              "Planning & GPS",
              "Macros auto",
              "Analyse experte",
              "Anti-surentraînement",
              "Espace partagé"
            ].map((text, i) => (
              <motion.div
                key={i}
                variants={powerRight}
                className="group flex items-center gap-2 sm:gap-4 p-2 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[var(--color-accent-primary)]/10 to-[var(--color-accent-primary)]/5 border border-[var(--color-accent-primary)]/30 hover:border-[var(--color-accent-primary)]/50 transition-all duration-300 shadow-[0_0_20px_rgba(123,47,255,0.1)] hover:shadow-[0_0_30px_rgba(123,47,255,0.2)]"
              >
                <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-[var(--color-accent-primary)]/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 sm:w-5 sm:h-5 text-[var(--color-accent-primary)]" />
                </div>
                <p className="text-[10px] sm:text-base text-[var(--color-text-primary)] font-medium leading-tight">{text}</p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* ==========================================
          SECTION 4 — LES 8 MODULES RÉELS
          ========================================== */}
      <section className="relative z-10 pt-8 pb-12 sm:py-24 px-6 max-w-[1400px] mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="font-display text-display-lg mb-4 uppercase tracking-wide leading-[0.9]">8 MODULES.<br className="block" /> UN SEUL OBJECTIF.</h2>
          <p className="text-[var(--color-text-secondary)] text-sm sm:text-lg max-w-md sm:max-w-2xl mx-auto leading-tight sm:leading-relaxed">Le tableau de bord de l'app, tel que tu le retrouveras au premier lancement.</p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-6"
        >
          {MODULES.map((feature, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, scale: 0.5 },
                show: { opacity: 1, scale: 1, transition: { type: "spring", bounce: 0.5 } }
              }}
              whileHover={{ scale: 1.05, transition: { type: "spring", stiffness: 400 } }}
              className="group relative bg-[var(--color-bg-surface)]/80 backdrop-blur-md border border-white/5 p-3 sm:p-6 rounded-xl sm:rounded-[24px] flex flex-col items-center text-center overflow-hidden"
            >
              {/* Hover Glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-accent-primary)]/0 to-[var(--color-accent-primary)]/0 group-hover:from-[var(--color-accent-primary)]/10 group-hover:to-transparent transition-all duration-500"></div>
              <div className="absolute -inset-px rounded-xl sm:rounded-[24px] border border-transparent group-hover:border-[var(--color-accent-primary)]/50 transition-colors duration-500"></div>

              <img
                src={feature.img}
                alt=""
                loading="lazy"
                className="w-16 h-16 sm:w-24 sm:h-24 object-contain mb-2 sm:mb-4 relative z-10 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
              />
              <h4 className="font-display text-sm sm:text-lg mb-1 sm:mb-2 tracking-widest uppercase relative z-10">{feature.title}</h4>
              <p className="text-[var(--color-text-secondary)] text-[10px] sm:text-[13px] leading-tight sm:leading-relaxed relative z-10">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
        <p className="text-center text-[var(--color-text-secondary)] text-xs sm:text-sm font-body mt-6 sm:mt-8">
          Et aussi : réseau social des combattants, messagerie, calendrier et recherche de clubs.
        </p>
      </section>

      {/* ==========================================
          SECTION 5 — GAMEPLAN
          ========================================== */}
      <section className="relative z-10 pt-20 pb-12 sm:py-24 bg-gradient-to-b from-transparent via-[var(--color-accent-primary)]/5 to-transparent border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 items-center">

          {/* Left : vraie fiche adversaire générée par l'IA */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, type: "spring" }}
            className="w-full flex justify-center"
          >
            <PhoneFrame
              src="/app/videos/gameplan.mp4"
              poster="/app/videos/gameplan-poster.webp"
              label="Une fiche adversaire générée par l'IA de MMA IQ : style de combat, faiblesses, points d'attaque"
            />
          </motion.div>

          {/* Right: Text & CTA */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, type: "spring", delay: 0.2 }}
          >
            <h2 className="font-display text-display-lg mb-6 uppercase leading-[0.9] tracking-wide">
              Prépare le combat <span className="text-white/30">avant la cage.</span>
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] mb-8 leading-relaxed">
              Crée la fiche de ton adversaire à partir de son profil. L'écran organise ensuite les informations utiles à la préparation : style de combat, forces, faiblesses, gestion du risque et pistes tactiques.
            </p>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 sm:p-6 mb-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-violet-300)] mb-4">Dans cette capture</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {[
                "Profil et palmarès",
                "Style et habitudes de combat",
                "Forces et faiblesses",
                "Points d'attaque et stratégie"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                  <span className="font-display text-lg leading-none text-[var(--color-accent-primary)]">0{i + 1}</span>
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
              </ul>
            </div>

            <a href="#download" className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 hover:bg-[var(--color-accent-primary)] text-white rounded-full font-ui font-bold text-lg transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(123,47,255,0.5)] hover:scale-[1.02]">
              Être prévenu du lancement <ChevronRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ==========================================
          SECTION 6 — FINAL CTA
          ========================================== */}
      <section id="download" className="relative z-10 pt-8 pb-32 sm:py-32 px-6 text-center overflow-hidden scroll-mt-24">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg-base)] via-[var(--color-bg-elevated)] to-[var(--color-bg-base)] -z-20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(123,47,255,0.25)_0%,transparent_60%)] -z-10"></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, type: "spring" }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="font-display text-display-xl mb-6 uppercase leading-[0.9] text-white drop-shadow-[0_0_30px_rgba(123,47,255,0.5)]">
            PRÊT À PASSER AU NIVEAU SUPÉRIEUR ?
          </h2>
          <p className="text-xl text-[var(--color-text-primary)]/80 mb-10 font-body">
            L'application arrive sur iOS et Android. Laisse ton email pour être prévenu du lancement.
          </p>

          {waitlistStatus === "success" ? (
            <div className="flex items-center justify-center gap-3 max-w-lg mx-auto mb-8 px-6 py-5 bg-white/10 border border-white/20 rounded-2xl">
              <CheckCircle2 className="w-6 h-6 text-white shrink-0" />
              <p className="text-white font-body font-bold text-left">
                C'est noté ! Tu recevras un email dès que l'app sera disponible.
              </p>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="flex flex-col gap-3 max-w-lg mx-auto mb-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch">
                <label htmlFor="waitlist-email" className="sr-only">Email</label>
                <input
                  id="waitlist-email"
                  type="email"
                  required
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="ton@email.com"
                  className="flex-1 px-6 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 font-body focus:outline-none focus:border-white/60 transition-colors"
                />
                <button
                  type="submit"
                  disabled={waitlistStatus === "loading"}
                  className="group flex items-center justify-center gap-3 px-8 py-4 bg-white text-[var(--color-bg-base)] rounded-2xl font-ui font-bold text-lg hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.2)] disabled:opacity-60 disabled:hover:scale-100"
                >
                  {waitlistStatus === "loading" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5" />}
                  <span>Me prévenir</span>
                </button>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <label htmlFor="waitlist-code" className="text-sm font-body text-white/60 shrink-0">
                  Code salle&nbsp;:
                </label>
                <input
                  id="waitlist-code"
                  type="text"
                  value={waitlistCode}
                  onChange={(e) => setWaitlistCode(e.target.value.toUpperCase())}
                  placeholder="Optionnel — ex. GRACIELYON"
                  maxLength={14}
                  className="w-56 px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-sm tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-white/35 font-body focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors"
                />
              </div>
            </form>
          )}

          {waitlistStatus === "error" && (
            <div className="flex items-center justify-center gap-2 text-sm font-body text-white bg-[var(--color-accent-red)]/20 border border-[var(--color-accent-red)]/40 rounded-xl px-4 py-3 max-w-lg mx-auto mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              L'inscription a échoué. Réessaie dans un instant.
            </div>
          )}

          <p className="text-sm text-[var(--color-text-primary)]/60 uppercase tracking-widest font-ui font-bold">
            Gratuit • Sans engagement • iOS &amp; Android
          </p>
        </motion.div>
      </section>

      {/* FLOATING MOBILE CTA */}
      <AnimatePresence>
        {isMobile && (
          <motion.div
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="fixed bottom-0 left-0 right-0 z-[100] p-4 bg-gradient-to-t from-[var(--color-bg-base)] via-[var(--color-bg-base)]/90 to-transparent pb-6 pointer-events-none"
          >
            <div className="flex gap-3 max-w-md mx-auto pointer-events-auto">
              <a href="#download" className="flex-1 flex justify-center items-center gap-2 bg-[var(--color-accent-primary)] text-white py-4 rounded-2xl font-ui font-bold text-base shadow-[0_10px_40px_rgba(123,47,255,0.4)] active:scale-95 transition-transform">
                <Bell className="w-4 h-4" />
                Être prévenu du lancement
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
