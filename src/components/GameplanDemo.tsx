import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Shield, Zap, ChevronLeft, ChevronRight, Crosshair } from 'lucide-react';

const GAMEPLANS = [
  {
    id: 1,
    opponent: "Le Lutteur (Pression)",
    type: "Grappler offensif",
    distance: "Maintenir la distance, déplacements latéraux constants.",
    defense: "Sprawl réactif, underhooks obligatoires au clinch.",
    attacks: ["Uppercuts en contre", "Genoux au centre"],
    color: "#FF1744",
    bg: "from-[#FF1744]/20 to-transparent",
    border: "border-[#FF1744]/30"
  },
  {
    id: 2,
    opponent: "Le Striker (Allonge)",
    type: "Kickboxer / Sniper",
    distance: "Casser la distance agressivement, coller à la cage.",
    defense: "Garde haute fermée, bloquer les low kicks.",
    attacks: ["Overhand droit", "Takedowns sur les kicks"],
    color: "#00E5FF",
    bg: "from-[#00E5FF]/20 to-transparent",
    border: "border-[#00E5FF]/30"
  },
  {
    id: 3,
    opponent: "Le Jiu-Jitsuka",
    type: "Spécialiste soumissions",
    distance: "Garder le centre de la cage, refuser le sol.",
    defense: "Posture haute si amené au sol, pas de scramble risqué.",
    attacks: ["Ground & Pound lourd", "Frappes au corps"],
    color: "#FFD600",
    bg: "from-[#FFD600]/20 to-transparent",
    border: "border-[#FFD600]/30"
  }
];

export function GameplanDemo() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      nextPlan();
    }, 5000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const nextPlan = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % GAMEPLANS.length);
  };

  const prevPlan = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + GAMEPLANS.length) % GAMEPLANS.length);
  };

  const current = GAMEPLANS[currentIndex];

  return (
    <div className="w-full max-w-md mx-auto bg-[#0C0E18] rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="bg-[#1A1D2D] p-3 sm:p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-[#a020f0]/20 flex items-center justify-center">
            <Target className="w-3 h-3 sm:w-4 sm:h-4 text-[#a020f0]" />
          </div>
          <h3 className="text-[#F0F4FF] font-bebas tracking-wide text-base sm:text-lg">ANALYSES EXPERTES</h3>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <button onClick={prevPlan} className="p-1 hover:bg-white/10 rounded-md transition-colors">
            <ChevronLeft className="w-4 h-4 text-[#8892B0]" />
          </button>
          <button onClick={nextPlan} className="p-1 hover:bg-white/10 rounded-md transition-colors">
            <ChevronRight className="w-4 h-4 text-[#8892B0]" />
          </button>
        </div>
      </div>

      {/* Content Carousel */}
      <div className="p-4 sm:p-6 min-h-[280px] relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -50 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col h-full"
          >
            {/* Opponent Profile */}
            <div className={`bg-gradient-to-r ${current.bg} border ${current.border} rounded-xl p-3 sm:p-4 mb-4 flex items-center justify-between`}>
              <div>
                <p className="text-[#8892B0] text-[10px] font-rajdhani uppercase tracking-wider mb-0.5">Adversaire</p>
                <h4 className="text-[#F0F4FF] font-bebas text-lg sm:text-xl tracking-wide" style={{ color: current.color }}>
                  {current.opponent}
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded bg-[#04050A]/50 text-white border border-white/10">
                {current.type}
              </span>
            </div>

            {/* Strategy Details */}
            <div className="space-y-2 sm:space-y-3 flex-1">
              <div className="bg-[#04050A] border border-white/5 rounded-lg p-2.5 sm:p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Crosshair className="w-3 h-3 text-[#8892B0]" />
                  <p className="text-[#8892B0] text-[10px] font-rajdhani uppercase tracking-wider">Distance & Déplacement</p>
                </div>
                <p className="text-[#F0F4FF] text-xs sm:text-sm font-dm leading-snug">{current.distance}</p>
              </div>
              
              <div className="bg-[#04050A] border border-white/5 rounded-lg p-2.5 sm:p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-3 h-3 text-[#8892B0]" />
                  <p className="text-[#8892B0] text-[10px] font-rajdhani uppercase tracking-wider">Focus Défensif</p>
                </div>
                <p className="text-[#F0F4FF] text-xs sm:text-sm font-dm leading-snug">{current.defense}</p>
              </div>

              <div className="bg-[#04050A] border border-white/5 rounded-lg p-2.5 sm:p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap className="w-3 h-3 text-[#8892B0]" />
                  <p className="text-[#8892B0] text-[10px] font-rajdhani uppercase tracking-wider">Armes Prioritaires</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {current.attacks.map((attack, idx) => (
                    <span key={idx} className="bg-white/5 text-[#F0F4FF] text-[10px] sm:text-xs px-2 py-1 rounded border border-white/10">
                      {attack}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Indicators */}
        <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {GAMEPLANS.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-[#7B2FFF]' : 'w-1.5 bg-white/20'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

