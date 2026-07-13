import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { AmbientBackground } from '../components/AmbientBackground';

export function About() {
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
      case 'violet': return 'hover:bg-[var(--color-accent-primary)] hover:shadow-[0_0_15px_var(--color-accent-primary)]';
      case 'rouge': return 'hover:bg-[var(--color-accent-red)] hover:shadow-[0_0_15px_var(--color-accent-red)]';
      case 'cyan': return 'hover:bg-[var(--color-accent-energy)] hover:shadow-[0_0_15px_var(--color-accent-energy)]';
      case 'or': return 'hover:bg-[var(--color-accent-gold)] hover:shadow-[0_0_15px_var(--color-accent-gold)]';
      default: return '';
    }
  };

  return (
    <div className="bg-[var(--color-bg-base)] text-[var(--color-text-primary)] min-h-screen font-body overflow-hidden relative">
      <AmbientBackground />
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
                className="font-display text-display-2xl text-white tracking-tight leading-none"
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
                className="font-display text-display-2xl text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-red)] tracking-tight leading-none"
              >
                {word}
              </motion.span>
            ))}
          </div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-[var(--color-text-secondary)] text-base md:text-[20px] max-w-2xl mx-auto px-4"
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
            <span className="text-[var(--color-accent-primary)] uppercase tracking-widest text-sm font-bold mb-4 block">POURQUOI <span className="font-days-one tracking-normal">MMA IQ</span></span>
            <h2 className="font-display text-display-lg leading-none mb-6 text-white">TROP DE CONTENU. PAS ASSEZ DE MÉTHODE.</h2>
            <p className="text-[var(--color-text-primary)] text-base md:text-[16px] mb-8 leading-relaxed">
              <span className="font-days-one tracking-normal">MMA IQ</span> est né d'un constat simple : le MMA manque d'outils structurés pour progresser vraiment. Trop de contenu éparpillé, pas assez de méthode. On a construit la plateforme qu'on aurait voulu avoir — une app de performance digitale et un catalogue de formations premium, le tout connecté.
            </p>
            <div className="border-l-[3px] border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/[0.08] p-5 rounded-r-lg">
              <p className="italic text-[18px] text-white">"On a construit la plateforme qu'on aurait voulu avoir."</p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-[40%] flex flex-col gap-4"
          >
            {[
              { title: "Une application", desc: "Plans d'entraînement, nutrition, suivi de performance et gameplans tactiques." },
              { title: "Des cours vidéo", desc: "Des coachs reconnus qui transmettent leur méthode, à l'essentiel." },
              { title: "Un écosystème connecté", desc: "Combattants, coachs et clubs sur la même plateforme." },
            ].map((item, i) => (
              <div key={i} className="bg-[var(--color-bg-surface)] border border-white/5 rounded-2xl p-5">
                <div className="font-display text-xl text-white mb-1">{item.title}</div>
                <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SECTION 3 — VISION / MÉTHODE / ÉQUIPE */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-display-lg text-center mb-10 md:mb-16 text-white"
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
            className="group relative bg-[var(--color-bg-surface)]/80 backdrop-blur-md p-6 rounded-2xl border border-white/5 overflow-hidden hover:-translate-y-1.5 transition-transform duration-300"
          >
            <h3 className="font-display text-2xl md:text-[28px] mb-3 text-white">NOTRE VISION</h3>
            <p className="text-[var(--color-text-secondary)] text-[15px] leading-relaxed">
              Démocratiser l'accès à un coaching structuré et data-driven. Du débutant au pro, chacun mérite une méthode.
            </p>
            <div className="absolute bottom-0 left-0 h-[3px] w-full bg-[var(--color-accent-primary)] -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="group relative bg-[var(--color-bg-surface)]/80 backdrop-blur-md p-6 rounded-2xl border border-white/5 overflow-hidden hover:-translate-y-1.5 transition-transform duration-300"
          >
            <h3 className="font-display text-2xl md:text-[28px] mb-3 text-white">NOTRE MÉTHODE</h3>
            <p className="text-[var(--color-text-secondary)] text-[15px] leading-relaxed">
              Anti-blabla. Chaque contenu est concret, actionnable, testé terrain. Structure + répétition + feedback = progression.
            </p>
            <div className="absolute bottom-0 left-0 h-[3px] w-full bg-[var(--color-accent-primary)] -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="group relative bg-[var(--color-bg-surface)]/80 backdrop-blur-md p-6 rounded-2xl border border-white/5 overflow-hidden hover:-translate-y-1.5 transition-transform duration-300"
          >
            <h3 className="font-display text-2xl md:text-[28px] mb-3 text-white">NOTRE ÉQUIPE</h3>
            <p className="text-[var(--color-text-secondary)] text-[15px] leading-relaxed">
              Coachs reconnus, développeurs passionnés de MMA, experts en performance. On construit ce qu'on utilise.
            </p>
            <div className="absolute bottom-0 left-0 h-[3px] w-full bg-[var(--color-accent-primary)] -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 4 — DISCIPLINES */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-display-lg text-center mb-10 md:mb-16 text-white"
        >
          LES DISCIPLINES QU'ON MAÎTRISE
        </motion.h2>
        
        <div className="relative w-full max-w-5xl mx-auto flex flex-wrap justify-center items-center gap-3 md:gap-4">
          {tags.map((tag, i) => {
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.03 }}
                className={`
                  px-4 py-2 rounded-full border border-white/10 bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)]
                  transition-all duration-300 hover:text-white hover:scale-110 z-10 hover:z-20
                  ${tag.size} ${getTagStyle(tag.color)}
                `}
              >
                {tag.text}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* SECTION 5 — MANIFESTE FINAL */}
      <section className="w-full bg-[var(--color-bg-surface)] py-24 md:py-32 px-6 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-[var(--color-accent-primary)]/5 blur-[100px] rounded-full"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-display-xl text-white mb-6"
          >
            ON CONSTRUIT CE QU'ON UTILISE.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[var(--color-text-primary)] text-lg md:text-[20px] mb-12"
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
            <Link to="/app" className="w-full sm:w-auto px-8 py-4 bg-[var(--color-accent-primary)] hover:bg-[var(--color-violet-600)] text-white rounded-full font-bold transition-colors text-center">
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
              className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-red)]"
            ></motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
