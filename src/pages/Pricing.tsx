import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PricingSection from '../components/PricingSection';
import { Seo } from '../components/Seo';

export function Pricing() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] pb-12 pt-28 font-body text-white selection:bg-[var(--color-accent-primary)] sm:pt-36">
      <Seo title="Tarifs MMA IQ — Les offres prévues au lancement" description="Compare la version gratuite, Essentiel, Performance, Elite et Coach Suite. Inscris-toi gratuitement pour être prévenu du lancement de MMA IQ." canonicalPath="/tarifs" />
      <header className="mx-auto max-w-7xl px-6">
        <p className="mb-4 text-sm font-semibold text-[var(--color-violet-300)]">Bientôt sur iOS et Android</p>
        <h1 className="max-w-3xl font-display text-5xl leading-none sm:text-6xl lg:text-7xl">Les tarifs, en toute clarté.</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
          Découvre les offres prévues pour l’application. Tu peux dès maintenant laisser ton email pour être prévenu du lancement.
        </p>
        <div className="mt-7 flex flex-col items-start gap-3">
          <Link to="/app#download" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-accent-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-violet-600)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-violet-300)]">
            Être prévenu du lancement <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="text-sm text-[var(--color-text-secondary)]">Inscription gratuite, sans engagement.</p>
        </div>
      </header>
      <PricingSection />
    </div>
  );
}
