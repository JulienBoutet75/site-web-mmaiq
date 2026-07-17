import { isValidElement, type ReactNode } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { AmbientBackground } from "../components/AmbientBackground";
import { FaqAccordion } from "../components/FaqAccordion";
import { Seo } from "../components/Seo";
import { faqs } from "../data/faq";
import { staggerContainer, textRevealVariant } from "../animations";

// Extrait le texte brut d'un ReactNode (réponses FAQ avec liens) pour le JSON-LD.
function nodeToText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join("");
  if (isValidElement(node)) {
    return nodeToText((node.props as { children?: ReactNode }).children);
  }
  return "";
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: nodeToText(item.a).replace(/\s+/g, " ").trim(),
    },
  })),
};

export function FAQ() {
  return (
    <div className="bg-[var(--color-bg-base)] text-[var(--color-text-primary)] min-h-screen relative overflow-hidden pt-32 pb-24 selection:bg-[var(--color-accent-primary)] selection:text-white">
      <AmbientBackground />
      <Seo
        title="FAQ — MMA IQ"
        description="Plans, formations, accès, résiliation, salles partenaires : les réponses aux questions qu'on nous pose le plus sur MMA IQ."
        canonicalPath="/faq"
        jsonLd={faqJsonLd}
      />

      {/* Hero */}
      <section className="px-6 max-w-3xl mx-auto text-center mb-16 relative z-10">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div variants={textRevealVariant}>
            <Badge
              color="purple"
              className="mb-8 bg-white/5 border border-white/10 text-[var(--color-text-primary)]/80"
            >
              FAQ
            </Badge>
          </motion.div>
          <motion.h1
            variants={textRevealVariant}
            className="font-display text-display-xl mb-6 leading-[1.05] tracking-tighter text-white"
          >
            Questions{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-magenta)]">
              fréquentes
            </span>
          </motion.h1>
          <motion.p
            variants={textRevealVariant}
            className="font-body text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed"
          >
            Les réponses aux questions qu'on nous pose le plus.
          </motion.p>
        </motion.div>
      </section>

      {/* Accordéon */}
      <section className="px-6 max-w-3xl mx-auto relative z-10">
        <motion.div
          variants={textRevealVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <FaqAccordion items={faqs} headingLevel="h2" />
        </motion.div>
      </section>

      {/* Sortie — la vraie réponse si la question n'est pas là */}
      <section className="px-6 max-w-3xl mx-auto relative z-10 mt-20 md:mt-24">
        <motion.div
          variants={textRevealVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="text-center border border-white/10 rounded-2xl bg-white/[0.03] backdrop-blur-sm px-6 py-12 md:px-12"
        >
          <h2 className="font-display text-display-lg leading-none mb-4 text-white">
            Une autre question ?
          </h2>
          <p className="font-body text-base md:text-lg text-[var(--color-text-secondary)] leading-relaxed mb-8 max-w-xl mx-auto">
            Écris-nous, on répond sous 24h ouvrées.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--color-accent-primary)] hover:opacity-90 text-white rounded-full font-ui font-bold text-base shadow-[0_0_30px_rgba(123,47,255,0.4)] transition-all"
            >
              <Mail className="w-5 h-5" />
              Pose ta question
            </Link>
            <Link
              to="/tarifs"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/15 text-white rounded-full font-ui font-bold text-base transition-all"
            >
              Voir les tarifs
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
