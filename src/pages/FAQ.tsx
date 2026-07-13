import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { Badge } from "../components/ui/Badge";

const faqs = [
  {
    q: "MMA IQ, c'est pour quel niveau ?",
    a: "Tout le monde. L'application et les formations sont structurées par niveaux : débutant, amateur, pro. Chaque contenu indique clairement ses prérequis.",
  },
  {
    q: "Quelle différence entre l'application de performance et le coaching vidéo ?",
    a: "L'application est ton outil quotidien : coaching digital, analytics, gameplan, suivi. Le coaching vidéo (Academy) propose des programmes approfondis avec des coachs reconnus. Les deux sont complémentaires.",
  },
  {
    q: "Comment accéder aux formations achetées ?",
    a: "Après achat, un lien d'accès direct à la formation t'est fourni. Accès illimité, lecture sur tous tes appareils.",
  },
  {
    q: "L'application est-elle disponible ?",
    a: "L'application arrive sur iOS et Android. Laisse ton email sur la page Application pour être prévenu du lancement. Un accès gratuit aux fonctionnalités de base sera proposé, avec un abonnement premium pour les fonctionnalités avancées (Coach Digital, Gameplan, Analytics complets).",
  },
  {
    q: "Peut-on se faire rembourser une formation ?",
    a: "Écris-nous via la page Contact : on étudie chaque demande au cas par cas et on répond vite.",
  },
  {
    q: "Comment choisir la bonne formation ?",
    a: "Chaque formation indique son niveau, sa discipline et ses objectifs. En cas de doute, contacte-nous — on t'oriente vers le bon contenu.",
  },
  {
    q: "Les formations sont-elles en français ?",
    a: "Oui, 100% en français. Contenu tourné et monté par notre équipe avec des coachs francophones.",
  },
];

export function FAQ() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="bg-[var(--color-bg-base)] text-white pt-32 pb-24 selection:bg-[var(--color-accent-purple)] selection:text-white min-h-screen">
      {/* Hero */}
      <section className="px-6 max-w-3xl mx-auto text-center mb-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(123,47,255,0.08)_0%,transparent_50%)] pointer-events-none blur-3xl"></div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10"
        >
          <Badge color="purple" className="mb-8 bg-white/5 border-white/10 text-white/80 shadow-[0_0_30px_rgba(123,47,255,0.2)]">
            FAQ
          </Badge>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl mb-8 leading-[1.1] tracking-tighter drop-shadow-2xl">
            Questions{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-magenta)]">
              fréquentes
            </span>
          </h1>
          <p className="font-body text-lg md:text-xl text-white/50 mb-12 leading-relaxed">
            Tout ce que tu dois savoir sur <span className="font-days-one tracking-normal">MMA IQ</span>.
          </p>
        </motion.div>
      </section>

      {/* Accordion */}
      <section className="px-6 max-w-3xl mx-auto relative z-10">
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
            >
              <div 
                className={`border rounded-2xl overflow-hidden transition-all duration-500 backdrop-blur-sm ${
                  openFaq === i 
                    ? "bg-white/[0.04] border-[var(--color-accent-purple)]/30 shadow-[0_10px_30px_-10px_rgba(123,47,255,0.15)]" 
                    : "bg-white/[0.04] border-white/[0.05] hover:border-white/20 hover:bg-white/[0.03]"
                }`}
              >
                <button
                  className="w-full px-8 py-6 flex items-center justify-between text-left group"
                  onClick={() => toggleFaq(i)}
                >
                  <span className={`font-display text-xl transition-colors duration-300 pr-8 ${
                    openFaq === i ? "text-white" : "text-white/80 group-hover:text-white"
                  }`}>
                    {faq.q}
                  </span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                    openFaq === i 
                      ? "bg-[var(--color-accent-purple)]/20 text-[var(--color-accent-purple)] rotate-180" 
                      : "bg-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white"
                  }`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>
                
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <div className="px-8 pb-8 pt-2">
                        <div className="w-12 h-1 bg-gradient-to-r from-[var(--color-accent-purple)] to-transparent mb-6 opacity-50 rounded-full"></div>
                        <p className="font-body text-white/60 leading-relaxed text-lg">
                          {faq.a}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
