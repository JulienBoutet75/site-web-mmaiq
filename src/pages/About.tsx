import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { AmbientBackground } from '../components/AmbientBackground';
import { Seo } from '../components/Seo';
import { EASE_SIGNATURE, powerUpVariant, staggerContainer, textRevealVariant, speedImpactVariant, speedImpactRightVariant } from '../animations';

const disciplines = [
  "Boxe anglaise", "Muay-Thaï", "Kickboxing", "Karaté", "Savate", "Taekwondo",
  "Lutte", "Judo", "Sambo", "BJJ", "Luta Livre", "Catch Wrestling",
];

const piliers = [
  "Nutrition", "Préparation mentale", "Analyse vidéo", "Récupération", "Plyométrie",
  "Gameplan", "Stratégie", "Données de performance", "Coaching structuré",
];

const ecosystemCards = [
  { title: "Une application", desc: "Plans d'entraînement, nutrition, suivi de performance et gameplans tactiques.", to: "/app" },
  { title: "Des cours vidéo", desc: "Des coachs reconnus qui transmettent leur méthode, à l'essentiel.", to: "/instructional" },
  { title: "Un écosystème connecté", desc: "Combattants, coachs et clubs sur la même plateforme — avec un programme salles partenaires dédié.", to: "/partenaires" },
];

