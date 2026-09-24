import { Seo } from "../components/Seo";
import { PROFILE_HEADING, ProfileActionBand, ProfileHero } from "../components/ProfileSections";
import { ButtonLink, DownloadButton, Eyebrow, IPhone, Photo, Section, cx } from "../v3/ui";

// Figma « Pratiquant · Desktop · Vue complète » (2190:21172) et « Mobile » (2190:21260).

const STEPS = [
  { title: "DÉFINIS TON OBJECTIF", text: "Construis une pratique qui te ressemble." },
  { title: "SUIS TON PROGRAMME", text: "Avance séance après séance, à ton rythme." },
];

export function Pratiquant() {
  return (
    <>
      <Seo
        title="Pour les pratiquants — MMA IQ"
        description="Retrouve tes exercices, leurs consignes et le suivi de ton entraînement. Avec MMA IQ, tu sais quoi travailler à ta prochaine séance."
        canonicalPath="/pratiquant"
      />

      {/* 01 · Pour les pratiquants */}
      <ProfileHero
        eyebrow="POUR LES PRATIQUANTS"
        title={<>Chaque séance.<br />Un cap clair.</>}
        intro="Retrouve tes exercices, leurs consignes et le suivi de ton entraînement. Tu sais quoi travailler à ta prochaine séance."
        action={<ButtonLink to="/application">Découvrir l’application</ButtonLink>}
        note="Disponible sur iOS et Android"
        image={{
          src: "/v3/photo-training-zone.webp",
          alt: "Salle d’entraînement MMA IQ : cordes ondulatoires, travail au sac et corde à sauter",
          width: 1200,
          height: 515,
        }}
      />

      {/* 02 · Un programme à ton niveau */}
      <Section tone="clair" className="py-12 lg:py-[72px]" innerClassName="flex flex-col items-center gap-8 lg:flex-row lg:gap-20">
        <div className="flex w-full flex-col gap-6 lg:max-w-[660px] lg:flex-1">
          <Eyebrow tone="light">01 — TROUVE TON RYTHME</Eyebrow>
          <h2 className={cx(PROFILE_HEADING, "text-v3-navy")}>Retrouve les exercices<br />de ta séance.</h2>
          <p className="v3-body text-v3-ink-muted lg:max-w-[580px]">
            Un programme adapté à ton niveau et à ta disponibilité. Tu ouvres l’app, tu retrouves ta séance, tu sais quoi travailler.
          </p>
          <dl className="v3-body flex flex-col gap-7 text-v3-navy lg:max-w-[580px]">
            {STEPS.map((step) => (
              <div key={step.title}>
                <dt>{step.title}</dt>
                <dd>{step.text}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex w-full justify-center p-4 lg:w-[320px] lg:shrink-0 lg:p-6 xl:w-[540px]">
          <IPhone
            src="/v3/capture-training.webp"
            alt="Écran Entraînement de MMA IQ : calendrier de la semaine, statistiques et séance de sparring prévue"
            caption="Ta prochaine séance"
            className="w-[260px] lg:w-[272px]"
          />
        </div>
      </Section>

      {/* 03 · Apprendre et progresser */}
      <Section tone="clair" className="pt-6 pb-12 lg:pt-4 lg:pb-[72px]" innerClassName="flex flex-col items-center gap-8 lg:flex-row lg:gap-16">
        <Photo
          src="/v3/photo-sparring-lab.webp"
          alt="Deux combattants travaillent un enchaînement aux pattes d’ours devant le mur MMA IQ Perf Lab Zone"
          width={1600}
          height={687}
          className="h-[240px] w-full shrink-0 sm:h-[360px] lg:h-[430px] lg:w-[46%] xl:w-[592px]"
        />
        <div className="flex w-full flex-col items-start gap-6 lg:max-w-[600px] lg:flex-1">
          <Eyebrow tone="light">02 — APPRENDS. OBSERVE. PROGRESSE.</Eyebrow>
          <h2 className={cx(PROFILE_HEADING, "text-v3-navy")}>La démonstration.<br />Les consignes.<br />La pratique.</h2>
          <p className="v3-body text-v3-ink-muted lg:max-w-[560px]">
            Retrouve les explications techniques en vidéo. Reviens sur les points clés avant de les travailler au club.
          </p>
          <p className="v3-body text-v3-ink-muted lg:max-w-[560px]">
            Filme tes sparrings, analyse tes séquences et suis ta progression. Tes prochaines séances partent de ce que tu as appris.
          </p>
          <ButtonLink to="/academy">Explorer l’Academy</ButtonLink>
        </div>
      </Section>

      {/* 04 · Passer à l’action */}
      <ProfileActionBand
        title={<>Ta prochaine séance<br />commence avec MMA IQ.</>}
        intro="L’application est déjà disponible. Retrouve ton entraînement sur iPhone et Android."
      >
        <DownloadButton label="Télécharger l’application" />
        <ButtonLink to="/tarifs" variant="light">Comparer les offres</ButtonLink>
      </ProfileActionBand>
    </>
  );
}
