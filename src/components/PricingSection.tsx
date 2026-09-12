import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, Users } from 'lucide-react';
import { useMmaIqAccount } from '../context/MmaIqAccountContext';
import type { SubscriptionCheckoutInput } from '../services/stripeService';

const CHECKOUT_ENABLED = import.meta.env.VITE_ENABLE_CHECKOUT === 'true';

type Plan = {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  billing: string;
  highlights: string[];
  features: string[];
};

// Prix et droits conservés à l'identique du paywall de l'application.
// Les cartes résument l'offre ; le tableau garde toutes les différences.
const FEATURE_LABELS = [
  "Plan d'entraînement", 'Plan nutrition', "Tutoriels techniques dans l'app",
  'Visu Perf', 'Gameplan', 'Crédits IA / mois', 'Marketplace', 'Espace médecine',
  'Connexion Coach', 'Mise en relation', 'Support prioritaire',
];

const PLANS: Plan[] = [
  {
    id: 'free', name: 'Free', subtitle: 'Pour découvrir les outils', price: 0,
    billing: 'Version gratuite avec accès limité.',
    highlights: [
      "1 plan d'entraînement et 1 plan nutrition", "1 tutoriel technique dans l'app",
      'Suivi de performance limité', '5 crédits IA par mois',
    ],
    features: ['1', '1', '1', 'Lim.', '—', '5', '—', '—', '—', '—', '—'],
  },
  {
    id: 'essentiel', name: 'Essentiel', subtitle: "L'essentiel pour progresser", price: 5.99,
    billing: 'ou 59,90 € / an, soit 4,99 € / mois',
    highlights: [
      "Plans d'entraînement et nutrition illimités", "5 tutoriels techniques dans l'app",
      'Suivi de performance inclus, gameplan limité', '30 crédits IA par mois',
    ],
    features: ['∞', '∞', '5', '✓', 'Lim.', '30', '—', '—', '—', '—', '—'],
  },
  {
    id: 'performance', name: 'Performance', subtitle: 'Pour les compétiteurs', price: 9.99,
    billing: 'ou 99,90 € / an, soit 8,33 € / mois',
    highlights: [
      'Plans et tutoriels techniques illimités', 'Gameplan et suivi de performance',
      'Connexion coach, espace médecine et marketplace', '80 crédits IA par mois',
    ],
    features: ['∞', '∞', '∞', '✓', '✓', '80', '✓', '✓', '✓', '—', '—'],
  },
  {
    id: 'elite', name: 'Elite', subtitle: "L'expérience complète", price: 19.99,
    billing: 'ou 199,90 € / an, soit 16,66 € / mois',
    highlights: [
      'Tous les outils de Performance', '200 crédits IA par mois',
      'Mise en relation', 'Support prioritaire',
    ],
    features: ['∞', '∞', '∞', '✓', '✓', '200', '✓', '✓', '✓', '✓', '✓'],
  },
];

const COACH_FEATURES = [
  'Outils coach complets', 'Suivi de performance des athlètes',
  'Tableau de bord multi-athlètes', 'Messagerie avec les pratiquants',
  'Mise en relation pratiquants', '150 crédits IA par mois', 'Support client prioritaire',
];

const priceLabel = (price: number) => price === 0 ? '0' : price.toFixed(2).replace('.', ',');
const valueLabel = (value: string) => ({ '✓': 'Inclus', '—': 'Non inclus', '∞': 'Illimité', 'Lim.': 'Limité' }[value] ?? value);

function LaunchLink({
  primary = false,
  planKey,
  interval = 'monthly',
  gymCode,
}: {
  primary?: boolean;
  planKey?: SubscriptionCheckoutInput['planKey'];
  interval?: SubscriptionCheckoutInput['interval'];
  gymCode?: string;
}) {
  const { beginSubscriptionCheckout, checkoutPending, loading } = useMmaIqAccount();
  const classes = `inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-violet-300)] ${
    primary
      ? 'bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-violet-600)]'
      : 'border border-white/20 bg-white/5 text-white hover:bg-white/10'
  }`;
  if (CHECKOUT_ENABLED && planKey) {
    return (
      <button
        type="button"
        disabled={checkoutPending || loading}
        onClick={() => beginSubscriptionCheckout({ planKey, interval, gymCode: gymCode?.trim() || null }).catch(() => {})}
        className={`${classes} disabled:cursor-wait disabled:opacity-60`}
      >
        {checkoutPending ? 'Ouverture du paiement…' : 'Choisir cette formule'}
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
      </button>
    );
  }
  return (
    <Link
      to="/app#download"
      className={classes}
    >
      Être prévenu du lancement <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
    </Link>
  );
}

