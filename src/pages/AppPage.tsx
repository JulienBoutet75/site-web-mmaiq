import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import {
  Swords, Target, Brain, Zap, Activity, FlameKindling,
  CheckCircle2, X, Play, ChevronRight, Quote,
  Bell, Loader2, AlertCircle
} from "lucide-react";
import { ParticlesBackground } from '../components/ParticlesBackground';
import { GameplanDemo } from '../components/GameplanDemo';
import { insertData } from '../lib/supabase';

// --- ANIMATION VARIANTS ---
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const glitchLeft = {
  hidden: { opacity: 0, x: -50, filter: "blur(4px)" },
  show: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.5, type: "spring" } }
};

const powerRight = {
  hidden: { opacity: 0, x: 50, scale: 0.8 },
  show: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.6, type: "spring", bounce: 0.4 } }
};

export function AppPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (waitlistStatus === "loading") return;
    setWaitlistStatus("loading");
    try {
      await insertData("leads", { type: "waitlist", email: waitlistEmail });
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
    <div className="bg-[#04050A] text-[#F0F4FF] min-h-screen relative overflow-hidden selection:bg-[#7B2FFF] selection:text-white font-body">
      <style dangerouslySetInnerHTML={{__html: `
        .text-gradient-primary {
          background: linear-gradient(to right, #7B2FFF, #FF1744);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }

        .slider-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .slider-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @media (min-width: 640px) {
          .slider-scrollbar::-webkit-scrollbar {
            display: block;
            height: 12px;
          }
          .slider-scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            margin: 0 40px;
          }
          .slider-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(17, 17, 17, 0.6);
            border-radius: 8px;
            border: 2px solid transparent;
            background-clip: padding-box;
          }
          .slider-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(17, 17, 17, 0.9);
          }
          .slider-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(17, 17, 17, 0.6) transparent;
          }
        }
      `}} />

      {/* Existing Particle Background - DO NOT TOUCH */}
      <ParticlesBackground />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(123,47,255,0.15)_0%,transparent_50%)] pointer-events-none z-0"></div>

      {/* ==========================================
          SECTION 1 — ONBOARDING PREVIEW / AUDIENCE
          ========================================== */}
      <section className="relative z-20 pt-16 sm:pt-24 pb-4 sm:pb-12 px-0 sm:px-6 w-full max-w-[1400px] mx-auto sm:min-h-[90vh] flex items-center overflow-hidden">
        <div className="bg-transparent sm:bg-[#7B2FFF] rounded-none sm:rounded-[60px] pt-8 pb-4 sm:p-12 lg:p-16 w-full h-auto min-h-0 sm:min-h-[600px] relative overflow-visible sm:overflow-hidden flex flex-col justify-center sm:shadow-[0_0_50px_rgba(123,47,255,0.25)]">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center h-full">
            {/* Left Content */}
            <div className="lg:col-span-4 xl:col-span-5 flex flex-col justify-center h-full z-10 pb-0 sm:pb-0 px-6 sm:px-0">
              <h1 className="text-4xl sm:text-[60px] lg:text-[75px] leading-[1] font-body tracking-tight text-white mb-3 sm:mb-6 mt-4 sm:mt-0 text-left">
                Il y a un avant<br/>et un après<br className="hidden sm:block"/> <span className="text-[#111111]">MMA IQ.</span>
              </h1>
              <p className="text-white/70 sm:text-white/80 text-base sm:text-xl font-body mb-6 sm:mb-8 leading-relaxed max-w-sm sm:max-w-md mx-0 sm:mx-0 text-left px-0 sm:px-0">
                Nous accompagnons les <span className="font-bold text-white">débutants</span>, les <span className="font-bold text-white">amateurs</span>, les <span className="font-bold text-white">pros</span> et les <span className="font-bold text-white">coachs</span>. Une seule app pour structurer votre évolution.
              </p>
              
              <div className="hidden sm:flex flex-row gap-4 mt-4">
                <a href="#download" className="group flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#111111] rounded-[20px] font-body font-bold text-sm hover:scale-105 transition-all shadow-xl">
                  <Bell className="w-5 h-5" /> Être prévenu du lancement
                </a>
              </div>
            </div>

            {/* Right Slider */}
            <div className="lg:col-span-8 xl:col-span-7 h-[420px] sm:h-[550px] w-[100vw] sm:w-full relative z-10 mt-2 sm:mt-0 px-0 sm:px-0">
               <div className="absolute inset-0 flex items-center overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth slider-scrollbar gap-4 sm:gap-6 pr-8 sm:pr-0 pl-6 sm:pl-0 pb-4 sm:pb-6 pointer-events-auto touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
                  
                  {/* Card 1: Profil */}
                  <div className="snap-center shrink-0 w-[85vw] sm:w-[320px] max-w-[320px] h-[400px] sm:h-[500px] bg-[#111111] rounded-[32px] sm:rounded-[40px] p-5 sm:p-6 flex flex-col relative shadow-2xl border border-white/10">
                     <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 shrink-0"></div>
                     <h3 className="text-white font-body text-2xl font-bold mb-2 text-center shrink-0">Qui es-tu ?</h3>
                     <p className="text-[#8892B0] text-sm font-body mb-4 text-center shrink-0">Personnalisons ton expérience.</p>
                     
                     <div className="flex-1 overflow-y-auto hide-scrollbar space-y-3 mb-4">
                        <div className="flex items-center p-3 sm:p-4 rounded-2xl bg-[#7B2FFF]/10 text-white cursor-pointer hover:bg-[#7B2FFF]/20 transition-all border border-[#7B2FFF] shadow-[0_0_15px_rgba(123,47,255,0.15)] relative overflow-hidden text-left">
                          <div className="flex-1 relative z-10">
                             <div className="font-body font-bold text-[#7B2FFF] text-sm sm:text-base">Combattant(e)</div>
                             <div className="text-[10px] sm:text-xs text-[#7B2FFF]/70 mt-1">Gère ta carrière de A à Z</div>
                          </div>
                          <div className="w-4 h-4 rounded-full border-[4px] border-[#111111] bg-[#7B2FFF] relative z-10 shrink-0 ml-2"></div>
                        </div>
                        <div className="flex items-center p-3 sm:p-4 rounded-2xl bg-white/5 text-white cursor-pointer hover:bg-white/10 transition-all border border-white/10 relative text-left">
                          <div className="flex-1">
                             <div className="font-body font-bold text-sm sm:text-base">Coach</div>
                             <div className="text-[10px] sm:text-xs text-white/50 mt-1">Gère ton roster (Mes Fighters)</div>
                          </div>
                          <div className="w-4 h-4 rounded-full border border-white/30 shrink-0 ml-2"></div>
                        </div>
                        <div className="flex items-center p-3 sm:p-4 rounded-2xl bg-white/5 text-white cursor-pointer hover:bg-white/10 transition-all border border-white/10 relative text-left">
                          <div className="flex-1">
                             <div className="font-body font-bold text-sm sm:text-base">Club / Académie</div>
                             <div className="text-[10px] sm:text-xs text-white/50 mt-1">Développe tes athlètes</div>
                          </div>
                          <div className="w-4 h-4 rounded-full border border-white/30 shrink-0 ml-2"></div>
                        </div>
                     </div>
                     <button className="w-full py-3 sm:py-4 bg-white text-[#111111] font-body font-bold rounded-xl mt-auto shrink-0 transition-transform active:scale-95">Suivant</button>
                  </div>

                  {/* Card 2: Niveau d'expérience */}
                  <div className="snap-center shrink-0 w-[85vw] sm:w-[320px] max-w-[320px] h-[400px] sm:h-[500px] bg-[#111111] rounded-[32px] sm:rounded-[40px] p-5 sm:p-6 flex flex-col relative shadow-2xl border border-white/10">
                     <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 shrink-0"></div>
                     <h3 className="text-white font-body text-2xl font-bold mb-2 text-center shrink-0">Ton niveau</h3>
                     <p className="text-[#8892B0] text-sm font-body mb-4 text-center shrink-0">Pour adapter ton contenu.</p>
                     
                     <div className="flex-1 overflow-y-auto hide-scrollbar space-y-3 mb-4">
                        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 text-white cursor-pointer hover:bg-white/10 transition-all border border-white/10 text-center">
                           <div className="font-body font-bold text-lg">Débutant</div>
                           <div className="text-xs text-white/50 mt-1">J'apprends les bases</div>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#7B2FFF]/10 text-white cursor-pointer transition-all border border-[#7B2FFF] shadow-[0_0_15px_rgba(123,47,255,0.15)] text-center relative overflow-hidden">
                           <div className="font-body font-bold text-[#7B2FFF] text-lg">Amateur</div>
                           <div className="text-xs text-[#7B2FFF]/70 mt-1">Je fais des compétitions</div>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 text-white cursor-pointer hover:bg-white/10 transition-all border border-white/10 text-center">
                           <div className="font-body font-bold text-lg">Professionnel</div>
                           <div className="text-xs text-white/50 mt-1">Le MMA est mon métier</div>
                        </div>
                     </div>
                     <button className="w-full py-3 sm:py-4 bg-white text-[#111111] font-body font-bold rounded-xl mt-auto shrink-0 transition-transform active:scale-95">Valider</button>
                  </div>

                  {/* Card 3: Objectifs */}
                  <div className="snap-center shrink-0 w-[85vw] sm:w-[320px] max-w-[320px] h-[400px] sm:h-[500px] bg-[#111111] rounded-[32px] sm:rounded-[40px] p-5 sm:p-6 flex flex-col relative shadow-2xl border border-white/10">
                     <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 shrink-0"></div>
                     <h3 className="text-white font-body text-2xl font-bold mb-2 text-center shrink-0">Tes objectifs</h3>
                     <p className="text-[#8892B0] text-[10px] sm:text-xs font-body mb-4 text-center shrink-0">Sélectionne tes besoins (1-3).</p>
                     
                     <div className="flex flex-wrap justify-center content-start gap-2 sm:gap-3 flex-1 overflow-y-auto mb-4 hide-scrollbar pt-2">
                        <div className="w-full sm:w-[46%] px-2 py-3 rounded-2xl border border-[#7B2FFF] text-[#7B2FFF] text-[10px] sm:text-xs font-body font-bold bg-[#7B2FFF]/10 text-center flex flex-col items-center justify-center gap-1 shadow-[0_0_15px_rgba(123,47,255,0.1)]">
                           <span className="text-lg">🏋️</span> Plans & Training
                        </div>
                        <div className="w-full sm:w-[46%] px-2 py-3 rounded-2xl border border-white/10 text-white text-[10px] sm:text-xs font-body bg-white/5 text-center flex flex-col items-center justify-center gap-1">
                           <span className="text-lg">🥩</span> Nutrition & Cutting
                        </div>
                        <div className="w-full sm:w-[46%] px-2 py-3 rounded-2xl border border-white/10 text-white text-[10px] sm:text-xs font-body bg-white/5 text-center flex flex-col items-center justify-center gap-1">
                           <span className="text-lg">🩺</span> Dossier Médical
                        </div>
                        <div className="w-full sm:w-[46%] px-2 py-3 rounded-2xl border border-white/10 text-white text-[10px] sm:text-xs font-body bg-white/5 text-center flex flex-col items-center justify-center gap-1">
                           <span className="text-lg">🎯</span> Scouting IA
                        </div>
                     </div>
                     <button className="w-full py-3 sm:py-4 bg-white text-[#111111] font-body font-bold rounded-xl mt-auto shrink-0 transition-transform active:scale-95">Valider</button>
                  </div>

                  {/* Card 4: Suivi Perf & Santé */}
                  <div className="snap-center shrink-0 w-[85vw] sm:w-[320px] max-w-[320px] h-[400px] sm:h-[500px] bg-[#111111] rounded-[32px] sm:rounded-[40px] p-5 sm:p-6 flex flex-col relative shadow-2xl border border-white/10">
                     <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 shrink-0"></div>
                     <h3 className="text-white font-body text-2xl font-bold mb-2 text-center shrink-0">Physiologie</h3>
                     <p className="text-[#8892B0] text-[10px] sm:text-xs font-body mb-4 text-center shrink-0">Connecte tes données de santé.</p>
                     
                     <div className="space-y-4 mt-auto mb-6">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                           <div className="text-white/60 text-[10px] uppercase font-bold mb-1">Synchronisation</div>
                           <div className="text-white text-sm font-bold font-body shadow-[0_0_10px_rgba(255,255,255,0.1)]">Apple Health / Google Fit</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                           <div className="bg-[#7B2FFF]/10 rounded-2xl p-3 border border-[#7B2FFF]/30 text-center">
                              <div className="text-[#7B2FFF] text-[10px] uppercase font-bold text-center">Sommeil</div>
                              <div className="text-white text-xl font-bold font-body mt-1 text-center">7h40</div>
                           </div>
                           <div className="bg-[#FF1744]/10 border border-[#FF1744]/30 rounded-2xl p-3 text-center">
                              <div className="text-[#FF1744] text-[10px] uppercase font-bold text-center">Surentraînement</div>
                              <div className="text-[#FF1744] text-sm font-bold font-body mt-1 text-center">Risque Élevé</div>
                           </div>
                        </div>
                     </div>
                     <button className="w-full py-3 sm:py-4 bg-white/10 text-white font-body font-bold rounded-xl mt-auto shrink-0 transition-transform active:scale-95 border border-white/10">Mesure Santé</button>
                  </div>

                  {/* Card 5: Dashboard Stats */}
                  <div className="snap-center shrink-0 w-[85vw] sm:w-[320px] max-w-[320px] h-[400px] sm:h-[500px] bg-[#111111] rounded-[32px] sm:rounded-[40px] p-5 sm:p-6 flex flex-col relative shadow-2xl border border-white/10">
                     <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>
                     <h3 className="text-white font-body text-2xl font-bold mb-2">Nutrition & Poids</h3>
                     <p className="text-[#8892B0] text-sm font-body mb-6">Objectif pesée et protocoles.</p>
                     
                     <div className="flex-1 overflow-y-auto hide-scrollbar space-y-3 mt-2">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                           <div>
                              <div className="text-white/60 text-[10px] mb-1 uppercase font-bold">Objectif Pesée</div>
                              <div className="text-white text-lg font-bold font-body">70.3 kg</div>
                           </div>
                           <div className="text-[#7B2FFF] text-sm font-bold font-ui">-4.2kg</div>
                        </div>
                        <div className="bg-[#7B2FFF]/10 border border-[#7B2FFF]/30 rounded-2xl p-4 flex items-center gap-3">
                           <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#7B2FFF]/40 to-[#7B2FFF]/10 flex items-center justify-center shrink-0">
                             <FlameKindling className="w-5 h-5 text-[#7B2FFF]" />
                           </div>
                           <div>
                             <div className="text-white text-xs font-bold font-body">Scan de repas</div>
                             <div className="text-[#7B2FFF] text-[10px] font-ui mt-0.5">Analyse : validée</div>
                           </div>
                        </div>
                     </div>
                     <button className="w-full py-3 sm:py-4 bg-white/10 text-white font-body font-bold rounded-xl mt-auto transition-transform active:scale-95 border border-white/10">Voir Protocole</button>
                  </div>

                  {/* Card 6: Stratégie Experte */}
                  <div className="snap-center shrink-0 w-[85vw] sm:w-[320px] max-w-[320px] h-[400px] sm:h-[500px] bg-[#111111] rounded-[32px] sm:rounded-[40px] p-5 sm:p-6 flex flex-col relative shadow-2xl border border-white/10">
                     <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>
                     <div className="flex items-center justify-center gap-2 mb-2">
                        <Zap className="w-5 h-5 text-[#7B2FFF] fill-[#7B2FFF]" />
                        <h3 className="text-white font-body text-2xl font-bold">Stratégie</h3>
                     </div>
                     <p className="text-[#8892B0] text-sm font-body mb-6 text-center">Une analyse par nos experts en stratégie de combat.</p>
                     
                     <div className="bg-white/5 rounded-2xl p-4 border border-[#7B2FFF]/30 mt-auto mb-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#7B2FFF]/10 blur-xl rounded-full"></div>
                        <div className="text-sm text-white/80 font-ui mb-2">Adversaire ciblé : Striker (Gaucher)</div>
                        <div className="text-[#7B2FFF] font-bold text-sm mb-1">✓ Plan d'action :</div>
                        <ul className="text-xs text-white/70 space-y-2 font-ui">
                           <li>- Tourner vers l'extérieur</li>
                           <li>- Low kicks intérieurs fréquents</li>
                           <li>- Casser la distance (Wrestling)</li>
                        </ul>
                     </div>
                     <button className="w-full py-3 sm:py-4 bg-[#7B2FFF] text-white font-body font-bold rounded-xl mt-auto transition-transform active:scale-95 shadow-[0_0_15px_rgba(123,47,255,0.4)]">Demander une analyse</button>
                  </div>

                  {/* Card 7: Summary */}
                  <div className="snap-center shrink-0 w-[85vw] sm:w-[320px] max-w-[320px] h-[400px] sm:h-[500px] bg-[#111111] rounded-[32px] sm:rounded-[40px] p-0 flex flex-col relative shadow-2xl border border-white/10 overflow-hidden">
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(123,47,255,0.35)_0%,transparent_60%)]"></div>
                     <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/80 to-transparent"></div>
                     
                     <div className="relative z-10 flex flex-col h-full p-6">
                       <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>
                       <div className="mt-auto items-center text-center">
                         <div className="w-16 h-16 rounded-full bg-[#7B2FFF] flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(123,47,255,0.5)]">
                           <CheckCircle2 className="w-8 h-8 text-white" />
                         </div>
                         <h3 className="text-white font-body text-3xl font-bold mb-3">Profil prêt !</h3>
                         <p className="text-[#8892B0] text-sm font-body mb-8 px-4 leading-relaxed">Ton tableau de bord personnalisé est configuré. Prêt à dominer ?</p>
                         <button className="w-full py-4 bg-white text-[#111111] font-body font-bold text-lg rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                           Démarrer
                         </button>
                       </div>
                     </div>
                  </div>

               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 1.5 — AUDIENCES 
          ========================================== */}
      <section className="relative z-10 py-12 sm:py-32 px-4 sm:px-6 max-w-[1400px] mx-auto space-y-16 sm:space-y-40">
        {/* Intro */}
        <div className="text-center max-w-4xl mx-auto flex flex-col justify-center snap-center mb-8 sm:mb-0 relative py-12">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[300px] bg-[#7B2FFF]/30 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mx-auto mb-6 relative z-10 shadow-[0_0_20px_rgba(123,47,255,0.15)]">
            <span className="w-2 h-2 rounded-full bg-[#7B2FFF] animate-pulse"></span>
            <span className="text-xs font-ui font-bold text-white tracking-widest uppercase">Évolue quel que soit ton niveau</span>
          </div>
          <h2 className="text-5xl sm:text-[80px] font-display tracking-wide text-white mb-6 uppercase leading-[0.9] drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] relative z-10">
            L'APPLI QUI S'ADAPTE <br className="hidden sm:block"/>
            <span className="text-gradient-primary">À TON PROFIL.</span>
          </h2>
          <p className="text-[#8892B0] text-sm sm:text-lg font-body max-w-2xl mx-auto leading-relaxed relative z-10">
            Du premier cours sur les tatamis jusqu'aux cages de professionnels, notre plateforme t'accompagne avec des outils pensés pour ton stade de développement.
          </p>
        </div>

        {/* Débutants */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-16 items-center sm:min-h-0 snap-center py-6 sm:py-0">
          <div className="order-2 lg:order-1 flex justify-center w-full mt-2 sm:mt-0">
             <div className="w-full max-w-[240px] sm:max-w-[320px] aspect-[320/550] sm:h-[550px] bg-[#111111] rounded-[32px] sm:rounded-[40px] p-5 sm:p-6 relative border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)] overflow-hidden mx-auto flex flex-col origin-top">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#7B2FFF]/20 blur-[50px]"></div>
                <div className="text-[#7B2FFF] font-ui text-[10px] sm:text-xs uppercase tracking-widest mb-4 sm:mb-6 text-center">Phase 1: Apprentissage</div>
                <h4 className="text-white text-lg sm:text-xl font-body font-bold mb-3 sm:mb-4 text-center">Bibliothèque Technique</h4>
                <div className="space-y-2 sm:space-y-3 mt-2 sm:mt-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex gap-3 items-center bg-white/5 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-white/5">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-lg sm:rounded-xl shrink-0 flex items-center justify-center">
                        <Play className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-white text-xs sm:text-sm font-body font-medium">Bases du Striking</div>
                        <div className="text-white/50 text-[10px] sm:text-xs">Module {i}</div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
          <div className="order-1 lg:order-2 text-center lg:text-left px-2 sm:px-0 flex flex-col justify-end">
            <div className="inline-flex items-center justify-center border border-[#7B2FFF]/30 bg-[#7B2FFF]/10 text-[#7B2FFF] font-ui font-bold tracking-widest text-xs sm:text-sm px-4 py-1.5 rounded-full mb-4 sm:mb-6 uppercase shadow-[0_0_15px_rgba(123,47,255,0.15)] mx-auto lg:mx-0">POUR LES DÉBUTANTS</div>
            <h3 className="text-3xl sm:text-5xl font-body font-bold text-white mb-3 sm:mb-6 leading-tight">Les fondations, <br className="hidden sm:block"/>sans frustration.</h3>
            <p className="text-white/70 text-sm sm:text-lg mb-4 sm:mb-8 leading-relaxed font-body max-w-sm mx-auto lg:mx-0">
              Ne te perds plus sur YouTube. MMA IQ structure ton apprentissage avec un programme étape par étape.
            </p>
            <ul className="space-y-2 sm:space-y-4 text-left inline-block lg:block max-w-[280px] sm:max-w-none mx-auto lg:mx-0">
              <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-base">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-[#7B2FFF] shrink-0 mt-0.5" />
                <span className="text-white/80 font-body">Programmes de démarrage complets.</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-base">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-[#7B2FFF] shrink-0 mt-0.5" />
                <span className="text-white/80 font-body">Vidéos techniques détaillées.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Amateurs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-16 items-center sm:min-h-0 snap-center py-6 sm:py-0">
          <div className="text-center lg:text-left px-2 sm:px-0 flex flex-col justify-end">
            <div className="inline-flex items-center justify-center border border-[#7B2FFF]/30 bg-[#7B2FFF]/10 text-[#7B2FFF] font-ui font-bold tracking-widest text-xs sm:text-sm px-4 py-1.5 rounded-full mb-4 sm:mb-6 uppercase shadow-[0_0_15px_rgba(123,47,255,0.15)] mx-auto lg:mx-0">POUR LES AMATEURS</div>
            <h3 className="text-3xl sm:text-5xl font-body font-bold text-white mb-3 sm:mb-6 leading-tight">Nutrition &<br className="hidden sm:block"/>Cutting.</h3>
            <p className="text-white/70 text-sm sm:text-lg mb-4 sm:mb-8 leading-relaxed font-body max-w-sm mx-auto lg:mx-0">
              Prépare tes combats avec la rigueur d'un pro. Scan tes repas par IA et gère ton cutting sans danger.
            </p>
            <ul className="space-y-2 sm:space-y-4 text-left inline-block lg:block max-w-[280px] sm:max-w-none mx-auto lg:mx-0">
              <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-base">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-[#7B2FFF] shrink-0 mt-0.5" />
                <span className="text-white/80 font-body">Scan de repas IA & suivi des macros.</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-base">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-[#7B2FFF] shrink-0 mt-0.5" />
                <span className="text-white/80 font-body">Protocole de Fight Week et déshydratation.</span>
              </li>
            </ul>
          </div>
          <div className="flex justify-center w-full mt-4 sm:mt-0">
             <div className="w-full max-w-[240px] sm:max-w-[320px] aspect-[320/550] sm:h-[550px] bg-[#111111] rounded-[32px] sm:rounded-[40px] p-5 sm:p-6 relative border border-[#7B2FFF]/30 shadow-[0_0_40px_rgba(123,47,255,0.15)] overflow-hidden mx-auto flex flex-col origin-top">
                <div className="absolute top-0 left-0 w-40 h-40 bg-[#7B2FFF]/20 blur-[60px]"></div>
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <span className="text-white font-body font-bold text-lg sm:text-xl">Nutrition</span>
                  <span className="bg-[#7B2FFF]/20 text-[#7B2FFF] text-[10px] sm:text-xs px-2 py-1 rounded font-bold">Cutting</span>
                </div>
                
                <div className="bg-[#7B2FFF]/10 border border-[#7B2FFF]/30 rounded-2xl p-4 mb-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#7B2FFF]/40 to-[#7B2FFF]/10 flex items-center justify-center shrink-0">
                    <FlameKindling className="w-6 h-6 text-[#7B2FFF]" />
                  </div>
                  <div>
                    <div className="text-white text-xs sm:text-sm font-bold font-body">Poulet & Riz grillé</div>
                    <div className="text-white/50 text-[10px] sm:text-xs font-ui">Scan validé — 0% écart</div>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-white/5 border border-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                    <div className="flex justify-between text-white text-xs sm:text-sm font-body font-bold mb-2">
                       <span>Protéines</span>
                       <span>180g / 200g</span>
                    </div>
                    <div className="h-1.5 sm:h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#7B2FFF] w-[90%]"></div>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                    <div className="flex justify-between text-white text-xs sm:text-sm font-body font-bold mb-2">
                       <span>Glucides</span>
                       <span>50g / 150g</span>
                    </div>
                    <div className="h-1.5 sm:h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[30%]"></div>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                    <div className="flex justify-between text-white text-xs sm:text-sm font-body font-bold mb-2">
                       <span>Eau (Sweating)</span>
                       <span>3L / 6L</span>
                    </div>
                    <div className="h-1.5 sm:h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 w-[50%]"></div>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Pros */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-16 items-center sm:min-h-0 snap-center py-6 sm:py-0">
          <div className="order-2 lg:order-1 flex justify-center w-full mt-2 sm:mt-0">
             <div className="w-full max-w-[240px] sm:max-w-[320px] aspect-[320/550] sm:h-[550px] bg-[#111111] rounded-[32px] sm:rounded-[40px] p-5 sm:p-6 relative border border-[#7B2FFF]/30 shadow-[0_0_40px_rgba(123,47,255,0.15)] overflow-hidden mx-auto flex flex-col justify-center origin-top">
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#7B2FFF]/20 blur-[60px]"></div>
                <div className="text-[#7B2FFF] font-ui text-[10px] sm:text-xs uppercase tracking-widest mb-4 truncate text-center">Info Stratégique</div>
                
                <div className="flex justify-between items-end mb-4 sm:mb-6">
                  <div>
                    <div className="text-white text-3xl sm:text-4xl font-body font-bold leading-none mb-1">68%</div>
                    <div className="text-white/50 text-[10px] font-ui">Takedown Def.</div>
                  </div>
                  <div className="bg-[#7B2FFF]/10 text-[#7B2FFF] px-2 py-1 rounded font-bold text-[10px]">VS Gaucher</div>
                </div>

                <div className="space-y-3 sm:space-y-4 relative z-10">
                  <div>
                    <div className="flex justify-between text-[10px] sm:text-xs text-white/70 mb-1 font-ui">
                      <span>Frappes / min</span>
                      <span>5.4</span>
                    </div>
                    <div className="h-1.5 sm:h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#7B2FFF] w-[75%]"></div>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white/80 font-body shadow-inner">
                    <span className="text-[#7B2FFF] font-bold">Faiblesse :</span> Descend la main sur le direct.
                  </div>
                  <div className="bg-[#7B2FFF] text-white p-2.5 sm:p-3 rounded-xl font-bold font-body text-center mt-4 sm:mt-6 text-sm sm:text-base cursor-pointer">
                    Demander l'analyse
                  </div>
                </div>
             </div>
          </div>
          <div className="order-1 lg:order-2 text-center lg:text-left px-2 sm:px-0 flex flex-col justify-end">
            <div className="inline-flex items-center justify-center border border-[#7B2FFF]/30 bg-[#7B2FFF]/10 text-[#7B2FFF] font-ui font-bold tracking-widest text-xs sm:text-sm px-4 py-1.5 rounded-full mb-4 sm:mb-6 uppercase shadow-[0_0_15px_rgba(123,47,255,0.15)] mx-auto lg:mx-0">POUR LES PROS</div>
            <h3 className="text-3xl sm:text-5xl font-body font-bold text-white mb-3 sm:mb-6 leading-tight">L'avantage <br className="hidden sm:block"/>statistique.</h3>
            <p className="text-white/70 text-sm sm:text-lg mb-4 sm:mb-8 leading-relaxed font-body max-w-sm mx-auto lg:mx-0">
              Le détail fait la différence. Profitez d'analyses par nos experts en stratégie pour générer des gameplans précis sur vos adversaires.
            </p>
            <ul className="space-y-2 sm:space-y-4 text-left inline-block lg:block max-w-[280px] sm:max-w-none mx-auto lg:mx-0">
              <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-base">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-[#7B2FFF] shrink-0 mt-0.5" />
                <span className="text-white/80 font-body">Analyse vidéo (Scouting) et chat tactique.</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-base">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-[#7B2FFF] shrink-0 mt-0.5" />
                <span className="text-white/80 font-body">Dossiers médicaux (FMMAF) & santé connectée.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Coachs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-16 items-center sm:min-h-0 snap-center py-6 sm:py-0">
          <div className="text-center lg:text-left px-2 sm:px-0 flex flex-col justify-end mt-4 sm:mt-0">
            <div className="inline-flex items-center justify-center border border-[#7B2FFF]/30 bg-[#7B2FFF]/10 text-[#7B2FFF] font-ui font-bold tracking-widest text-xs sm:text-sm px-4 py-1.5 rounded-full mb-4 sm:mb-6 uppercase shadow-[0_0_15px_rgba(123,47,255,0.15)] mx-auto lg:mx-0">POUR LES COACHS</div>
            <h3 className="text-3xl sm:text-5xl font-body font-bold text-white mb-3 sm:mb-6 leading-tight">Tout ton roster <br className="hidden sm:block"/>dans la poche.</h3>
            <p className="text-white/70 text-sm sm:text-lg mb-4 sm:mb-8 leading-relaxed font-body max-w-sm mx-auto lg:mx-0">
              Gagne du temps en automatisant ta planification et surveillant tes athlètes à distance.
            </p>
            <ul className="space-y-2 sm:space-y-4 text-left inline-block lg:block max-w-[280px] sm:max-w-none mx-auto lg:mx-0">
              <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-base">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-[#7B2FFF] shrink-0 mt-0.5" />
                <span className="text-white/80 font-body">Tableau de bord (Roster).</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-base">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-[#7B2FFF] shrink-0 mt-0.5" />
                <span className="text-white/80 font-body">Alertes surentraînement / blessures.</span>
              </li>
            </ul>
          </div>
          <div className="flex justify-center w-full mt-4 sm:mt-0">
             <div className="w-full max-w-[240px] sm:max-w-[320px] aspect-[320/550] sm:h-[550px] bg-[#111111] rounded-[32px] sm:rounded-[40px] p-5 sm:p-6 relative border border-[#7B2FFF]/30 shadow-[0_0_40px_rgba(123,47,255,0.15)] overflow-hidden mx-auto flex flex-col justify-center origin-top">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#7B2FFF]/10 blur-[80px]"></div>
                
                <h4 className="text-white text-lg sm:text-xl font-body font-bold mb-4 sm:mb-6 text-center">Mon Roster</h4>
                
                <div className="space-y-2 sm:space-y-3 relative z-10 mb-8 sm:mb-12">
                  {/* Athlete 1 */}
                  <div className="bg-white/5 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="flex gap-2 sm:gap-3 items-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#7B2FFF] to-blue-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm">AB</div>
                      <div>
                        <div className="text-white text-xs sm:text-sm font-body font-bold">Amin B.</div>
                        <div className="text-white/50 text-[10px] font-ui">Combat: J-12</div>
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-[#7B2FFF]"></div>
                  </div>
                  
                  {/* Athlete 2 */}
                  <div className="bg-white/5 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="flex gap-2 sm:gap-3 items-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-white/10 to-[#111111] flex items-center justify-center text-white font-bold text-xs sm:text-sm">SL</div>
                      <div>
                        <div className="text-white text-xs sm:text-sm font-body font-bold">Samuel L.</div>
                        <div className="text-white/50 text-[10px] font-ui">Poids: +1.5kg</div>
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-white/5"></div>
                  </div>

                  {/* Athlete 3 */}
                  <div className="bg-white/5 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="flex gap-2 sm:gap-3 items-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-xs sm:text-sm">MJ</div>
                      <div>
                        <div className="text-white text-xs sm:text-sm font-body font-bold">Marie J.</div>
                        <div className="text-white/50 text-[10px] font-ui">Off-season</div>
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-white/20"></div>
                  </div>
                </div>

                <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 p-3 sm:p-4 rounded-xl border border-[#7B2FFF]/30 bg-[#7B2FFF]/10 text-[#7B2FFF] text-[10px] sm:text-xs font-ui text-center">
                  1 Alerte(s) de santé
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 2 — SANS / AVEC (Visual Battle)
          ========================================== */}
      <section className="relative z-10 pt-12 pb-24 px-6 max-w-6xl mx-auto overflow-hidden">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="font-display text-4xl md:text-5xl mb-4 uppercase tracking-wide">
            L'AVANT / APRÈS EST <motion.span animate={{ color: ["#F0F4FF", "#FF1744", "#F0F4FF"], scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="inline-block text-white/30 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">BRUTAL</motion.span>
          </h2>
          <p className="text-[#8892B0] text-sm sm:text-lg max-w-2xl mx-auto">La différence entre ceux qui stagnent et ceux qui performent.</p>
        </div>

        <div className="relative grid grid-cols-2 gap-2 sm:gap-16 items-start">
          
          {/* VS Separator (Desktop) - Removed per user request */}
          
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
                className="flex items-center gap-2 sm:gap-4 p-2 sm:p-5 rounded-xl sm:rounded-2xl bg-white/5 border border-[#FF1744]/10"
              >
                <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <X className="w-3 h-3 sm:w-5 sm:h-5 text-white/30" />
                </div>
                <p className="text-[10px] sm:text-base text-[#8892B0] line-through decoration-white/30 leading-tight">{text}</p>
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
            <h3 className="font-display text-xl sm:text-2xl text-[#7B2FFF] text-center md:text-left mb-4 sm:mb-8 uppercase tracking-widest glow-text">Avec <span className="font-days-one tracking-normal">MMA IQ</span></h3>
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
                className="group flex items-center gap-2 sm:gap-4 p-2 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#7B2FFF]/10 to-[#7B2FFF]/5 border border-[#7B2FFF]/30 hover:border-[#7B2FFF]/50 transition-all duration-300 shadow-[0_0_20px_rgba(123,47,255,0.1)] hover:shadow-[0_0_30px_rgba(123,47,255,0.2)]"
              >
                <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-[#7B2FFF]/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 sm:w-5 sm:h-5 text-[#7B2FFF]" />
                </div>
                <p className="text-[10px] sm:text-base text-[#F0F4FF] font-medium leading-tight">{text}</p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* ==========================================
          SECTION 3 — FEATURE GRID
          ========================================== */}
      <section className="relative z-10 pt-8 pb-12 sm:py-24 px-6 max-w-[1400px] mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="font-display text-4xl md:text-[52px] mb-4 uppercase tracking-wide leading-[0.9]">10 MODULES.<br className="block" /> UN SEUL OBJECTIF.</h2>
          <p className="text-[#8892B0] text-sm sm:text-lg max-w-md sm:max-w-2xl mx-auto leading-tight sm:leading-relaxed">Chaque module est conçu par des combattants, pour des combattants.</p>
        </div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-6"
        >
          {[
            { icon: <Activity />, title: "ENTRAÎNEMENT", desc: "Plans & Bibliothèque" },
            { icon: <FlameKindling />, title: "NUTRITION", desc: "Scan IA & Macros" },
            { icon: <Zap />, title: "CUTTING", desc: "Déshydratation & Poids" },
            { icon: <Target />, title: "SCOUTING", desc: "Fiches Adversaires" },
            { icon: <Activity />, title: "MÉDICAL", desc: "Dossier & Examens" },
            { icon: <Brain />, title: "PERFORMANCE", desc: "Graphiques & Stats" },
            { icon: <Swords />, title: "RÉSEAU", desc: "Clubs & Coachs" },
            { icon: <Quote />, title: "MESSAGERIE", desc: "Discussions & Échanges" },
            { icon: <CheckCircle2 />, title: "CALENDRIER", desc: "Todo-list & Agenda" },
            { icon: <Target />, title: "DASHBOARD", desc: "Tableau de Bord VIP" }
          ].map((feature, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, scale: 0.5 },
                show: { opacity: 1, scale: 1, transition: { type: "spring", bounce: 0.5 } }
              }}
              whileHover={{ scale: 1.05, transition: { type: "spring", stiffness: 400 } }}
              className="group relative bg-[#0C0E18]/80 backdrop-blur-md border border-white/5 p-3 sm:p-6 rounded-xl sm:rounded-[24px] flex flex-col items-center text-center overflow-hidden"
            >
              {/* Hover Glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#7B2FFF]/0 to-[#7B2FFF]/0 group-hover:from-[#7B2FFF]/10 group-hover:to-transparent transition-all duration-500"></div>
              <div className="absolute -inset-px rounded-xl sm:rounded-[24px] border border-transparent group-hover:border-[#7B2FFF]/50 transition-colors duration-500"></div>
              
              <h4 className="font-display text-sm sm:text-lg mb-1 sm:mb-2 tracking-widest uppercase relative z-10">{feature.title}</h4>
              <p className="text-[#8892B0] text-[10px] sm:text-[13px] leading-tight sm:leading-relaxed relative z-10">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ==========================================
          SECTION 4 — GAMEPLAN
          ========================================== */}
      <section className="relative z-10 pt-20 pb-12 sm:py-24 bg-gradient-to-b from-transparent via-[#FF1744]/5 to-transparent border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 items-center">
          
          {/* Left: Interactive Demo */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, type: "spring" }}
            className="w-full flex justify-center lg:justify-start"
          >
            <GameplanDemo />
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
            <p className="text-lg text-[#8892B0] mb-8 leading-relaxed">
              Crée des fiches adversaires complètes, partage-les avec ton coach, et profitez d'une analyse experte et du chat vidéo pour disséquer les habitudes de ton opposant.
            </p>
            
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {[
                "Fiche scouting complète",
                "Vidéo & annotations",
                "Faiblesses & habitudes",
                "Base de données de combats"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-ui font-bold tracking-wide text-[#F0F4FF]">
                  <div className="w-6 h-6 rounded-full bg-[#7B2FFF]/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#7B2FFF]" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <a href="#download" className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 hover:bg-[#7B2FFF] text-white rounded-2xl font-ui font-bold text-lg transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(123,47,255,0.5)] hover:scale-[1.02]">
              Scouter mon adversaire <ChevronRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ==========================================
          SECTION 8 — FINAL CTA
          ========================================== */}
      <section id="download" className="relative z-10 pt-8 pb-32 sm:py-32 px-6 text-center overflow-hidden scroll-mt-24">
        {/* Intense Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#04050A] via-[#2A0E3D] to-[#4A001F] -z-20"></div>
        
        {/* Animated Lightning/Energy SVG Background */}
        <div className="absolute inset-0 opacity-20 -z-10 flex items-center justify-center">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <motion.path
              d="M0,50 Q25,10 50,50 T100,50 T150,50 T200,50"
              fill="none"
              stroke="#FF1744"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              transform="scale(10) translate(0, 20)"
            />
            <motion.path
              d="M0,50 Q25,90 50,50 T100,50 T150,50 T200,50"
              fill="none"
              stroke="#7B2FFF"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1 }}
              transform="scale(10) translate(-10, 30)"
            />
          </svg>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, type: "spring" }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="font-display text-5xl md:text-[64px] mb-6 uppercase leading-[0.9] text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
            PRÊT À PASSER AU NIVEAU SUPÉRIEUR ?
          </h2>
          <p className="text-xl text-[#F0F4FF]/80 mb-10 font-body">
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
                className="group flex items-center justify-center gap-3 px-8 py-4 bg-white text-[#04050A] rounded-2xl font-ui font-bold text-lg hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.2)] disabled:opacity-60 disabled:hover:scale-100"
              >
                {waitlistStatus === "loading" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5" />}
                <span>Me prévenir</span>
              </button>
            </form>
          )}

          {waitlistStatus === "error" && (
            <div className="flex items-center justify-center gap-2 text-sm font-body text-white bg-[#FF1744]/20 border border-[#FF1744]/40 rounded-xl px-4 py-3 max-w-lg mx-auto mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              L'inscription a échoué. Réessaie dans un instant.
            </div>
          )}

          <p className="text-sm text-[#F0F4FF]/60 uppercase tracking-widest font-ui font-bold">
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
            className="fixed bottom-0 left-0 right-0 z-[100] p-4 bg-gradient-to-t from-[#04050A] via-[#04050A]/90 to-transparent pb-6 pointer-events-none"
          >
            <div className="flex gap-3 max-w-md mx-auto pointer-events-auto">
              <a href="#download" className="flex-1 flex justify-center items-center gap-2 bg-[#7B2FFF] text-white py-4 rounded-2xl font-ui font-bold text-base shadow-[0_10px_40px_rgba(123,47,255,0.4)] active:scale-95 transition-transform">
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

