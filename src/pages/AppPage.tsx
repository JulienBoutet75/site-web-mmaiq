import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, Link } from 'react-router-dom';
import {
  CheckCircle2, X, ChevronRight, Timer, Users,
  Bell, Loader2, AlertCircle
} from "lucide-react";
import { ParticlesBackground } from '../components/ParticlesBackground';
import { PhoneFrame } from '../components/PhoneFrame';
import { submitLead } from '../lib/supabase';

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

export function AppPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (waitlistStatus === "loading") return;
    setWaitlistStatus("loading");
    try {
      await submitLead({ type: "waitlist", email: waitlistEmail });
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

      <ParticlesBackground />
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
            <h1 className="font-display text-5xl sm:text-[72px] lg:text-[84px] leading-[0.92] uppercase tracking-wide text-white mb-5">
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
            <p className="text-center text-[10px] uppercase tracking-widest text-[var(--color-text-secondary)]/70 font-ui mt-4">Capture réelle de l'application</p>
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 1.5 — AUDIENCES
          ========================================== */}
      <section className="relative z-10 py-12 sm:py-32 px-4 sm:px-6 max-w-[1400px] mx-auto space-y-16 sm:space-y-40">
        {/* Intro */}
        <div className="text-center max-w-4xl mx-auto flex flex-col justify-center snap-center mb-8 sm:mb-0 relative py-12">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[300px] bg-[var(--color-accent-primary)]/30 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mx-auto mb-6 relative z-10 shadow-[0_0_20px_rgba(123,47,255,0.15)]">
            <span className="w-2 h-2 rounded-full bg-[var(--color-accent-primary)] animate-pulse"></span>
            <span className="text-xs font-ui font-bold text-white tracking-widest uppercase">Évolue quel que soit ton niveau</span>
          </div>
          <h2 className="text-5xl sm:text-[80px] font-display tracking-wide text-white mb-6 uppercase leading-[0.9] drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] relative z-10">
            L'APPLI QUI S'ADAPTE <br className="hidden sm:block"/>
            <span className="text-gradient-primary">À TON PROFIL.</span>
          </h2>
          <p className="text-[var(--color-text-secondary)] text-sm sm:text-lg font-body max-w-2xl mx-auto leading-relaxed relative z-10">
            Du premier cours sur les tatamis jusqu'aux cages de professionnels, notre plateforme t'accompagne avec des outils pensés pour ton stade de développement.
          </p>
        </div>

        {/* Débutants */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-16 items-center snap-center py-6 sm:py-0">
          <div className="order-2 lg:order-1 flex justify-center w-full mt-2 sm:mt-0">
            <PhoneFrame
              src="/app/videos/tutoriels.mp4"
              poster="/app/videos/tutoriels-poster.webp"
              label="La bibliothèque de tutoriels vidéo de MMA IQ"
            />
          </div>
          <div className="order-1 lg:order-2 text-center lg:text-left px-2 sm:px-0 flex flex-col justify-end">
            <div className="inline-flex items-center justify-center border border-[var(--color-accent-primary)]/30 bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] font-ui font-bold tracking-widest text-xs sm:text-sm px-4 py-1.5 rounded-full mb-4 sm:mb-6 uppercase shadow-[0_0_15px_rgba(123,47,255,0.15)] mx-auto lg:mx-0">POUR LES DÉBUTANTS</div>
            <h3 className="text-3xl sm:text-5xl font-body font-bold text-white mb-3 sm:mb-6 leading-tight">Les fondations, <br className="hidden sm:block"/>sans frustration.</h3>
            <p className="text-white/70 text-sm sm:text-lg mb-4 sm:mb-8 leading-relaxed font-body max-w-sm mx-auto lg:mx-0">
              Ne te perds plus sur YouTube. MMA IQ structure ton apprentissage avec un programme étape par étape.
            </p>
            <ul className="space-y-2 sm:space-y-4 text-left inline-block lg:block max-w-[280px] sm:max-w-none mx-auto lg:mx-0">
              <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-base">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-[var(--color-accent-primary)] shrink-0 mt-0.5" />
                <span className="text-white/80 font-body">Programmes de démarrage complets.</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-base">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-[var(--color-accent-primary)] shrink-0 mt-0.5" />
                <span className="text-white/80 font-body">Vidéos techniques par discipline et par thème.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Amateurs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-16 items-center snap-center py-6 sm:py-0">
          <div className="text-center lg:text-left px-2 sm:px-0 flex flex-col justify-end">
            <div className="inline-flex items-center justify-center border border-[var(--color-accent-primary)]/30 bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] font-ui font-bold tracking-widest text-xs sm:text-sm px-4 py-1.5 rounded-full mb-4 sm:mb-6 uppercase shadow-[0_0_15px_rgba(123,47,255,0.15)] mx-auto lg:mx-0">POUR LES AMATEURS</div>
            <h3 className="text-3xl sm:text-5xl font-body font-bold text-white mb-3 sm:mb-6 leading-tight">Nutrition &<br className="hidden sm:block"/>Cutting.</h3>
            <p className="text-white/70 text-sm sm:text-lg mb-4 sm:mb-8 leading-relaxed font-body max-w-sm mx-auto lg:mx-0">
              Prépare tes combats avec la rigueur d'un pro. Prends ton assiette en photo : l'IA détecte les aliments et remplit tes macros.
            </p>
            <ul className="space-y-2 sm:space-y-4 text-left inline-block lg:block max-w-[280px] sm:max-w-none mx-auto lg:mx-0">
              <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-base">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-[var(--color-accent-primary)] shrink-0 mt-0.5" />
                <span className="text-white/80 font-body">Scan de repas IA &amp; suivi des macros.</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-base">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-[var(--color-accent-primary)] shrink-0 mt-0.5" />
                <span className="text-white/80 font-body">Protocole de fight week et déshydratation encadrée.</span>
              </li>
            </ul>
          </div>
          <div className="flex justify-center w-full mt-4 sm:mt-0">
            <PhoneFrame
              src="/app/videos/nutrition-scan.mp4"
              poster="/app/videos/nutrition-scan-poster.webp"
              label="Le scan de repas IA de MMA IQ : aliments détectés avec 90% de confiance"
            />
          </div>
        </div>

        {/* Pros */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-16 items-center snap-center py-6 sm:py-0">
          <div className="order-2 lg:order-1 flex justify-center w-full mt-2 sm:mt-0">
            <PhoneFrame
              src="/app/videos/analyse-video.mp4"
              poster="/app/videos/analyse-video-poster.webp"
              label="L'analyse vidéo IA de MMA IQ : résumé et cartes striking, wrestling, cardio"
            />
          </div>
          <div className="order-1 lg:order-2 text-center lg:text-left px-2 sm:px-0 flex flex-col justify-end">
            <div className="inline-flex items-center justify-center border border-[var(--color-accent-primary)]/30 bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] font-ui font-bold tracking-widest text-xs sm:text-sm px-4 py-1.5 rounded-full mb-4 sm:mb-6 uppercase shadow-[0_0_15px_rgba(123,47,255,0.15)] mx-auto lg:mx-0">POUR LES PROS</div>
            <h3 className="text-3xl sm:text-5xl font-body font-bold text-white mb-3 sm:mb-6 leading-tight">L'avantage <br className="hidden sm:block"/>statistique.</h3>
            <p className="text-white/70 text-sm sm:text-lg mb-4 sm:mb-8 leading-relaxed font-body max-w-sm mx-auto lg:mx-0">
              Le détail fait la différence. Importe un combat (fichier ou lien YouTube) et l'IA en décortique les patterns.
            </p>
            <ul className="space-y-2 sm:space-y-4 text-left inline-block lg:block max-w-[280px] sm:max-w-none mx-auto lg:mx-0">
              <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-base">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-[var(--color-accent-primary)] shrink-0 mt-0.5" />
                <span className="text-white/80 font-body">Analyse vidéo IA : striking, wrestling, cardio, défense.</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-base">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-[var(--color-accent-primary)] shrink-0 mt-0.5" />
                <span className="text-white/80 font-body">Dossier médical &amp; données santé connectées.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Coachs — offre réelle Coach Suite, sans faux écran */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-16 items-center snap-center py-6 sm:py-0">
          <div className="text-center lg:text-left px-2 sm:px-0 flex flex-col justify-end mt-4 sm:mt-0">
            <div className="inline-flex items-center justify-center border border-[var(--color-accent-primary)]/30 bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] font-ui font-bold tracking-widest text-xs sm:text-sm px-4 py-1.5 rounded-full mb-4 sm:mb-6 uppercase shadow-[0_0_15px_rgba(123,47,255,0.15)] mx-auto lg:mx-0">POUR LES COACHS</div>
            <h3 className="text-3xl sm:text-5xl font-body font-bold text-white mb-3 sm:mb-6 leading-tight">Tout ton roster <br className="hidden sm:block"/>dans la poche.</h3>
            <p className="text-white/70 text-sm sm:text-lg mb-4 sm:mb-8 leading-relaxed font-body max-w-sm mx-auto lg:mx-0">
              Gagne du temps en automatisant ta planification et en surveillant tes athlètes à distance.
            </p>
            <ul className="space-y-2 sm:space-y-4 text-left inline-block lg:block max-w-[280px] sm:max-w-none mx-auto lg:mx-0">
              <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-base">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-[var(--color-accent-primary)] shrink-0 mt-0.5" />
                <span className="text-white/80 font-body">Tableau de bord multi-athlètes.</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-base">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-[var(--color-accent-primary)] shrink-0 mt-0.5" />
                <span className="text-white/80 font-body">Messagerie et mise en relation avec les pratiquants.</span>
              </li>
            </ul>
          </div>
          <div className="flex justify-center w-full mt-4 sm:mt-0">
            <div className="relative w-full max-w-[420px] rounded-[24px] border border-[var(--color-tier-coach)]/30 bg-[var(--color-bg-surface)] p-6 sm:p-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--color-tier-coach)]/15 blur-[60px] pointer-events-none"></div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 text-[var(--color-tier-coach)] bg-[var(--color-tier-coach)]/10 border border-[var(--color-tier-coach)]/30">
                <Users className="w-3 h-3" /> Offre dédiée
              </div>
              <h4 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-white mb-1">
                <span className="font-days-one text-base sm:text-lg tracking-normal mr-2">MMA IQ</span>
                <span className="text-[var(--color-tier-coach)]">Coach Suite</span>
              </h4>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="font-accent text-3xl text-white">19,99€</span>
                <span className="text-[var(--color-text-secondary)] text-sm font-body">/ mois</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {['Outils coach complets', 'Suivi de performance des athlètes', 'Tableau de bord multi-athlètes', '150 crédits IA / mois'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white/80 font-body">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--color-tier-coach)]" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/tarifs" className="inline-flex items-center gap-2 text-sm font-ui font-bold text-white bg-[var(--color-accent-primary)]/20 hover:bg-[var(--color-accent-primary)]/30 border border-[var(--color-accent-primary)]/30 px-5 py-3 rounded-xl transition-colors">
                Voir l'offre coach <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 2 — FIGHT CAMP
          ========================================== */}
      <section className="relative z-10 py-20 sm:py-28 border-y border-white/5 bg-gradient-to-b from-transparent via-[var(--color-bg-elevated)]/40 to-transparent">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 border border-[var(--color-accent-primary)]/30 bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] font-ui font-bold tracking-widest text-xs sm:text-sm px-4 py-1.5 rounded-full mb-6 uppercase shadow-[0_0_15px_rgba(123,47,255,0.15)]">
              <Timer className="w-4 h-4" /> Fight Camp
            </div>
            <h2 className="font-display text-4xl md:text-[52px] mb-6 uppercase leading-[0.92] tracking-wide">
              Une date de combat.<br/><span className="text-gradient-primary">Tout s'aligne.</span>
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] mb-8 leading-relaxed max-w-xl">
              Renseigne ta date de combat, ta discipline et ton poids cible : MMA IQ évalue la faisabilité de ta coupe,
              planifie les phases du camp — perte de gras, fight week, refuel post-pesée — et réaligne automatiquement
              tes plans d'entraînement et de nutrition. Le compte à rebours <span className="text-white font-bold">J-X</span> vit sur ton tableau de bord.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {[
                "Analyse de faisabilité de la coupe",
                "Plans alignés sur le jour J",
                "Fiche adversaire & gameplan intégrés",
                "Garde-fous santé à chaque phase"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-ui font-bold tracking-wide text-[var(--color-text-primary)]">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-accent-primary)]/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-accent-primary)]" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <a href="#download" className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 hover:bg-[var(--color-accent-primary)] text-white rounded-full font-ui font-bold text-lg transition-all hover:shadow-[0_0_40px_rgba(123,47,255,0.5)] hover:scale-[1.02]">
              Préparer mon prochain combat <ChevronRight className="w-5 h-5" />
            </a>
          </div>
          <div className="flex justify-center">
            <PhoneFrame
              src="/app/videos/entrainement-live.mp4"
              poster="/app/videos/entrainement-live-poster.webp"
              label="Une séance d'entraînement suivie en direct dans MMA IQ pendant un fight camp"
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
          <h2 className="font-display text-4xl md:text-[52px] mb-4 uppercase tracking-wide leading-[0.9]">8 MODULES.<br className="block" /> UN SEUL OBJECTIF.</h2>
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
            <h2 className="font-display text-4xl md:text-[52px] mb-6 uppercase leading-[0.9] tracking-wide">
              ÉCRASE TON ADVERSAIRE <span className="text-white/30">PAR LA STRATÉGIE</span>
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] mb-8 leading-relaxed">
              Recherche ton adversaire, laisse l'IA remplir sa fiche — style de combat, faiblesses, gestion du risque —
              puis génère les points d'attaque recommandés et la stratégie de combat suggérée. À partager avec ton coach.
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {[
                "Fiche adversaire auto-remplie",
                "Forces, faiblesses & patterns",
                "Points d'attaque recommandés",
                "Stratégie de combat suggérée"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-ui font-bold tracking-wide text-[var(--color-text-primary)]">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-accent-primary)]/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-accent-primary)]" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <a href="#download" className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 hover:bg-[var(--color-accent-primary)] text-white rounded-full font-ui font-bold text-lg transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(123,47,255,0.5)] hover:scale-[1.02]">
              Scouter mon adversaire <ChevronRight className="w-5 h-5" />
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
          <h2 className="font-display text-5xl md:text-[64px] mb-6 uppercase leading-[0.9] text-white drop-shadow-[0_0_30px_rgba(123,47,255,0.5)]">
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
            <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3 justify-center items-stretch max-w-lg mx-auto mb-4">
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
