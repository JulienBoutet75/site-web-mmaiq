import { Seo } from "../components/Seo";
import { PROFILE_HEADING, ProfileActionBand, ProfileFeatures, ProfileHero } from "../components/ProfileSections";
import { useAuth } from "../context/AuthContext";
import { ButtonLink, Section, cx } from "../v3/ui";

// Figma « Coach · Desktop · Vue complète » (2190:21498) et « Mobile » (2190:21593).
// Les trois accès à l’espace coach mènent à l’accès par clé (prototype « Accès coach ») ;
// un coach déjà connecté va directement à son tableau de bord.

const OVERVIEW = [
  { title: "Construire le cycle", text: "Organise les programmes et les objectifs de ta team selon les niveaux, les échéances et les besoins." },
  { title: "Suivre la progression", text: "Retrouve les entraînements et les vidéos pour ajuster ton accompagnement d’une semaine à l’autre." },
  { title: "Préparer la séance", text: "Arrive avec une lecture claire du travail à mener. Tes informations sont regroupées, ton attention reste sur l’athlète." },
];

const SESSION_FLOW = [
  "Avant : retrouve les objectifs et les dernières séances de tes athlètes.",
  "Pendant : garde le cap sur le travail technique et les points à observer.",
  "Après : reviens sur les vidéos et prépare la suite avec ta team.",
];

/**
 * Variante Figma « MMA IQ V3 / iPhone / Performance » : même cadre titane que <IPhone>,
 * avec une zone de statut réservée au-dessus de la capture (qui n’a pas de barre de statut).
 * Géométrie en pourcentages de la référence 272 px.
 */
function IPhonePerformance({ src, alt, caption, className }: { src: string; alt: string; caption: string; className?: string }) {
  return (
    <figure className={cx("flex shrink-0 flex-col items-center gap-4", className)}>
      <div className="v3-iphone">
        <span className="v3-iphone__btn v3-iphone__btn--action" aria-hidden="true" />
        <span className="v3-iphone__btn v3-iphone__btn--vol-up" aria-hidden="true" />
        <span className="v3-iphone__btn v3-iphone__btn--vol-down" aria-hidden="true" />
        <span className="v3-iphone__btn v3-iphone__btn--side" aria-hidden="true" />
        <div className="v3-iphone__glass" style={{ paddingBottom: "3.612%" }}>
          <div aria-hidden="true" className="rounded-t-[36px] bg-[#242132]" style={{ aspectRatio: "256.457 / 30.114" }} />
          <img src={src} alt={alt} width={768} height={1568} loading="lazy" decoding="async" className="block h-auto w-full" style={{ aspectRatio: "768 / 1568" }} />
        </div>
        <span className="v3-iphone__island" aria-hidden="true" />
        <span className="v3-iphone__lens" aria-hidden="true" />
        <span className="v3-iphone__home" aria-hidden="true" />
        <span aria-hidden="true" className="absolute top-[3.73%] left-[7.86%] text-[7.76px] leading-[10.35px] text-white lg:text-[8.49px] lg:leading-[11.32px]">9:41</span>
        <span aria-hidden="true" className="absolute top-[3.73%] left-[76.79%] flex items-center gap-[3px] text-[7.76px] leading-[10.35px] text-white lg:text-[8.49px] lg:leading-[11.32px]">
          5G<span className="inline-block h-[3px] w-[10px] rounded-[1px] bg-white" />
        </span>
      </div>
      <figcaption className="v3-small w-full text-center text-v3-muted">{caption}</figcaption>
    </figure>
  );
}

export function CoachLanding() {
  const { isCoach, isAdmin } = useAuth();
  const coachSpace = isCoach || isAdmin ? "/coach/dashboard" : "/acces-coach";

  return (
    <>
      <Seo
        title="Pour les coachs — MMA IQ"
        description="Retrouve les programmes, les vidéos et la progression de tes athlètes pour préparer leur prochaine séance avec l’espace coach MMA IQ."
        canonicalPath="/coach"
      />

      {/* 01 · Pour les coachs */}
      <ProfileHero
        eyebrow="POUR LES COACHS"
        title={<>Le talent se travaille.<br />En équipe.</>}
        intro="Retrouve les programmes, les vidéos et la progression de tes athlètes pour préparer leur prochaine séance."
        action={<ButtonLink to={coachSpace}>Découvrir l’espace coach</ButtonLink>}
        note="Ton expertise. Un suivi mieux organisé."
        image={{
          src: "/v3/photo-coach-corner.webp",
          alt: "Deux coachs donnent leurs consignes à un combattant assis dans le coin de la cage",
          width: 1600,
          height: 900,
        }}
      />

      {/* 02 · Une vue sur chaque athlète */}
      <Section tone="clair" className="py-12 lg:py-[72px]" innerClassName="flex flex-col gap-6 lg:gap-10">
        <h2 className={cx(PROFILE_HEADING, "text-v3-navy")}>Une vue d’ensemble.<br />Le détail de chaque athlète.</h2>
        <p className="v3-body text-v3-ink-muted lg:max-w-[960px]">
          Garde une vision d’ensemble, sans perdre les détails qui comptent pour chaque athlète.
        </p>
        <ProfileFeatures items={OVERVIEW} tone="light" />
      </Section>

      {/* 03 · Du suivi au terrain */}
      <Section tone="surface" className="py-12 lg:py-[72px]" innerClassName="flex flex-col items-center gap-8 lg:flex-row lg:gap-16">
        <div className="flex w-full flex-col items-start gap-6 lg:max-w-[600px] lg:flex-1">
          <p className="v3-label text-v3-muted">DU SUIVI AUX DÉCISIONS</p>
          <h2 className={cx(PROFILE_HEADING, "text-v3-paper")}>Avant. Pendant.<br />Après la séance.</h2>
          <div className="v3-body flex flex-col gap-7 text-v3-muted lg:max-w-[560px]">
            {SESSION_FLOW.map((line) => <p key={line}>{line}</p>)}
          </div>
          <ButtonLink to={coachSpace}>Ouvrir l’espace coach</ButtonLink>
        </div>
        <div className="flex w-full justify-center p-4 lg:w-[320px] lg:shrink-0 lg:p-6 xl:w-[592px]">
          <IPhonePerformance
            src="/v3/capture-performance.webp"
            alt="Écran Performance de MMA IQ : score global, répartition des macronutriments et calories quotidiennes d’un athlète"
            caption="Le suivi individuel"
            className="w-[260px] lg:w-[272px]"
          />
        </div>
      </Section>

      {/* 04 · Passer à l’action */}
      <ProfileActionBand
        title={<>Prépare le prochain cycle<br />de ta team.</>}
        intro="Retrouve ton espace coach et organise le prochain cycle de préparation."
      >
        <ButtonLink to={coachSpace}>Accéder à mon espace</ButtonLink>
        <ButtonLink to="/contact" variant="light">Parler à l’équipe MMA IQ</ButtonLink>
      </ProfileActionBand>
    </>
  );
}
