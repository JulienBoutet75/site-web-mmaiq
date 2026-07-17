import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useMotionValue, animate, useTransform, AnimatePresence } from 'motion/react';
import { CheckCircle2, Minus, Infinity as InfinityIcon, X, ArrowRight, Sparkles, Users } from 'lucide-react';

// Plans en miroir EXACT du paywall in-app (mma_perf_lab paywall_page.dart) :
// mêmes noms, mêmes prix, mêmes features, mêmes couleurs de tiers.
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    subtitle: 'Version limitée gratuite',
    accent: '#8892B0',
    price: 0,
    period: 'gratuit',
    billing: '',
    cta: 'Commencer gratuitement',
    features: [
      { label: "Plan d'entraînement", value: '1' },
      { label: 'Plan nutrition', value: '1' },
      { label: 'Cours vidéos', value: '1' },
      { label: 'Visu Perf', value: 'Lim.' },
      { label: 'Gameplan', value: '—' },
      { label: 'Crédits IA / mois', value: '5' },
      { label: 'Marketplace', value: '—' },
      { label: 'Espace médecine', value: '—' },
      { label: 'Connexion Coach', value: '—' },
      { label: 'Mise en relation', value: '—' },
      { label: 'Support prioritaire', value: '—' },
    ]
  },
  {
    id: 'essentiel',
    name: 'Essentiel',
    subtitle: "L'essentiel pour progresser",
    accent: '#E8C97A',
    price: 5.99,
    period: '/ mois',
    billing: 'ou 59,90€ / an (soit 4,99€ / mois)',
    cta: 'Choisir Essentiel',
    features: [
      { label: "Plan d'entraînement", value: '∞' },
      { label: 'Plan nutrition', value: '∞' },
      { label: 'Cours vidéos', value: '5' },
      { label: 'Visu Perf', value: '✓' },
      { label: 'Gameplan', value: 'Lim.' },
      { label: 'Crédits IA / mois', value: '30' },
      { label: 'Marketplace', value: '—' },
      { label: 'Espace médecine', value: '—' },
      { label: 'Connexion Coach', value: '—' },
      { label: 'Mise en relation', value: '—' },
      { label: 'Support prioritaire', value: '—' },
    ]
  },
  {
    id: 'performance',
    name: 'Performance',
    subtitle: 'Pour les compétiteurs',
    accent: '#B0BEC5',
    price: 9.99,
    period: '/ mois',
    billing: 'ou 99,90€ / an (soit 8,33€ / mois)',
    cta: 'Choisir Performance',
    features: [
      { label: "Plan d'entraînement", value: '∞' },
      { label: 'Plan nutrition', value: '∞' },
      { label: 'Cours vidéos', value: '∞' },
      { label: 'Visu Perf', value: '✓' },
      { label: 'Gameplan', value: '✓' },
      { label: 'Crédits IA / mois', value: '80' },
      { label: 'Marketplace', value: '✓' },
      { label: 'Espace médecine', value: '✓' },
      { label: 'Connexion Coach', value: '✓' },
      { label: 'Mise en relation', value: '—' },
      { label: 'Support prioritaire', value: '—' },
    ]
  },
  {
    id: 'elite',
    name: 'Elite',
    subtitle: "L'expérience complète",
    accent: '#D4AF37',
    price: 19.99,
    period: '/ mois',
    billing: 'ou 199,90€ / an (soit 16,66€ / mois)',
    cta: 'Choisir Elite',
    isPopular: true,
    features: [
      { label: "Plan d'entraînement", value: '∞' },
      { label: 'Plan nutrition', value: '∞' },
      { label: 'Cours vidéos', value: '∞' },
      { label: 'Visu Perf', value: '✓' },
      { label: 'Gameplan', value: '✓' },
      { label: 'Crédits IA / mois', value: '200' },
      { label: 'Marketplace', value: '✓' },
      { label: 'Espace médecine', value: '✓' },
      { label: 'Connexion Coach', value: '✓' },
      { label: 'Mise en relation', value: '✓' },
      { label: 'Support prioritaire', value: '✓' },
    ]
  }
];

