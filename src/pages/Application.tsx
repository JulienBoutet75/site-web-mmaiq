import { Seo } from "../components/Seo";
import { ButtonLink, DownloadButton, IPhone, Photo, Section, StoreButtons } from "../v3/ui";

// Figma « Application · Desktop · Vue complète » (2190:20749) et « Mobile » (2190:20843).

/** Titre de section : 36/40 Medium −1,08 px sur mobile, « Heading » 48/54 SemiBold −1 px sur desktop. */
const SECTION_TITLE =
  "text-[36px] font-medium leading-10 tracking-[-1.08px] lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]";

const MATCHUP_CAPTURES = [
  {
    src: "/v3/capture-matchup-comparison.webp",
    alt: "Écran Analyse de match-up de MMA IQ : deux combattants sélectionnés et leurs statistiques comparées",
    caption: "01 · Compare les profils",
  },
  {
    src: "/v3/capture-matchup-result.webp",
    alt: "Écran Résultat du match-up de MMA IQ : rapport de forces estimé et synthèse tactique",
    caption: "02 · Explore l’analyse",
  },
];

const ANALYSIS_STEPS = ["Importe ta vidéo", "Ouvre les séquences horodatées", "Prépare le travail suivant"];

const START_STEPS = [
  { title: "Télécharge MMA IQ", text: "Disponible sur iOS et Android." },
  { title: "Crée ton profil dans l’app", text: "Ton niveau, tes objectifs, ta pratique." },
  { title: "Prépare ta première séance", text: "Retrouve tes outils dans l’application." },
];

export function Application() {
  return (
    <>
      <Seo
        title="L’application MMA IQ — Le travail continue dans ton app"
        description="Planifie tes entraînements, suis ta nutrition, compare les profils de combattants et explore la synthèse tactique du match-up. MMA IQ est disponible sur iOS et Android."
        canonicalPath="/application"
      />

      {/* 01 · Application — Hero */}
      <section className="v3-first-screen v3-gutter flex w-full flex-col bg-v3-fond text-white">
        <div className="v3-container flex flex-1 flex-col items-center justify-between gap-10 py-6 lg:flex-row lg:justify-start lg:gap-12 lg:py-[72px] xl:gap-16">
          <div className="flex w-full flex-col items-start gap-4 lg:min-w-0 lg:max-w-[672px] lg:flex-1 lg:gap-6">
            <p className="v3-label text-v3-lavender">L’APPLICATION MMA IQ</p>
            {/* 96/94 dès 1 400 px ; réduit en dessous pour garder deux lignes à côté des iPhone */}
            <h1 className="font-display text-[48px] font-normal uppercase leading-[52px] text-v3-paper min-[1024px]:text-[64px] min-[1024px]:leading-[64px] min-[1280px]:text-[80px] min-[1280px]:leading-[80px] min-[1400px]:text-[96px] min-[1400px]:leading-[94px]">
              Le travail continue.<br />Dans ton app.
            </h1>
            <p className="text-[16px] leading-6 text-v3-muted lg:text-[18px] lg:leading-7">
              <span className="lg:hidden">Entraînement, nutrition, analyse : tes outils réunis dans une seule app, disponible sur iOS et Android.</span>
              <span className="hidden lg:inline">Planifie tes entraînements, suis ta nutrition et compare les profils de combattants. Explore ensuite la synthèse tactique du match-up. MMA IQ est disponible sur iOS et Android.</span>
            </p>
            <DownloadButton />
          </div>

          {/* Mobile : un seul écran, calé en bas du premier écran */}
          <IPhone src={MATCHUP_CAPTURES[0].src} alt={MATCHUP_CAPTURES[0].alt} eager className="w-[180px] lg:hidden" />

          {/* Desktop : les deux étapes du match-up côte à côte */}
          <div className="hidden lg:flex lg:w-[432px] lg:shrink-0 lg:justify-center lg:gap-8 xl:w-[512px]">
            {MATCHUP_CAPTURES.map((capture) => (
              <IPhone key={capture.src} src={capture.src} alt={capture.alt} caption={capture.caption} eager className="w-[200px] xl:w-[240px]" />
            ))}
          </div>
        </div>
      </section>

      {/* 02 · Comparaison et analyse — démonstration complète (mobile uniquement) */}
      <Section tone="fond" className="py-6 lg:hidden" innerClassName="flex flex-col items-center gap-6">
        <h2 className={`${SECTION_TITLE} w-full text-v3-paper`}>Compare les profils.<br />Explore le match-up.</h2>
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-8">
          {MATCHUP_CAPTURES.map((capture) => (
            <IPhone key={capture.src} src={capture.src} alt={capture.alt} caption={capture.caption} className="w-[260px]" />
          ))}
        </div>
      </Section>

      {/* 02 · Comprendre tes vidéos */}
      <Section tone="clair" className="py-12 lg:py-[72px]" innerClassName="flex flex-col gap-6 lg:gap-10">
        <h2 className={`${SECTION_TITLE} text-v3-navy`}>Retrouve les séquences<br />qui comptent.</h2>
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:gap-16">
          <Photo
            src="/v3/photo-high-kick.webp"
            alt="Dans la cage MMA IQ, un combattant en short bleu touche son adversaire d’un high kick"
            width={1600}
            height={900}
            className="aspect-[9/5] w-full lg:w-[720px] lg:min-w-0"
          />
          <div className="flex w-full flex-col items-start gap-6 lg:w-[496px] lg:min-w-0">
            <ol className="text-[26px] font-semibold leading-8 text-v3-navy">
              {ANALYSIS_STEPS.map((step, index) => (
                <li key={step} className="whitespace-pre-wrap">{`0${index + 1}  ${step}`}</li>
              ))}
            </ol>
            <p className="text-[16px] leading-6 text-v3-ink-muted lg:text-[18px] lg:leading-7">
              L’IA apporte des pistes. Toi et ton coach gardez la main sur les décisions et la suite de l’entraînement.
            </p>
            <ButtonLink to="/credits">Comprendre les crédits</ButtonLink>
          </div>
        </div>
      </Section>

      {/* 03 · Commencer */}
      <Section tone="accent" className="py-12 lg:py-[72px]" innerClassName="flex flex-col items-start gap-6 lg:gap-10">
        <h2 className={`${SECTION_TITLE} text-white`}>Télécharge l’app.<br />Prépare ta séance.</h2>
        <ol className="grid w-full gap-6 text-[16px] leading-6 text-white lg:grid-cols-3 lg:gap-10 lg:text-[18px] lg:leading-7">
          {START_STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="block">{`0${index + 1}`}</span>
              <span className="block">{step.title}</span>
              <span className="block">{step.text}</span>
            </li>
          ))}
        </ol>
        <StoreButtons className="flex-col sm:flex-row" />
      </Section>
    </>
  );
}
