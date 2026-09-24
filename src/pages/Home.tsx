import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Seo } from "../components/Seo";
import { ArrowLink, DownloadButton, Eyebrow, IPhone, Section, StoreButtons } from "../v3/ui";

// Figma « Accueil · Desktop · Vue complète » (2190:20475) et « Mobile » (2190:20613).

const BENEFITS = [
  {
    title: "Retrouve tes exercices.",
    text: ["Organise tes séances et retrouve", "tes programmes au même endroit."],
    image: "/v3/photo-training-zone.webp",
    alt: "Salle d’entraînement MMA IQ : cordes ondulatoires, corde à sauter et travail au sac",
    tile: "bg-white lg:bg-v3-clair",
  },
  {
    title: "Reviens sur les actions clés.",
    text: ["Tutoriels et analyse vidéo :", "des repères pour affiner ta technique."],
    image: "/v3/photo-sparring-lab.webp",
    alt: "Deux combattants travaillent un enchaînement aux pattes d’ours",
    tile: "bg-v3-lavender lg:bg-v3-accent",
  },
  {
    title: "Suis ta progression.",
    text: ["Rassemble ton suivi et tes objectifs", "pour préparer la suite."],
    image: "/v3/photo-hands-wrapped.webp",
    alt: "Combattant concentré, mains bandées",
    tile: "bg-v3-navy lg:bg-v3-fond",
  },
];

const PROFILES = [
  { number: "01", title: "Je pratique", text: "Poser les bases. Trouver ton rythme.", to: "/pratiquant" },
  { number: "02", title: "Je combats", text: "Structurer ta préparation. Affiner ton gameplan.", to: "/combattant" },
  { number: "03", title: "Je coache", text: "Suivre tes athlètes. Accompagner leur progression.", to: "/coach" },
  { number: "04", title: "Je dirige une salle", text: "Connecter ton club. Rejoindre le programme partenaire.", to: "/partenaires" },
];