const COACH_PLAN = {
  name: 'Coach Suite',
  accent: '#9B7EFF',
  price: '19,99€',
  period: '/ mois',
  billing: 'ou 199,90€ / an (soit 16,66€ / mois)',
  features: [
    'Outils coach complets',
    'Suivi de performance des athlètes',
    'Tableau de bord multi-athlètes',
    'Messagerie avec les pratiquants',
    'Mise en relation pratiquants',
    '150 crédits IA / mois',
    'Support client prioritaire',
  ]
};

const FeatureItem: React.FC<{ label: string, value: string | number }> = ({ label, value }) => {
  let icon;
  if (value === '✓') {
    icon = <CheckCircle2 className="w-3 h-3 md:w-5 md:h-5 text-[var(--color-accent-primary)]" />;
  } else if (value === '—') {
    icon = <Minus className="w-3 h-3 md:w-5 md:h-5 text-[var(--color-text-muted)]" />;
  } else if (value === '∞') {
    icon = (
      <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>
        <InfinityIcon className="w-3 h-3 md:w-5 md:h-5 text-[var(--color-accent-gold)]" />
      </motion.div>
    );
  } else {
    icon = <span className="text-[var(--color-accent-primary)] font-bold text-[10px] md:text-sm">{value}</span>;
  }

  return (
    <div className="flex items-center justify-between py-1 md:py-3 border-b border-white/5 last:border-0">
      <span className="text-[var(--color-text-secondary)] font-body text-[9px] md:text-sm">{label}</span>
      <div className="flex items-center justify-center w-3 h-3 md:w-6 md:h-6">
        {icon}
      </div>
    </div>
  );
};

const AnimatedPrice: React.FC<{ price: number, isFree: boolean }> = ({ price, isFree }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => latest.toFixed(2).replace('.', ','));
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView && !isFree) {
      animate(count, price, { duration: 1.5, ease: "easeOut" });
    }
  }, [inView, price, isFree, count]);

  if (isFree) return (
    <div className="flex items-baseline justify-center gap-1">
      <span className="font-accent text-3xl md:text-5xl text-white">0</span>
      <span className="text-sm md:text-2xl text-[var(--color-text-secondary)]">€</span>
    </div>
  );

  return (
    <div ref={ref} className="flex items-baseline justify-center gap-1">
      <span className="font-accent text-3xl md:text-5xl text-white">
        <motion.span>{rounded}</motion.span>
      </span>
      <span className="text-sm md:text-2xl text-[var(--color-text-secondary)]">€</span>
    </div>
  );
};

