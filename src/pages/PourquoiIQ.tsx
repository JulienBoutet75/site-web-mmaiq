import { Seo } from "../components/Seo";
import { Button, ButtonLink, IPhone, Photo, Section } from "../v3/ui";
import { useV3UI } from "../v3/V3UIContext";

// Figma « Pourquoi IQ · Desktop · Vue complète » (2190:20942) et « Mobile » (2190:21060).

/** Titre de section : 36/40 Medium −1,08 px sur mobile, « Heading » 48/54 SemiBold −1 px sur desktop. */
const SECTION_TITLE =
  "text-[36px] font-medium leading-10 tracking-[-1.08px] lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]";

/** Ligne de liste séparée par un filet (24 px d’écart sur mobile, 40 px sur desktop). */
const RULED_ROW = "flex flex-col items-start gap-10 border-t border-v3-border pt-6 lg:flex-row lg:pt-10";

const PRINCIPLES = [
  {
    title: "Comprendre avant de répéter.",
    text: "Un geste ne se résume pas à une vidéo. Sa logique, son timing et sa place dans ton jeu comptent autant que son exécution.",
  },
  {
    title: "L’IA propose. Tu décides.",
    text: "MMA IQ t’aide à lire tes entraînements et à organiser la suite. Ton ressenti et l’expertise de ton coach restent au centre.",
  },
  {
    title: "Relier ce qui était dispersé.",
    text: "Ton programme, tes techniques et ta progression se retrouvent au même endroit. Pour garder le fil, séance après séance.",
  },
];

const ECOSYSTEM = [
  { name: "L’application", text: "Organiser ta pratique et suivre tes progrès.", cta: "Découvrir l’app", to: "/application" },
  { name: "L’Academy", text: "Approfondir une technique, à ton rythme.", cta: "Explorer l’Academy", to: "/academy" },
  { name: "Les partenaires", text: "Faire grandir l’expérience à l’échelle d’un club.", cta: "Devenir partenaire", to: "/partenaires" },
];

export function PourquoiIQ() {
  const { openStore } = useV3UI();

  return (
    <>
      <Seo
        title="Pourquoi MMA IQ — Comprendre pour progresser"
        description="Relie tes programmes, tes techniques et ton suivi pour préparer la séance suivante. L’IA propose, tu décides : découvre la conviction derrière MMA IQ."
        canonicalPath="/pourquoi-iq"
      />

      {/* 01 · Introduction */}
      <section className="v3-first-screen v3-gutter flex w-full flex-col bg-v3-fond text-white">
        <div className="v3-container flex flex-1 flex-col justify-center gap-4 py-6 lg:flex-row lg:items-center lg:gap-12 lg:py-12 xl:gap-20">
          <div className="flex flex-col items-start gap-4 lg:w-[480px] lg:shrink-0 lg:gap-6 xl:w-[608px]">
            <p className="v3-label text-v3-lavender">NOTRE CONVICTION</p>
            <h1 className="font-display text-[48px] font-normal uppercase leading-[52px] text-white lg:text-[80px] lg:leading-[84px]">
              Comprendre.<br />Pour progresser.
            </h1>
            <div className="flex flex-col items-start gap-10 lg:gap-6">
              <p className="text-[16px] leading-6 text-v3-muted lg:text-[18px] lg:leading-7">
                Relie tes programmes, tes techniques et ton suivi pour préparer la séance suivante.
              </p>
              <ButtonLink to="/application">Découvrir l’application</ButtonLink>
            </div>
          </div>
          <Photo
            src="/v3/photo-club-session.webp"
            alt="Séance collective dans une salle de sport de combat : frappes au sac et travail aux pattes d’ours"
            width={512}
            height={286}
            eager
            className="min-h-[120px] w-full flex-1 lg:min-w-0 lg:self-stretch"
          />
        </div>
      </section>

      {/* 02 · Manifeste IQ */}
      <Section tone="clair" className="py-12 lg:py-[72px]" innerClassName="flex flex-col items-start gap-6 lg:gap-10">
        <p className="v3-label text-v3-ink-muted">{"POURQUOI « IQ » ?"}</p>
        <h2 className={`${SECTION_TITLE} text-v3-navy`}>Ton entraînement,<br />plus facile à suivre.</h2>
        <ol className="flex w-full flex-col gap-6 lg:gap-10">
          {PRINCIPLES.map((principle, index) => (
            <li key={principle.title} className={RULED_ROW}>
              <span className="v3-label whitespace-nowrap text-v3-ink-muted">{`0${index + 1}`}</span>
              <h3 className="text-[26px] font-semibold leading-8 text-v3-navy lg:w-[450px] lg:min-w-0">{principle.title}</h3>
              <p className="v3-body text-v3-ink-muted lg:w-[660px] lg:min-w-0">{principle.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* 03 · La vision dans l’application */}
      <Section tone="fond" className="py-12 lg:py-[72px]" innerClassName="flex flex-col items-center gap-20 lg:flex-row lg:gap-12 xl:gap-20">
        <div className="flex w-full flex-col items-start gap-8 lg:w-[800px] lg:min-w-0">
          <p className="v3-label text-v3-lavender">DE L’IDÉE À LA SÉANCE</p>
          <h2 className="v3-heading text-white lg:max-w-[750px]">Tes programmes et ton suivi,<br />au même endroit.</h2>
          <p className="v3-body text-v3-muted lg:max-w-[720px]">
            MMA IQ rassemble les repères dont tu as besoin pour organiser tes séances et suivre tes progrès. La technologie donne de la lisibilité à ton travail.
          </p>
          <p className="v3-label whitespace-pre-wrap text-v3-lavender">{"PROGRAMME  /  TECHNIQUE  /  PROGRESSION"}</p>
          <p className="v3-body text-white">Disponible dès maintenant sur iOS et Android.</p>
          {/* Maquette : App Store en violet, Google Play en blanc */}
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <Button onClick={() => openStore("ios")}>App Store</Button>
            <Button variant="light" onClick={() => openStore("android")}>Google Play</Button>
          </div>
        </div>
        <IPhone
          src="/v3/capture-training.webp"
          alt="Écran Entraînement de MMA IQ : calendrier de la semaine, statistiques et séance de sparring prévue"
          caption="De l’idée à la séance"
          className="w-[260px] lg:w-[300px]"
        />
      </Section>

      {/* 04 · L’écosystème MMA IQ */}
      <Section tone="clair" className="py-12 lg:py-[72px]" innerClassName="flex flex-col items-start gap-6 lg:gap-10">
        <p className="v3-label text-v3-ink-muted">PLUSIEURS FAÇONS DE TRAVAILLER TON MMA</p>
        <h2 className={`${SECTION_TITLE} text-v3-navy`}>Choisis ce que tu veux travailler.</h2>
        {/* Desktop : colonnes partagées (sous-grille) pour garder noms, textes et boutons alignés */}
        <ul className="flex w-full flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,340px)_minmax(0,540px)_auto] lg:gap-10">
          {ECOSYSTEM.map((item) => (
            <li key={item.to} className={`${RULED_ROW} lg:col-span-3 lg:grid lg:grid-cols-subgrid`}>
              <h3 className="text-[26px] font-semibold leading-8 text-v3-navy">{item.name}</h3>
              <p className="v3-body text-v3-ink-muted">{item.text}</p>
              <ButtonLink to={item.to} className="lg:justify-self-start">{item.cta}</ButtonLink>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