export function Home() {
  return (
    <>
      <Seo
        title="MMA IQ — Chaque round. Plus intelligent."
        description="De ta prochaine séance à ton prochain combat : prépare-toi, travaille ta technique et suis ta progression dans une seule app, disponible sur iOS et Android."
        canonicalPath="/"
      />

      {/* 02 · Hero — Une promesse, un produit */}
      <section className="v3-first-screen relative flex w-full flex-col overflow-hidden bg-v3-fond text-white lg:flex-row lg:items-center">
        <div aria-hidden="true" className="absolute inset-0 hidden lg:block">
          <img src="/v3/campaign-training.webp" alt="" width={1536} height={1024} fetchPriority="high" className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(44,36,66,0.98)] via-[rgba(33,27,51,0.82)] via-43% to-[rgba(26,22,37,0.08)]" />
        </div>

        <div className="v3-gutter relative flex w-full flex-1 flex-col justify-center gap-6 py-6 lg:py-14">
          <div className="v3-container flex flex-1 flex-col justify-center gap-6 lg:flex-none">
            <div className="flex w-full flex-col items-start gap-4 lg:max-w-[544px] lg:gap-6">
              <p className="v3-label whitespace-pre-wrap text-v3-lavender">{"MMA IQ  /  L’INTELLIGENCE DU COMBAT"}</p>
              <h1 className="v3-display text-v3-paper">Chaque round.<br />Plus intelligent.</h1>
              <p className="text-[16px] leading-6 text-v3-muted lg:text-[18px] lg:leading-7">
                <span className="lg:hidden">Planifie tes entraînements, suis ta nutrition et prépare tes combats dans une seule app.</span>
                <span className="hidden lg:inline">De ta prochaine séance à ton prochain combat. Prépare-toi, travaille ta technique et suis ta progression dans une seule app.</span>
              </p>
              <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:gap-6">
                <DownloadButton />
                <ArrowLink to="/application">Voir l’application en action</ArrowLink>
              </div>
              <p className="v3-small text-v3-muted">
                Disponible sur iOS et Android<span className="hidden lg:inline"> · Commence gratuitement</span>
              </p>
            </div>

            {/* Mobile : la photo de campagne passe sous le texte */}
            <div className="relative min-h-[120px] w-full flex-1 overflow-hidden rounded-[16px] lg:hidden">
              <img src="/v3/campaign-training.webp" alt="Une athlète travaille son direct avec son coach aux pattes d’ours" width={1536} height={1024} className="absolute inset-0 size-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* V3 · Du travail au progrès */}
      <Section tone="fond" className="py-12 lg:py-16">
        <div className="flex flex-col items-center gap-8 lg:min-h-[635px] lg:flex-row lg:justify-between lg:gap-16">
          <div className="flex w-full flex-col gap-6 lg:max-w-[600px]">
            <h2 className="v3-heading text-white">Moins d’improvisation.<br />Plus de direction.</h2>
            <div className="v3-body flex flex-col gap-7 text-white">
              <p>Tes entraînements et ton suivi nutrition, au même endroit.</p>
              <p>Retrouve tes séances, consulte leur avancement et garde une vue claire sur tes apports quotidiens.</p>
            </div>
          </div>
          <div className="flex w-full flex-col items-center gap-10 sm:flex-row sm:justify-center sm:gap-8 lg:w-[616px] lg:shrink-0">
            <IPhone src="/v3/capture-training.webp" alt="Écran Entraînement de MMA IQ : calendrier de la semaine, statistiques et séance de sparring prévue" caption="Ta prochaine séance" className="w-[260px] lg:w-[272px]" />
            <IPhone src="/v3/capture-nutrition.webp" alt="Écran Nutrition de MMA IQ : calories restantes et répartition des macronutriments" caption="Ton suivi nutrition" className="w-[260px] lg:w-[272px]" />
          </div>
        </div>
      </Section>

      {/* 03 · Ce que l’app change */}
      <Section tone="clair" className="py-14 lg:py-20" innerClassName="flex flex-col gap-8 lg:gap-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-20">
          <h2 className="v3-heading-lg text-v3-navy lg:w-[720px] lg:shrink-0">Prépare le travail <br />de ta prochaine séance.</h2>
          <p className="v3-body hidden text-v3-ink-muted lg:block lg:max-w-[440px]">
            Retrouve tes exercices, les points techniques à travailler et le suivi de tes séances.
          </p>
        </div>
        <ul className="grid gap-8 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <li key={benefit.title} className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-6">
              <div className={`relative h-[142px] w-[110px] shrink-0 overflow-hidden rounded-[16px] lg:h-[300px] lg:w-full ${benefit.tile}`}>
                <img src={benefit.image} alt={benefit.alt} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2 lg:gap-6">
                <h3 className="text-[22px] font-medium leading-[26px] text-v3-navy lg:text-[26px] lg:font-semibold lg:leading-8">{benefit.title}</h3>
                <p className="text-[16px] leading-6 text-v3-ink-muted lg:text-[18px] lg:leading-7">
                  {benefit.text[0]}<br className="hidden lg:block" /><span className="lg:hidden"> </span>{benefit.text[1]}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* 04 · À chacun son parcours */}
      <Section tone="fond" className="py-14 lg:py-24" innerClassName="flex flex-col gap-8 lg:flex-row lg:gap-20">
        <div className="flex flex-col gap-4 lg:w-[500px] lg:shrink-0 lg:gap-6">
          <Eyebrow>CHOISIS TON POINT DE DÉPART</Eyebrow>
          <h2 className="v3-heading-lg text-v3-paper">Des outils pour <br />ta façon de pratiquer.</h2>
          <p className="text-[16px] leading-6 text-v3-muted lg:max-w-[440px] lg:text-[18px] lg:leading-7">
            Du premier entraînement à la préparation <br className="hidden lg:block" />d’un combat.
            <span className="hidden lg:inline"> Seul, avec ton coach <br />ou avec toute ta salle.</span>
          </p>
        </div>
        <ul className="flex w-full flex-col lg:max-w-[700px]">
          {PROFILES.map((profile) => (
            <li key={profile.to}>
              <Link to={profile.to} className="group flex items-center gap-4 border-b border-v3-border py-6 lg:gap-6 lg:py-7">
                <span className="v3-label shrink-0 text-v3-lavender">{profile.number}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="text-[22px] font-medium leading-[26px] text-v3-paper transition-colors group-hover:text-white lg:text-[26px] lg:font-semibold lg:leading-8">{profile.title}</span>
                  <span className="v3-label text-v3-muted">{profile.text}</span>
                </span>
                <ArrowUpRight aria-hidden="true" strokeWidth={2.4} className="size-6 shrink-0 text-v3-lavender transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* 05 · Prochaine étape */}
      <Section tone="accent" className="py-14 lg:py-20" innerClassName="flex flex-col items-center gap-6 text-center">
        <h2 className="v3-heading-lg w-full max-w-[1000px] text-white">Ta prochaine séance <br />commence ici.</h2>
        <p className="w-full max-w-[1000px] text-[16px] leading-6 text-white lg:text-[18px] lg:leading-7">Télécharge MMA IQ et prépare ta prochaine séance.</p>
        <StoreButtons className="w-full max-w-[294px] sm:w-auto sm:max-w-none sm:justify-center" stackOnMobile />
        <p className="v3-small text-white">iPhone · Android</p>
      </Section>
    </>
  );
}