const PlanCard: React.FC<{ plan: any, index: number }> = ({ plan, index }) => {
  const isElite = plan.isPopular;

  const cardContent = (
    <div className={`flex flex-col h-full p-5 md:p-8 bg-white/5 backdrop-blur-[20px] ${isElite ? 'rounded-[14px]' : 'rounded-xl md:rounded-2xl'}`}>
      <div className="text-center mb-4 md:mb-8">
        {isElite && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] md:text-xs font-bold uppercase tracking-wider mb-3"
               style={{ color: plan.accent, backgroundColor: `${plan.accent}1A`, border: `1px solid ${plan.accent}4D` }}>
            <Sparkles className="w-3 h-3" /> Le plus populaire
          </div>
        )}
        <h3 className="font-display text-center mb-4">
          <div className="font-days-one text-sm md:text-xl text-white uppercase tracking-wider mb-1">MMA IQ</div>
          <div className="text-xl md:text-4xl font-bold uppercase tracking-tighter" style={{ color: plan.accent }}>
            {plan.name}
          </div>
        </h3>
        <p className="text-[var(--color-text-secondary)] text-[10px] md:text-sm font-body mb-2 md:mb-6">{plan.subtitle}</p>

        <div className="mb-1 md:mb-4 flex items-baseline justify-center gap-1">
          <AnimatedPrice price={plan.price} isFree={plan.price === 0} />
          <span className="text-[var(--color-text-secondary)] text-xs md:text-lg font-body">{plan.period}</span>
        </div>
        {plan.billing && (
          <p className="text-[var(--color-text-secondary)] text-[9px] md:text-xs font-body uppercase tracking-widest opacity-80">{plan.billing}</p>
        )}
        {!plan.billing && <p className="text-transparent text-[9px] md:text-xs uppercase tracking-wider select-none">&nbsp;</p>}
      </div>

      <div className="h-px w-full mb-2 md:mb-6" style={{ background: `linear-gradient(to right, transparent, ${plan.accent}80, transparent)` }} />

      <div className="flex-grow space-y-0 md:space-y-1 mb-3 md:mb-8">
        {plan.features.map((feat: any, idx: number) => (
          <FeatureItem key={idx} label={feat.label} value={feat.value} />
        ))}
      </div>

      {/* CTA : l'app n'est pas encore lancée — chaque plan mène à la liste d'attente */}
      {isElite ? (
        <div className="relative group/btn w-full mt-auto">
          <Link to="/app#download" className="relative block text-center w-full py-2.5 md:py-4 bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-violet-300)] text-white rounded-lg md:rounded-xl font-bold text-xs md:text-lg transition-transform group-hover/btn:scale-[1.02] shadow-[0_0_20px_rgba(123,47,255,0.4)] overflow-hidden">
            <span className="relative z-10">{plan.cta}</span>
          </Link>
        </div>
      ) : plan.id === 'performance' ? (
        <Link to="/app#download" className="block text-center w-full py-2.5 md:py-4 bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/80 text-white rounded-lg md:rounded-xl font-bold text-xs md:text-lg transition-colors mt-auto">
          {plan.cta}
        </Link>
      ) : plan.id === 'essentiel' ? (
        <Link to="/app#download" className="block text-center w-full py-2.5 md:py-4 bg-[var(--color-accent-primary)]/20 hover:bg-[var(--color-accent-primary)]/30 border border-[var(--color-accent-primary)]/30 text-white rounded-lg md:rounded-xl font-bold text-xs md:text-lg transition-colors mt-auto">
          {plan.cta}
        </Link>
      ) : (
        <Link to="/app#download" className="block text-center w-full py-2.5 md:py-4 bg-transparent hover:bg-white/5 border border-white/20 text-white rounded-lg md:rounded-xl font-bold text-xs md:text-lg transition-colors mt-auto">
          {plan.cta}
        </Link>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: index * 0.08 } }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`relative h-full ${isElite ? 'lg:-mt-4 lg:mb-4 lg:w-[calc(100%+20px)] lg:-ml-[10px] z-10 mt-2 md:mt-0' : 'z-0'}`}
    >
      {isElite ? (
        <div className="relative p-[2px] rounded-2xl overflow-visible h-full shadow-[0_0_40px_rgba(212,175,55,0.35),0_0_80px_rgba(123,47,255,0.15)]" style={{ background: `linear-gradient(135deg, ${plan.accent}66, transparent)` }}>
          <div className="relative h-full rounded-[14px] overflow-hidden">
            {cardContent}
          </div>
        </div>
      ) : (
        <div className="h-full rounded-2xl border" style={{ borderColor: plan.id === 'free' ? 'rgba(255,255,255,0.1)' : `${plan.accent}4D` }}>
          {cardContent}
        </div>
      )}
    </motion.div>
  );
};

