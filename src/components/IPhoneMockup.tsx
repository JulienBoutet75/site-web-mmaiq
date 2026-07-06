import React from 'react';
import { motion } from 'motion/react';
import { Activity, Target, FlameKindling, Zap } from 'lucide-react';

export function IPhoneMockup() {
  return (
    <div className="relative w-full max-w-[300px] mx-auto">
      {/* Pulsing Violet Halo */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 bg-[#7B2FFF] rounded-[50px] blur-3xl -z-10"
      />

      {/* Floating Animation Wrapper */}
      <motion.div
        animate={{
          y: [0, -12, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative bg-[#0C0E18] rounded-[48px] border-[6px] border-[#1A1D2D] shadow-2xl overflow-hidden aspect-[9/19.5] flex flex-col"
      >
        {/* Notch */}
        <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20">
          <div className="w-32 h-6 bg-[#1A1D2D] rounded-b-3xl"></div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 flex flex-col p-5 pt-10 gap-4 relative z-10">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[#8892B0] text-[10px] uppercase font-bold tracking-wider font-rajdhani">Aujourd'hui</p>
              <h3 className="text-[#F0F4FF] text-lg font-bebas tracking-wide">PRÉPARATION</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#7B2FFF]/20 flex items-center justify-center border border-[#7B2FFF]/30">
              <Activity className="w-4 h-4 text-[#7B2FFF]" />
            </div>
          </div>

          {/* Daily Form Score (Animated SVG Arc) */}
          <div className="bg-[#04050A]/50 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#00E5FF]/10 blur-xl rounded-full"></div>
            <p className="text-[#8892B0] text-[10px] uppercase font-bold tracking-wider mb-2 font-rajdhani">Forme du jour</p>
            
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1A1D2D" strokeWidth="8" />
                <motion.circle
                  cx="50" cy="50" r="40" fill="none" stroke="#00E5FF" strokeWidth="8"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 251" }}
                  animate={{ strokeDasharray: "210 251" }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-orbitron font-bold text-[#F0F4FF]">84</span>
                <span className="text-[8px] text-[#00E5FF] font-rajdhani uppercase">Optimal</span>
              </div>
            </div>
          </div>

          {/* Daily Plan Card */}
          <div className="bg-[#04050A]/50 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <FlameKindling className="w-4 h-4 text-[#FF1744]" />
              <h4 className="text-[#F0F4FF] text-sm font-bebas tracking-wide">SPARRING LOURD</h4>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[10px] mb-1 font-rajdhani">
                  <span className="text-[#8892B0]">Intensité</span>
                  <span className="text-[#FF1744]">90%</span>
                </div>
                <div className="h-1.5 bg-[#1A1D2D] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "90%" }}
                    transition={{ duration: 1, delay: 1 }}
                    className="h-full bg-[#FF1744]" 
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1 font-rajdhani">
                  <span className="text-[#8892B0]">Volume</span>
                  <span className="text-[#FFD600]">60%</span>
                </div>
                <div className="h-1.5 bg-[#1A1D2D] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "60%" }}
                    transition={{ duration: 1, delay: 1.2 }}
                    className="h-full bg-[#FFD600]" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Red Gameplan Badge */}
          <div className="mt-auto bg-gradient-to-r from-[#FF1744]/20 to-transparent border border-[#FF1744]/30 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FF1744]/20 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-[#FF1744]" />
            </div>
            <div>
              <p className="text-[#F0F4FF] text-xs font-bold font-rajdhani">Gameplan généré</p>
              <p className="text-[#8892B0] text-[9px]">Adversaire: Striker</p>
            </div>
            <Zap className="w-4 h-4 text-[#FFD600] ml-auto" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