function AcademyNote() {
  return (
    <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
      Les tutoriels techniques sont inclus selon ton plan. Les formations approfondies de{' '}
      <Link to="/instructional" className="font-semibold text-white underline underline-offset-4 hover:text-[var(--color-violet-300)]">MMA IQ Academy</Link>
      {' '}sont en préparation et seront vendues à l’unité, en complément de l’abonnement.
    </p>
  );
}

function PlanCard({ plan, interval, selected, gymCode }: { plan: Plan; interval: SubscriptionCheckoutInput['interval']; selected: boolean; gymCode: string }) {
  const isPerformance = plan.id === 'performance';

  return (
    <article id={`plan-${plan.id}`} className={`flex min-w-0 scroll-mt-24 flex-col rounded-2xl border p-6 ${
      selected || isPerformance
        ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
        : 'border-white/15 bg-[var(--color-bg-surface)]'
    }`}>
      <h3 className="font-display text-3xl tracking-wide text-white">{plan.name}</h3>
      <p className={`mt-2 text-sm leading-relaxed ${isPerformance ? 'text-[var(--color-violet-300)]' : 'text-[var(--color-text-secondary)]'}`}>
        {plan.subtitle}
      </p>
      <p className="mt-6 flex flex-wrap items-baseline gap-x-2 text-white">
        <span className="text-4xl font-semibold tracking-tight">{priceLabel(plan.price)} €</span>
        <span className="text-sm text-[var(--color-text-secondary)]">{plan.price === 0 ? 'gratuit' : '/ mois'}</span>
      </p>
      <p className="mt-3 min-h-12 text-sm leading-relaxed text-[var(--color-text-secondary)]">{plan.billing}</p>
      <ul className="my-6 flex-1 space-y-4 border-t border-white/15 pt-6">
        {plan.highlights.map((highlight) => (
          <li key={highlight} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text-primary)]">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-violet-300)]" aria-hidden="true" />
            {highlight}
          </li>
        ))}
      </ul>
      <LaunchLink
        primary={isPerformance}
        planKey={plan.id === 'free' ? undefined : plan.id as SubscriptionCheckoutInput['planKey']}
        interval={interval}
        gymCode={gymCode}
      />
    </article>
  );
}