const CoachSuiteCard: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div className="relative rounded-2xl border overflow-hidden" style={{ borderColor: `${COACH_PLAN.accent}4D` }}>
    <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 0% 0%, ${COACH_PLAN.accent}14 0%, transparent 60%)` }} />
    <div className={`relative flex flex-col ${compact ? '' : 'md:flex-row md:items-center'} gap-6 p-6 md:p-8 bg-white/5 backdrop-blur-[20px]`}>
      <div className={compact ? '' : 'md:w-1/3'}>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider mb-3"
             style={{ color: COACH_PLAN.accent, backgroundColor: `${COACH_PLAN.accent}1A`, border: `1px solid ${COACH_PLAN.accent}4D` }}>
          <Users className="w-3 h-3" /> Pour les coachs
        </div>
        <h3 className="font-display mb-1">
          <span className="font-days-one text-sm md:text-lg text-white uppercase tracking-wider mr-2">MMA IQ</span>
          <span className="text-xl md:text-3xl font-bold uppercase tracking-tighter" style={{ color: COACH_PLAN.accent }}>{COACH_PLAN.name}</span>
        </h3>
        <div className="flex items-baseline gap-1 mt-3">
          <span className="font-accent text-3xl md:text-4xl text-white">{COACH_PLAN.price}</span>
          <span className="text-[var(--color-text-secondary)] text-sm font-body">{COACH_PLAN.period}</span>
        </div>
        <p className="text-[var(--color-text-secondary)] text-[10px] md:text-xs font-body uppercase tracking-widest opacity-80 mt-1">{COACH_PLAN.billing}</p>
      </div>
      <ul className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-x-6 gap-y-2 flex-1`}>
        {COACH_PLAN.features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-xs md:text-sm text-[var(--color-text-primary)] font-body">
            <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: COACH_PLAN.accent }} />
            {f}
          </li>
        ))}
      </ul>
      <div className={compact ? '' : 'md:w-auto'}>
        <Link to="/app#download" className="block text-center px-6 py-3 md:py-4 bg-[var(--color-accent-primary)]/20 hover:bg-[var(--color-accent-primary)]/30 border border-[var(--color-accent-primary)]/30 text-white rounded-xl font-bold text-xs md:text-base transition-colors whitespace-nowrap">
          Choisir Coach Suite
        </Link>
      </div>
    </div>
  </div>
);

const ValueCell = ({ value }: { value: string | number }) => {
  if (value === '✓') {
    return <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-[var(--color-accent-primary)] mx-auto" />;
  } else if (value === '—') {
    return <Minus className="w-4 h-4 md:w-5 md:h-5 text-[var(--color-text-muted)] mx-auto" />;
  } else if (value === '∞') {
    return <InfinityIcon className="w-4 h-4 md:w-5 md:h-5 text-[var(--color-accent-gold)] mx-auto" />;
  } else {
    return <span className="text-[var(--color-accent-primary)] font-bold text-[10px] md:text-sm">{value}</span>;
  }
};

