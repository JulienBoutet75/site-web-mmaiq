import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { EASE_SIGNATURE } from "../animations";
import type { FaqItem } from "../data/faq";

// Accordéon FAQ accessible : réponses toujours dans le DOM (height animée,
// jamais démontées), un seul panneau ouvert à la fois. headingLevel suit le
// contexte : h3 sous un h2 (Home), h2 directement sous le h1 de /faq.
export function FaqAccordion({
  items,
  headingLevel = "h3",
}: {
  items: FaqItem[];
  headingLevel?: "h2" | "h3";
}) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  const Heading = headingLevel;

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const open = openId === item.id;
        const buttonId = `faq-trigger-${item.id}`;
        const panelId = `faq-panel-${item.id}`;

        return (
          <div
            key={item.id}
            className={`border rounded-2xl overflow-hidden backdrop-blur-sm transition-colors duration-300 ${
              open
                ? "bg-white/[0.04] border-[var(--color-accent-primary)]/30 shadow-[0_10px_30px_-10px_rgba(123,47,255,0.15)]"
                : "bg-white/[0.04] border-white/[0.05] hover:border-white/20"
            }`}
          >
            <Heading className="m-0 p-0 text-base font-normal leading-none">
              <button
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? null : item.id)}
                className="w-full px-6 md:px-8 py-5 md:py-6 flex items-center justify-between text-left group"
              >
                <span
                  className={`font-display text-lg md:text-xl leading-snug transition-colors duration-300 pr-6 ${
                    open ? "text-white" : "text-white/80 group-hover:text-white"
                  }`}
                >
                  {item.q}
                </span>
                <span
                  aria-hidden="true"
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    open
                      ? "bg-[var(--color-accent-primary)]/20 text-[var(--color-accent-primary)] rotate-180"
                      : "bg-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white"
                  }`}
                >
                  <ChevronDown className="w-5 h-5" />
                </span>
              </button>
            </Heading>

            {/* visibility: hidden à la fermeture (transitionEnd) pour sortir les
                liens de la réponse de l'ordre de tabulation sans les démonter. */}
            <motion.div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              aria-hidden={!open}
              initial={false}
              animate={
                open
                  ? { height: "auto", visibility: "visible" }
                  : { height: 0, transitionEnd: { visibility: "hidden" } }
              }
              transition={{ duration: 0.3, ease: EASE_SIGNATURE }}
              className="overflow-hidden"
            >
              <div className="px-6 md:px-8 pb-6 md:pb-8 pt-1">
                <div className="w-12 h-1 bg-gradient-to-r from-[var(--color-accent-primary)] to-transparent mb-5 opacity-50 rounded-full" />
                <div className="font-body text-[var(--color-text-secondary)] leading-relaxed text-base md:text-lg">
                  {item.a}
                </div>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