export default function PricingSection({ compact = false }: { compact?: boolean }) {
  const [searchParams] = useSearchParams();
  const requestedInterval = searchParams.get('interval') === 'yearly' ? 'yearly' : 'monthly';
  const requestedPlan = searchParams.get('plan');
  const [interval, setInterval] = useState<SubscriptionCheckoutInput['interval']>(requestedInterval);
  const [gymCode, setGymCode] = useState('');
  const managementStarted = useRef(false);
  const { checkoutError, beginSubscriptionManagement } = useMmaIqAccount();

  useEffect(() => {
    if (compact || searchParams.get('manage') !== '1' || managementStarted.current) return;
    managementStarted.current = true;
    beginSubscriptionManagement().catch(() => {});
  }, [beginSubscriptionManagement, compact, searchParams]);
  if (compact) {
    return (
      <section className="border-y border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-6 py-14 font-body sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[1fr_auto] md:gap-12">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold text-[var(--color-violet-300)]">Les offres prévues au lancement</p>
            <h2 className="font-display text-4xl leading-none text-white sm:text-5xl">Une version gratuite pour commencer.</h2>
            <p className="mb-5 mt-5 text-base leading-relaxed text-[var(--color-text-secondary)]">
              Les plans payants démarreront à <span className="font-semibold text-white">5,99 € / mois</span>.
              En attendant, l’inscription pour être prévenu du lancement est gratuite.
            </p>
            <AcademyNote />
          </div>
          <div className="flex flex-col gap-3">
            <Link to="/tarifs" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5">
              Comparer les offres <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <LaunchLink primary />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[var(--color-bg-base)] px-6 py-12 font-body sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-2xl">
          <h2 className="font-display text-3xl text-white sm:text-4xl">Les offres pour les pratiquants</h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--color-text-secondary)]">
            Une version gratuite et trois plans payants prévus au lancement.
            Jusqu’à −17 % avec la facturation annuelle.
          </p>
        </div>

        {CHECKOUT_ENABLED && (
          <div className="mb-8 flex flex-wrap items-center gap-3" aria-label="Périodicité de paiement">
            <button type="button" onClick={() => setInterval('monthly')} aria-pressed={interval === 'monthly'} className={`rounded-xl px-5 py-3 text-sm font-semibold ${interval === 'monthly' ? 'bg-[var(--color-accent-primary)] text-white' : 'border border-white/15 text-[var(--color-text-secondary)]'}`}>Mensuel</button>
            <button type="button" disabled={gymCode.trim().length > 0} onClick={() => setInterval('yearly')} aria-pressed={interval === 'yearly'} className={`rounded-xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${interval === 'yearly' ? 'bg-[var(--color-accent-primary)] text-white' : 'border border-white/15 text-[var(--color-text-secondary)]'}`}>Annuel</button>
            <label className="w-full max-w-xs text-sm font-semibold text-white">
              Code club <span className="font-normal text-[var(--color-text-secondary)]">(facultatif)</span>
              <input
                value={gymCode}
                onChange={(event) => {
                  const value = event.target.value.toUpperCase();
                  setGymCode(value);
                  if (value.trim()) setInterval('monthly');
                }}
                maxLength={14}
                autoComplete="off"
                placeholder="EX. CLUBMMA"
                className="mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-white/5 px-4 uppercase text-white outline-none focus:border-[var(--color-accent-primary)]"
              />
            </label>
            {gymCode.trim() && <p className="w-full text-sm text-[var(--color-text-secondary)]">Les avantages exprimés en mois s'appliquent à la formule mensuelle.</p>}
            {checkoutError && <p className="w-full text-sm text-red-300" role="alert">{checkoutError}</p>}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} interval={interval} selected={plan.id === requestedPlan} gymCode={gymCode} />
          ))}
        </div>

        <div className="mt-6 max-w-4xl space-y-3">
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            L’application est en préparation. L’inscription au lancement est gratuite et ne souscrit aucun abonnement.
            Les abonnements seront annulables à tout moment, avec effet à la fin de la période payée.
          </p>
          <AcademyNote />
        </div>

        <details className="group mt-8 overflow-hidden rounded-2xl border border-white/15 bg-[var(--color-bg-surface)]">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 p-5 text-base font-semibold text-white marker:content-none focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[var(--color-violet-300)] [&::-webkit-details-marker]:hidden">
            Comparer toutes les fonctionnalités
            <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p id="pricing-scroll-help" className="border-t border-white/10 px-5 py-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Sur petit écran, fais défiler le tableau horizontalement pour comparer les quatre plans.
          </p>
          <div className="overflow-x-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-violet-300)]" tabIndex={0} role="region" aria-label="Comparaison des offres" aria-describedby="pricing-scroll-help">
            <table className="w-full min-w-[780px] border-collapse text-left text-sm">
              <caption className="sr-only">Fonctionnalités des abonnements MMA IQ prévus au lancement</caption>
              <thead>
                <tr className="border-y border-white/15 bg-white/5">
                  <th scope="col" className="w-[28%] p-5 font-semibold text-white">Fonctionnalité</th>
                  {PLANS.map((plan) => (
                    <th key={plan.id} scope="col" className="p-5 text-center font-semibold text-white">
                      {plan.name}
                      <span className="mt-1 block whitespace-nowrap font-normal text-[var(--color-text-secondary)]">{priceLabel(plan.price)} €{plan.price > 0 ? ' / mois' : ''}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_LABELS.map((label, index) => (
                  <tr key={label} className="border-b border-white/10 last:border-b-0">
                    <th scope="row" className="p-5 font-medium text-white">{label}</th>
                    {PLANS.map((plan) => (
                      <td key={plan.id} className="p-5 text-center text-[var(--color-text-secondary)]">{valueLabel(plan.features[index])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-white/10 p-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Visu Perf correspond au suivi de performance. Les crédits IA alimentent les gameplans,
            les analyses vidéo, les scans de repas et le coach IA.
          </p>
        </details>

        <section id="coach-suite" className="mt-12 scroll-mt-24 rounded-2xl border border-[var(--color-tier-coach)]/40 bg-[var(--color-bg-elevated)] p-6 sm:mt-16 sm:p-8" aria-labelledby="coach-suite-title">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.25fr] lg:gap-12">
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-tier-coach)]"><Users className="h-5 w-5" aria-hidden="true" /> Pour les coachs · Au lancement</p>
              <h2 id="coach-suite-title" className="font-display text-4xl text-white">Coach Suite</h2>
              <p className="mt-3 max-w-md text-base leading-relaxed text-[var(--color-text-secondary)]">Réunis le suivi de tes athlètes et tes échanges dans un espace dédié.</p>
              <p className="mt-6 flex flex-wrap items-baseline gap-2 text-white"><span className="text-4xl font-semibold tracking-tight">19,99 €</span><span className="text-sm text-[var(--color-text-secondary)]">/ mois</span></p>
              <p className="mb-6 mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">ou 199,90 € / an, soit 16,66 € / mois</p>
              <LaunchLink planKey="coach_suite" interval={interval} gymCode={gymCode} />
            </div>
            <ul className="grid content-center gap-4 sm:grid-cols-2">
              {COACH_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text-primary)]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-tier-coach)]" aria-hidden="true" />{feature}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </section>
  );
}