export default function PricingSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // A11y modale (aria-modal) : focus sur « Fermer » à l'ouverture, fermeture
  // par Échap, focus rendu au bouton déclencheur à la fermeture.
  useEffect(() => {
    if (!isModalOpen) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      triggerRef.current?.focus();
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          setActiveIndex(Number(entry.target.getAttribute('data-index')));
        }
      });
    }, { root: scrollRef.current, threshold: 0.5 });

    const cards = document.querySelectorAll('.mobile-plan-card');
    cards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, [isModalOpen]);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  return (
    <section className="py-24 bg-[var(--color-bg-base)] relative border-t border-[var(--color-border)] overflow-hidden">
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-xl sm:text-2xl md:text-5xl font-display uppercase tracking-tighter text-white mb-4 flex flex-row flex-wrap items-center justify-center gap-1 sm:gap-2 md:gap-4">
            <span>Vivez pleinement l'expérience</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-violet-300)] tracking-widest font-days-one tracking-normal">
              MMA IQ
            </span>
          </h2>

          <p className="text-sm md:text-base font-body text-[var(--color-text-secondary)]">
            Sans engagement. Annulable à tout moment. Jusqu'à −17% avec l'abonnement annuel.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="mb-8 md:mb-16 w-full">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr>
                <th className="p-1 md:p-4 border-b border-white/10 w-[28%] md:w-1/3"></th>
                {PLANS.map((plan) => (
                  <th key={plan.id} className="p-1 md:p-4 border-b border-white/10 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-display text-[9px] md:text-xl text-white uppercase tracking-tighter">
                        <span className="font-days-one text-[7px] md:text-xs mr-1">MMA IQ</span>
                        <span style={{ color: plan.accent }}>{plan.name}</span>
                      </span>
                      <span className="block text-[8px] md:text-sm text-white/60 font-body normal-case mt-1">
                        {plan.price === 0 ? '0€' : `${String(plan.price).replace('.', ',')}€${plan.period}`}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLANS[0].features.map((feat, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-1 py-2.5 md:p-4 text-white font-body text-[10px] md:text-base leading-tight pr-1">{feat.label}</td>
                  <td className="p-1 py-2.5 md:p-4 text-center"><ValueCell value={PLANS[0].features[i].value} /></td>
                  <td className="p-1 py-2.5 md:p-4 text-center"><ValueCell value={PLANS[1].features[i].value} /></td>
                  <td className="p-1 py-2.5 md:p-4 text-center"><ValueCell value={PLANS[2].features[i].value} /></td>
                  <td className="p-1 py-2.5 md:p-4 text-center"><ValueCell value={PLANS[3].features[i].value} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] md:text-xs text-[var(--color-text-secondary)] font-body mt-3 text-center">
            Les crédits IA alimentent les gameplans, analyses vidéo, scans de repas et le coach IA.
          </p>
        </div>

        {/* Coach Suite */}
        <div className="mb-12 md:mb-16">
          <CoachSuiteCard />
        </div>

        {/* CTA Button */}
        <div className="flex justify-center mt-8 md:mt-12">
          <motion.div
            className="relative group inline-block"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-violet-300)] rounded-full blur-xl opacity-70 group-hover:opacity-100 animate-pulse transition-opacity duration-300"></div>
            <button
              ref={triggerRef}
              onClick={() => setIsModalOpen(true)}
              className="relative flex items-center justify-center px-6 py-3 md:px-8 md:py-4 font-display tracking-wider text-sm md:text-xl text-white transition-all duration-300 bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-violet-300)] rounded-full hover:scale-110 shadow-[0_0_40px_rgba(123,47,255,0.6)] border border-white/30 overflow-hidden"
            >
              CHOISIR MON OFFRE <ArrowRight className="ml-2 md:ml-3 w-4 h-4 md:w-6 md:h-6 group-hover:translate-x-2 transition-transform" />
            </button>
          </motion.div>
        </div>
      </div>

      {/* Modal / Popup */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Sélectionnez votre plan"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-[1200px] bg-[var(--color-bg-base)] rounded-[32px] shadow-[0_0_50px_rgba(123,47,255,0.2)] overflow-hidden border border-white/10 max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                ref={closeButtonRef}
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 z-[110] p-3 text-white hover:text-white bg-white/10 hover:bg-[var(--color-accent-primary)] rounded-full transition-all duration-300 shadow-lg border border-white/20"
                aria-label="Fermer"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-0 md:p-12 overflow-y-auto custom-scrollbar">
                <div className="text-center mt-12 mb-8 md:mb-12 px-6">
                  <h3 className="text-2xl md:text-5xl font-display uppercase text-white tracking-widest">
                    Sélectionnez votre <span className="text-[var(--color-accent-primary)]">plan</span>
                  </h3>
                  <div className="h-1 w-24 bg-[var(--color-accent-primary)] mx-auto mt-4 rounded-full" />
                </div>

                {/* Desktop / Tablet Grid */}
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch pb-4 px-12">
                  {PLANS.map((plan, i) => (
                    <PlanCard key={plan.id} plan={plan} index={i} />
                  ))}
                </div>
                <div className="hidden md:block px-12 pb-8">
                  <CoachSuiteCard />
                </div>

                {/* Mobile Scroll */}
                <div className="md:hidden relative pb-12">
                  <div
                    ref={scrollRef}
                    className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-4 scrollbar-hide px-[10vw]"
                  >
                    {PLANS.map((plan, i) => (
                      <div
                        key={plan.id}
                        data-index={i}
                        className="mobile-plan-card snap-center flex-shrink-0 w-[80vw]"
                      >
                        <PlanCard plan={plan} index={i} />
                      </div>
                    ))}
                    <div data-index={4} className="mobile-plan-card snap-center flex-shrink-0 w-[80vw]">
                      <CoachSuiteCard compact />
                    </div>
                  </div>

                  {/* Pagination Dots */}
                  <div className="flex justify-center gap-2 mt-6">
                    {[...PLANS, COACH_PLAN].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${activeIndex === i ? 'bg-[var(--color-accent-primary)] w-6' : 'bg-white/20'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
