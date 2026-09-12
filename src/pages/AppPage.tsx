import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, Users } from 'lucide-react';
import { PhoneFrame } from '../components/PhoneFrame';
import { WaitlistForm } from '../components/WaitlistForm';
import PricingSection from '../components/PricingSection';
import { FaqAccordion } from '../components/FaqAccordion';
import { Seo } from '../components/Seo';
import { faqs } from '../data/faq';

// Les 8 modules réels du dashboard de l'app (mêmes noms, mêmes illustrations).
const MODULES = [
  { img: '/app/modules/entrainement.webp', title: 'ENTRAÎNEMENT', desc: 'Plans périodisés & séances guidées' },
  { img: '/app/modules/nutrition.webp', title: 'NUTRITION', desc: 'Plan alimentaire & scan de repas IA' },
  { img: '/app/modules/performance.webp', title: 'PERFORMANCE', desc: 'Tes stats sur 5 tableaux de bord' },
  { img: '/app/modules/tutoriels.webp', title: 'TUTORIELS', desc: 'Bibliothèque vidéo technique' },
  { img: '/app/modules/medecine.webp', title: 'MÉDECINE', desc: 'Dossier médical & documents' },
  { img: '/app/modules/gameplan.webp', title: 'GAMEPLAN', desc: 'Fiche adversaire & stratégie IA' },
  { img: '/app/modules/analyse_video.webp', title: 'ANALYSE VIDÉO', desc: 'Décorticage IA de combats' },
  { img: '/app/modules/cutting.webp', title: 'CUTTING', desc: 'Suivi de coupe de poids' },
];

// Une description factuelle par capture. Chaque texte suit exactement le
// parcours visible dans la vidéo au lieu de répéter une promesse marketing.
const VIDEO_DEMOS = [
  {
    number: '01',
    label: 'Tutoriels techniques',
    title: 'Le geste, puis les consignes.',
    description: "Choisis une zone du corps ou une discipline. Chaque fiche réunit la démonstration, l'objectif de l'exercice, son exécution et les points à surveiller.",
    steps: ['Voir la technique en vidéo', "Suivre les étapes d'exécution", 'Repérer les erreurs à éviter'],
    src: '/app/videos/tutoriels.mp4',
    poster: '/app/videos/tutoriels-poster.webp',
    videoLabel: "Un tutoriel MMA IQ avec sa démonstration, son objectif, ses consignes d'exécution et ses points d'attention",
  },
  {
    number: '02',
    label: 'Journal nutritionnel',
    title: 'Une photo, puis tu gardes la main.',
    description: "Photographie ton repas. L'app propose les aliments reconnus et leurs quantités : tu les vérifies avant de les ajouter à ton suivi de la journée.",
    steps: ['Photographier le repas', 'Corriger aliments et quantités', 'Ajouter calories et macros au journal'],
    src: '/app/videos/nutrition-scan.mp4',
    poster: '/app/videos/nutrition-scan-poster.webp',
    videoLabel: "Le scan d'un repas, la vérification des aliments détectés et leur ajout au journal nutritionnel",
  },
  {
    number: '03',
    label: 'Analyse de combat',
    title: 'Retrouve les séquences qui comptent.',
    description: "Importe un fichier ou un lien YouTube. Le résultat rassemble un résumé du combat et des séquences horodatées, classées par thème pour revenir directement aux actions clés.",
    steps: ['Importer la vidéo du combat', 'Lire le résumé généré', 'Ouvrir les séquences striking et wrestling'],
    src: '/app/videos/analyse-video.mp4',
    poster: '/app/videos/analyse-video-poster.webp',
    videoLabel: "Une analyse de combat avec un résumé et des séquences horodatées classées par thème",
  },
];


