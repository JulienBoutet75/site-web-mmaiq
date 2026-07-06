import { motion, useMotionValue, animate } from "motion/react";
import { useEffect, useState, useMemo } from "react";
import { Swords, Target, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { ParticlesBackground } from "../components/ParticlesBackground";

export function About() {
  // Stats animation
  const count1 = useMotionValue(0);
  const count2 = useMotionValue(0);
  const count3 = useMotionValue(0);
  
  const [displayCount1, setDisplayCount1] = useState(0);
  const [displayCount2, setDisplayCount2] = useState(0);
  const [displayCount3, setDisplayCount3] = useState(0);

  useEffect(() => {
    const controls1 = animate(count1, 12000, { duration: 2, ease: "easeOut" });
    const controls2 = animate(count2, 10, { duration: 2, ease: "easeOut" });
    const controls3 = animate(count3, 3, { duration: 2, ease: "easeOut" });

    const unsubscribe1 = count1.on("change", (latest) => setDisplayCount1(Math.round(latest)));
    const unsubscribe2 = count2.on("change", (latest) => setDisplayCount2(Math.round(latest)));
    const unsubscribe3 = count3.on("change", (latest) => setDisplayCount3(Math.round(latest)));

    return () => {
      controls1.stop();
      controls2.stop();
      controls3.stop();
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    };
  }, []);

  const heroWords1 = "LE MMA MÉRITAIT MIEUX.".split(" ");
  const heroWords2 = "ON L'A CONSTRUIT.".split(" ");

  const tags = [
    { text: "Boxe anglaise", color: "violet", size: "text-2xl" },
    { text: "Muay-Thaï", color: "violet", size: "text-3xl" },
    { text: "Kickboxing", color: "violet", size: "text-xl" },
    { text: "Karaté", color: "violet", size: "text-lg" },
    { text: "Savate", color: "violet", size: "text-base" },
    { text: "Taekwondo", color: "violet", size: "text-lg" },
    { text: "Lutte", color: "rouge", size: "text-3xl" },
    { text: "Judo", color: "rouge", size: "text-2xl" },
    { text: "Sambo", color: "rouge", size: "text-xl" },
    { text: "BJJ", color: "rouge", size: "text-4xl" },
    { text: "Luta Livre", color: "rouge", size: "text-lg" },
    { text: "Catch Wrestling", color: "rouge", size: "text-base" },
    { text: "Nutrition", color: "cyan", size: "text-2xl" },
    { text: "Préparation mentale", color: "cyan", size: "text-xl" },
    { text: "Analyse vidéo", color: "cyan", size: "text-lg" },
    { text: "Récupération", color: "cyan", size: "text-base" },
    { text: "Plyométrie", color: "cyan", size: "text-base" },
    { text: "Gameplan", color: "or", size: "text-3xl" },
    { text: "Stratégie", color: "or", size: "text-2xl" },
    { text: "Performance data", color: "or", size: "text-xl" },
    { text: "Coaching structuré", color: "or", size: "text-2xl" },
  ];

  const getTagStyle = (color: string) => {
    switch (color) {
      case 'violet': return 'hover:bg-[#7B2FFF] hover:shadow-[0_0_15px_#7B2FFF]';
      case 'rouge': return 'hover:bg-[#FF1744] hover:shadow-[0_0_15px_#FF1744]';
      case 'cyan': return 'hover:bg-[#00E5FF] hover:shadow-[0_0_15px_#00E5FF]';
      case 'or': return 'hover:bg-[#FFD600] hover:shadow-[0_0_15px_#FFD600]';
      default: return '';
    }
  };

  const tagsWithPositions = useMemo(() => {
    return tags.map(tag => ({
      ...tag,
      top: Math.random() * 80 + 10,
      left: Math.random() * 80 + 10,
    }));
  }, []);

  return (
    <div className="bg-[#04050A] text-[#F0F4FF] min-h-screen font-body overflow-hidden relative">
      <ParticlesBackground color="123, 47, 255" />
      {/* SECTION 1 — HERO STATEMENT */}
      <section className="relative w-full min-h-[80vh] flex flex-col items-center justify-center text-center px-4 pt-32 pb-10 md:pb-20">
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-20 pointer-events-none">
          <svg className="w-full h-64" viewBox="0 0 1000 200" preserveAspectRatio="none">
            <motion.path
              d="M0,100 L200,100 L250,50 L300,150 L350,20 L400,180 L450,100 L1000,100"
              fill="none"
              stroke="#7B2FFF"
              strokeWidth="4"
              initial={{ pathLength: 0, strokeDashoffset: 1000 }}
              animate={{ pathLength: 1, strokeDashoffset: 0 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </svg>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto w-full">
          <div className="flex flex-nowrap justify-center gap-x-2 md:gap-x-4 mb-1 md:mb-2 w-full">
            {heroWords1.map((word, i) => (
              <motion.span
                key={`w1-${i}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.1, 1], opacity: 1 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="font-display text-[7.5vw] sm:text-5xl md:text-[80px] text-white tracking-tight leading-none"
              >
                {word}
              </motion.span>
            ))}
          </div>
          <div className="flex flex-nowrap justify-center gap-x-2 md:gap-x-4 mb-4 md:mb-8 w-full">
            {heroWords2.map((word, i) => (
              <motion.span
                key={`w2-${i}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.1, 1], opacity: 1 }}
                transition={{ duration: 0.5, delay: (heroWords1.length + i) * 0.05 }}
                className="font-display text-[7.5vw] sm:text-5xl md:text-[80px] text-transparent bg-clip-text bg-gradient-to-r from-[#7B2FFF] to-[#FF1744] tracking-tight leading-none"
              >
                {word}
              </motion.span>
            ))}
          </div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-[#8892B0] text-base md:text-[20px] max-w-2xl mx-auto px-4"
          >
            <span className="font-days-one tracking-normal">MMA IQ</span> est né d'un constat simple : le MMA manque d'outils structurés pour progresser vraiment.
          </motion.p>
        </div>
      </section>

      {/* SECTION 2 — ORIGIN STORY */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-24">
        <div className="flex flex-col lg:flex-row gap-12 md:gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-[60%]"
          >
            <span className="text-[#7B2FFF] uppercase tracking-widest text-sm font-bold mb-4 block">POURQUOI <span className="font-days-one tracking-normal">MMA IQ</span></span>
            <h2 className="font-display text-4xl md:text-[48px] leading-none mb-6 text-white">TROP DE CONTENU. PAS ASSEZ DE MÉTHODE.</h2>
            <p className="text-[#F0F4FF] text-base md:text-[16px] mb-8 leading-relaxed">
              <span className="font-days-one tracking-normal">MMA IQ</span> est né d'un constat simple : le MMA manque d'outils structurés pour progresser vraiment. Trop de contenu éparpillé, pas assez de méthode. On a construit la plateforme qu'on aurait voulu avoir — une app de performance digitale et un catalogue de formations premium, le tout connecté.
            </p>
            <div className="border-l-[3px] border-[#7B2FFF] bg-[#7B2FFF]/[0.08] p-5 rounded-r-lg">
              <p className="italic text-[18px] text-white">"On a construit la plateforme qu'on aurait voulu avoir."</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-[40%] flex justify-center relative"
          >
            <div className="absolute inset-0 bg-[#7B2FFF]/20 blur-[100px] rounded-full animate-pulse"></div>
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full p-[2px] overflow-hidden flex items-center justify-center shadow-[0_0_30px_rgba(123,47,255,0.3)]">
              <div className="absolute inset-0 animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0%,transparent_40%,#7B2FFF_80%,#FF1744_100%)]"></div>
              <div className="absolute inset-[2px] bg-[#0C0E18] rounded-full z-0"></div>
              
              <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                <div className="text-center mb-4">
                  <div className="font-[Orbitron] text-2xl md:text-3xl text-white font-bold">{displayCount1.toLocaleString()}+</div>
                  <div className="text-[10px] md:text-xs text-[#8892B0] uppercase tracking-wider">combattants actifs</div>
                </div>
                <div className="text-center mb-4">
                  <div className="font-[Orbitron] text-2xl md:text-3xl text-white font-bold">{displayCount2}+</div>
                  <div className="text-[10px] md:text-xs text-[#8892B0] uppercase tracking-wider">coachs certifiés</div>
                </div>
                <div className="text-center">
                  <div className="font-[Orbitron] text-2xl md:text-3xl text-white font-bold">{displayCount3} ans</div>
                  <div className="text-[10px] md:text-xs text-[#8892B0] uppercase tracking-wider">de R&D terrain</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 3 — VISION / MÉTHODE / ÉQUIPE */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-4xl md:text-[52px] text-center mb-10 md:mb-16 text-white"
        >
          CE QUI NOUS DÉFINIT
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Card 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="group relative bg-[#0C0E18]/80 backdrop-blur-md p-6 rounded-2xl border border-white/5 overflow-hidden hover:-translate-y-1.5 transition-transform duration-300"
          >
            <h3 className="font-display text-2xl md:text-[28px] mb-3 text-white">NOTRE VISION</h3>
            <p className="text-[#8892B0] text-[15px] leading-relaxed">
              Démocratiser l'accès à un coaching structuré et data-driven. Du débutant au pro, chacun mérite une méthode.
            </p>
            <div className="absolute bottom-0 left-0 h-[3px] w-full bg-[#7B2FFF] -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="group relative bg-[#0C0E18]/80 backdrop-blur-md p-6 rounded-2xl border border-white/5 overflow-hidden hover:-translate-y-1.5 transition-transform duration-300"
          >
            <h3 className="font-display text-2xl md:text-[28px] mb-3 text-white">NOTRE MÉTHODE</h3>
            <p className="text-[#8892B0] text-[15px] leading-relaxed">
              Anti-blabla. Chaque contenu est concret, actionnable, testé terrain. Structure + répétition + feedback = progression.
            </p>
            <div className="absolute bottom-0 left-0 h-[3px] w-full bg-[#7B2FFF] -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="group relative bg-[#0C0E18]/80 backdrop-blur-md p-6 rounded-2xl border border-white/5 overflow-hidden hover:-translate-y-1.5 transition-transform duration-300"
          >
            <h3 className="font-display text-2xl md:text-[28px] mb-3 text-white">NOTRE ÉQUIPE</h3>
            <p className="text-[#8892B0] text-[15px] leading-relaxed">
              Coachs reconnus, développeurs passionnés de MMA, experts en performance. On construit ce qu'on utilise.
            </p>
            <div className="absolute bottom-0 left-0 h-[3px] w-full bg-[#7B2FFF] -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 4 — DISCIPLINES */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-4xl md:text-[52px] text-center mb-10 md:mb-16 text-white"
        >
          LES DISCIPLINES QU'ON MAÎTRISE
        </motion.h2>
        
        <div className="relative w-full h-auto min-h-[300px] md:h-[400px] flex flex-wrap justify-center items-center gap-4 md:block">
          {tagsWithPositions.map((tag, i) => {
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className={`
                  md:absolute px-4 py-2 rounded-full border border-white/10 bg-[#0C0E18] text-[#8892B0] 
                  cursor-pointer transition-all duration-300 hover:text-white hover:scale-110 z-10 hover:z-20
                  ${tag.size} ${getTagStyle(tag.color)}
                `}
                style={{
                  top: `calc(${tag.top}% - 20px)`,
                  left: `calc(${tag.left}% - 50px)`,
                }}
              >
                {tag.text}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* SECTION 5 — MANIFESTE FINAL */}
      <section className="w-full bg-[#0C0E18] py-24 md:py-32 px-6 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-[#7B2FFF]/5 blur-[100px] rounded-full"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-5xl md:text-[64px] text-white mb-6"
          >
            ON CONSTRUIT CE QU'ON UTILISE.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[#F0F4FF] text-lg md:text-[20px] mb-12"
          >
            Pas une startup tech qui regarde le MMA de loin.<br className="hidden md:block" />
            Des gens du milieu, pour le milieu.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link to="/app" className="w-full sm:w-auto px-8 py-4 bg-[#7B2FFF] hover:bg-[#6520d4] text-white rounded-full font-bold transition-colors text-center">
              Découvrir l'app
            </Link>
            <Link to="/instructional" className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white text-white hover:bg-white/10 rounded-full font-bold transition-colors text-center">
              Voir les formations
            </Link>
          </motion.div>
          
          <div className="mt-16 relative h-1 w-full max-w-md mx-auto overflow-hidden rounded-full">
            <motion.div 
              initial={{ x: "-100%" }}
              whileInView={{ x: "0%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute inset-0 bg-gradient-to-r from-[#7B2FFF] to-[#FF1744]"
            ></motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
