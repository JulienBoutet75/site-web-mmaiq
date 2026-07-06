import { motion } from "motion/react";
import { Badge } from "../components/ui/Badge";
import PricingSection from "../components/PricingSection";

export function Pricing() {
  return (
    <div className="bg-[var(--color-bg-base)] text-white pt-32 min-h-screen selection:bg-[var(--color-accent-purple)] selection:text-white">
      <section className="px-6 max-w-3xl mx-auto text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10"
        >
          <Badge color="purple" className="mb-8 bg-white/5 border-white/10 text-white/80">
            TARIFS
          </Badge>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl mb-6 leading-[1.1] tracking-tighter">
            Un plan pour chaque{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-magenta)]">
              étape
            </span>
          </h1>
          <p className="font-body text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed">
            L'application arrive sur iOS et Android. Compare les plans et inscris-toi
            pour être prévenu du lancement.
          </p>
        </motion.div>
      </section>
      <PricingSection />
    </div>
  );
}