const DEMOS = [
  {
    number: '00', label: 'Entraînement', title: 'Ta séance, étape par étape.',
    description: "Ouvre ta séance et retrouve les exercices prévus. Garde les consignes et le suivi de ta séance sous les yeux pendant l'entraînement.",
    steps: ['Retrouver les exercices de la séance', 'Suivre les consignes et les temps de travail', 'Garder une trace de ton entraînement'],
    src: '/app/videos/entrainement-live.mp4', poster: '/app/videos/entrainement-live-poster.webp', videoLabel: "Une séance d'entraînement guidée dans MMA IQ",
  },
  ...VIDEO_DEMOS,
  {
    number: '04', label: 'Gameplan', title: 'Prépare ton combat.',
    description: "Rassemble les informations sur ton adversaire. La fiche organise son profil, son style de combat et des pistes tactiques à examiner avec ton coach.",
    steps: ['Rassembler le profil de ton adversaire', 'Repérer son style et ses habitudes', 'Travailler les pistes tactiques avec ton coach'],
    src: '/app/videos/gameplan.mp4', poster: '/app/videos/gameplan-poster.webp', videoLabel: "Une fiche adversaire et des pistes tactiques dans MMA IQ",
  },
];

export function AppPage() {
  const [activeDemo, setActiveDemo] = useState(0);
  const [showSticky, setShowSticky] = useState(false);
  const [signedUp, setSignedUp] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const onSuccess = useCallback(() => setSignedUp(true), []);
  const demo = DEMOS[activeDemo];

  useEffect(() => {
    const visible = new Set<Element>();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
      setShowSticky(visible.size === 0);
    }, { rootMargin: '-80px 0px 0px 0px', threshold: 0 });
    document.querySelectorAll('[data-waitlist-form="app"]').forEach(form => observer.observe(form));
    return () => observer.disconnect();
  }, []);

  const selectTab = (index: number) => {
    setActiveDemo(index);
    tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[index]?.focus();
  };

  return (
    <div className="bg-[var(--color-bg-base)] text-white">
      <Seo title="L'application MMA IQ — Entraînement et progression" description="Explore les captures réelles de MMA IQ : séances, tutoriels, nutrition et préparation des combats. Inscris-toi pour être prévenu du lancement sur iOS et Android." canonicalPath="/app" />
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_90%_25%,rgba(123,47,255,0.14),transparent_65%)]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pt-28 pb-14 sm:pt-36 sm:pb-20 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div className="min-w-0 max-w-2xl">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-violet-300)]/25 bg-[var(--color-accent-primary)]/10 px-3 py-2 text-xs font-semibold text-[var(--color-violet-200)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-violet-300)]" aria-hidden="true" /> Bientôt sur iOS et Android
            </p>
            <h1 className="font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl">Prépare tes séances.<br /><span className="text-[var(--color-violet-300)]">Suis tes progrès.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">De ton programme d'entraînement au suivi de ta progression, retrouve tes repères dans une seule app. Explore les démonstrations et sois prévenu lorsque MMA IQ sera disponible.</p>
            <WaitlistForm id="download" className="mt-7 max-w-xl" onSuccess={onSuccess} />
            <a href="#product-demos" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white hover:text-[var(--color-violet-200)]">Voir l'application en action <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
          </div>
          <figure className="hidden lg:block">
            <PhoneFrame src="/app/videos/hero-performance.mp4" poster="/app/videos/hero-performance-poster.webp" label="Le suivi des indicateurs de performance dans MMA IQ" eager />
            <figcaption className="mx-auto mt-5 max-w-xs text-center text-sm leading-relaxed text-[var(--color-text-secondary)]">Capture réelle · Suivi de progression<br />Lance la vidéo pour explorer cet écran.</figcaption>
          </figure>
        </div>
      </section>

      <section id="product-demos" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-14 sm:py-20">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-semibold text-[var(--color-violet-300)]">Des usages concrets, dans la vraie app</p>
          <h2 className="font-display text-4xl leading-tight sm:text-5xl">Commence par ce qui t'intéresse.</h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)]">Choisis un parcours et lance sa démonstration. Tu peux mettre la vidéo en pause ou l'agrandir pour lire les détails.</p>
        </div>
        <div ref={tabsRef} role="tablist" aria-label="Démonstrations de l'application" className="my-7 flex flex-wrap gap-2">
          {DEMOS.map((item, index) => (
            <button key={item.number} id={`demo-tab-${index}`} role="tab" aria-selected={activeDemo === index} aria-controls="demo-panel" tabIndex={activeDemo === index ? 0 : -1}
              onClick={() => setActiveDemo(index)}
              onKeyDown={event => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                  event.preventDefault(); selectTab((index + (event.key === 'ArrowRight' ? 1 : -1) + DEMOS.length) % DEMOS.length);
                } else if (event.key === 'Home' || event.key === 'End') {
                  event.preventDefault(); selectTab(event.key === 'Home' ? 0 : DEMOS.length - 1);
                }
              }}
              className={`min-h-12 rounded-full border px-4 text-sm font-semibold transition-colors ${activeDemo === index ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)] text-white' : 'border-white/15 bg-white/[0.03] text-[var(--color-text-secondary)] hover:border-white/40 hover:text-white'}`}>
              {item.label}
            </button>
          ))}
        </div>
        <div id="demo-panel" role="tabpanel" aria-labelledby={`demo-tab-${activeDemo}`} tabIndex={0} className="grid gap-8 rounded-2xl border border-white/10 bg-[var(--color-bg-surface)] px-5 py-8 sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
          <div className="lg:order-2">
            <p className="mb-3 text-sm font-semibold text-[var(--color-violet-300)]">{demo.label}</p>
            <h3 className="font-display text-3xl leading-tight sm:text-4xl">{demo.title}</h3>
            <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)]">{demo.description}</p>
            <ol className="mt-6 space-y-4">
              {demo.steps.map((step, index) => (
                <li key={step} className="flex items-start gap-3 text-base leading-relaxed text-white/90">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-primary)]/20 text-sm font-semibold text-[var(--color-violet-200)]">{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-7 border-t border-white/10 pt-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">Capture de l'application en préparation. Les offres et leurs fonctionnalités sont détaillées sur la <Link to="/tarifs" className="text-[var(--color-violet-200)] underline underline-offset-4">page tarifs</Link>.</p>
          </div>
          <div className="lg:order-1"><PhoneFrame key={demo.src} src={demo.src} poster={demo.poster} label={demo.videoLabel} /></div>
        </div>
        <details className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02]">
          <summary className="cursor-pointer p-5 text-base font-semibold sm:p-6">Explorer les 8 modules de l'application</summary>
          <div className="grid gap-4 px-5 pb-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {MODULES.map(module => (
              <article key={module.title} className="rounded-xl border border-white/10 p-4">
                <img src={module.img} alt="" loading="lazy" className="mb-3 h-14 w-14 object-contain" />
                <h3 className="font-display text-xl tracking-wide">{module.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{module.desc}</p>
              </article>
            ))}
          </div>
        </details>
      </section>

      <PricingSection compact />

      <section className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <div className="grid gap-7 rounded-2xl border border-white/10 bg-[var(--color-bg-surface)] p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-violet-300)]"><Users className="h-4 w-4" aria-hidden="true" /> Tu accompagnes des pratiquants ?</p>
            <h2 className="font-display text-3xl">Un espace prévu pour les coachs.</h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)]">Coach Suite réunit le suivi des athlètes, leur tableau de bord et la messagerie. Les salles disposent aussi d'un programme partenaires dédié.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/tarifs#coach-suite" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-semibold hover:bg-white/5">Découvrir Coach Suite <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/partenaires" className="inline-flex min-h-11 items-center justify-center text-sm text-[var(--color-violet-200)] hover:underline">Programme salles et clubs</Link>
          </div>
        </div>
      </section>
      <section className="border-t border-white/10 px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 font-display text-4xl sm:text-5xl">Les réponses avant de te lancer.</h2>
          <FaqAccordion items={faqs.filter(item => ['dispo', 'prix', 'niveau', 'difference'].includes(item.id))} />
        </div>
      </section>
      <section className="border-t border-white/10 bg-[var(--color-bg-surface)] px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-xl">
          <h2 className="font-display text-4xl sm:text-5xl">On te prévient au lancement.</h2>
          <p className="mt-4 mb-7 text-base leading-relaxed text-[var(--color-text-secondary)]">Inscris-toi pour recevoir un email lorsque MMA IQ sera disponible sur iOS et Android.</p>
          <WaitlistForm id="app-footer-waitlist" onSuccess={onSuccess} />
        </div>
      </section>
      {showSticky && !signedUp && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[var(--color-bg-base)]/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-lg md:hidden">
          <a href="#download" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-accent-primary)] px-5 text-base font-bold text-white hover:bg-[var(--color-violet-600)]"><Bell className="h-4 w-4" aria-hidden="true" /> Être prévenu du lancement</a>
        </div>
      )}
    </div>
  );
}