export function About() {
  return (
    <div className="bg-[var(--color-bg-base)] text-[var(--color-text-primary)] min-h-screen font-body relative">
      <Seo
        title="À propos — MMA IQ"
        description="MMA IQ est né d'un constat : trop de contenu, pas assez de méthode. Découvre la vision, l'équipe et l'écosystème — app d'entraînement, formations vidéo et salles partenaires."
        canonicalPath="/about"
      />
      <AmbientBackground />

      {/* SECTION 1 — HERO STATEMENT */}
      <section className="relative w-full min-h-[80vh] flex flex-col items-center justify-center text-center px-4 pt-32 pb-10 md:pb-20">
        <div className="relative z-10 max-w-5xl mx-auto w-full">
          {/* Bebas ≈ 0,5 em/caractère : « LE MMA MÉRITAIT MIEUX. » (22 car.) demande
             ~40 px max à 375 px et ~34 px à 320 px — display-xl/2xl (planchers 40/48 px)
             ne tiennent donc pas sur mobile. display-lg (plancher 36 px) tient à 375/414
             et peut passer à la ligne sans rognage à 320 (pas de nowrap, pas d'overflow). */}
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="font-display text-display-lg sm:text-display-xl md:text-display-2xl tracking-tight leading-[1.05] mb-4 md:mb-8"
          >
            <motion.span variants={textRevealVariant} className="block text-white">
              LE MMA MÉRITAIT MIEUX.
            </motion.span>
            <motion.span
              variants={textRevealVariant}
              className="block text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-magenta)]"
            >
              ON L'A CONSTRUIT.
            </motion.span>
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            variants={textRevealVariant}
            transition={{ duration: 0.4, ease: EASE_SIGNATURE, delay: 0.3 }}
            className="text-[var(--color-text-secondary)] text-base md:text-[20px] max-w-2xl mx-auto px-4"
          >
            Une app, des cours vidéo, une méthode. Tout au même endroit.
          </motion.p>
        </div>
      </section>

      {/* SECTION 2 — ORIGIN STORY */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-24">
        <div className="flex flex-col lg:flex-row gap-12 md:gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={speedImpactVariant}
            className="w-full lg:w-[60%]"
          >
            <span className="text-[var(--color-accent-primary)] uppercase tracking-widest text-sm font-bold mb-4 block">POURQUOI <span className="font-days-one tracking-normal">MMA IQ</span></span>
            <h2 className="font-display text-display-lg leading-none mb-6 text-white">TROP DE CONTENU. PAS ASSEZ DE MÉTHODE.</h2>
            <p className="text-[var(--color-text-primary)] text-base md:text-[16px] mb-8 leading-relaxed">
              <span className="font-days-one tracking-normal">MMA IQ</span> est né d'un constat simple : le MMA manque d'outils structurés pour progresser vraiment. Du contenu partout, éparpillé sur dix plateformes, et aucune méthode pour relier le tout. Alors on a réuni l'essentiel au même endroit : une app de performance, des formations premium et un réseau de salles partenaires, connectés.
            </p>
            <div className="border-l-[3px] border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/[0.08] p-5 rounded-r-lg">
              <p className="italic text-[18px] text-white">"On a construit la plateforme qu'on aurait voulu avoir."</p>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="w-full lg:w-[40%] flex flex-col gap-4"
          >
            {ecosystemCards.map((item) => (
              <motion.div key={item.to} variants={powerUpVariant}>
                <Link
                  to={item.to}
                  className="group block bg-[var(--color-bg-surface)] border border-white/5 hover:border-[var(--color-accent-primary)]/50 rounded-2xl p-5 transition-colors"
                >
                  <div className="font-display text-xl text-white mb-1">{item.title}</div>
                  <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-3">{item.desc}</div>
                  <div className="inline-flex items-center gap-1.5 text-sm font-ui font-semibold text-[var(--color-accent-primary)]">
                    Découvrir <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SECTION 3 — VISION / MÉTHODE / ÉQUIPE */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={textRevealVariant}
          className="font-display text-display-lg text-center mb-10 md:mb-16 text-white"
        >
          CE QUI NOUS DÉFINIT
        </motion.h2>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
        >
          {[
            { title: "NOTRE VISION", desc: "Démocratiser l'accès à un coaching structuré et data-driven. Du débutant au pro, chacun mérite une méthode." },
            { title: "NOTRE MÉTHODE", desc: "Anti-blabla. Chaque contenu est concret, actionnable, testé terrain. Structure + répétition + feedback = progression." },
            { title: "NOTRE ÉQUIPE", desc: "Coachs reconnus, développeurs passionnés de MMA, experts en performance. Tous passés par le tatami avant l'écran." },
          ].map((card) => (
            <motion.div
              key={card.title}
              variants={powerUpVariant}
              className="relative bg-[var(--color-bg-surface)]/80 backdrop-blur-md p-6 rounded-2xl border border-white/5 overflow-hidden"
            >
              <h3 className="font-display text-2xl md:text-[28px] mb-3 text-white">{card.title}</h3>
              <p className="text-[var(--color-text-secondary)] text-[15px] leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* SECTION 4 — CE QU'ON COUVRE */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={textRevealVariant}
          className="font-display text-display-lg text-center mb-10 md:mb-16 text-white"
        >
          CE QU'ON COUVRE
        </motion.h2>

        <div className="max-w-5xl mx-auto flex flex-col gap-10 md:gap-14">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <h3 className="font-ui text-sm font-bold uppercase tracking-widest text-[var(--color-accent-primary)] text-center mb-5">Disciplines</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {disciplines.map((d) => (
                <motion.span
                  key={d}
                  variants={powerUpVariant}
                  className="px-4 py-2 rounded-full border border-white/10 bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] text-sm md:text-base"
                >
                  {d}
                </motion.span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <h3 className="font-ui text-sm font-bold uppercase tracking-widest text-[var(--color-accent-energy)] text-center mb-5">Piliers de performance</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {piliers.map((p) => (
                <motion.span
                  key={p}
                  variants={powerUpVariant}
                  className="px-4 py-2 rounded-full border border-white/10 bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] text-sm md:text-base"
                >
                  {p}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 5 — MANIFESTE FINAL */}
      <section className="w-full bg-[var(--color-bg-surface)] py-24 md:py-32 px-6 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-[var(--color-accent-primary)]/5 blur-[100px] rounded-full"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={textRevealVariant}
            className="font-display text-display-xl text-white mb-6"
          >
            ON CONSTRUIT CE QU'ON UTILISE.
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={textRevealVariant}
            className="text-[var(--color-text-primary)] text-lg md:text-[20px] mb-12"
          >
            Pas une startup tech qui regarde le MMA de loin.<br className="hidden md:block" />
            Des gens du milieu, pour le milieu.
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={powerUpVariant}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link
              to="/app"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--color-accent-primary)] hover:opacity-90 text-white rounded-full font-ui font-bold text-base shadow-[0_0_30px_rgba(123,47,255,0.4)] transition-all"
            >
              Découvrir l'app
            </Link>
            <Link
              to="/instructional"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/15 text-white rounded-full font-ui font-bold text-base transition-all"
            >
              Voir les formations
            </Link>
          </motion.div>

          <div className="mt-16 relative h-1 w-full max-w-md mx-auto overflow-hidden rounded-full">
            <motion.div
              initial={{ x: "-100%" }}
              whileInView={{ x: "0%" }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: EASE_SIGNATURE }}
              className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-magenta)]"
            ></motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
