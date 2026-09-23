import { Seo } from "../components/Seo";
import { PROFILE_HEADING, ProfileActionBand, ProfileFeatures, ProfileHero } from "../components/ProfileSections";
import { ButtonLink, DownloadButton, Eyebrow, Photo, Section, cx } from "../v3/ui";

// Figma « Combattant · Desktop · Vue complète » (2190:21343) et « Mobile » (2190:21423).

const CAMP = [
  { title: "Entraînement", text: "Structure tes séances et ton travail technique autour des priorités de ton prochain combat." },
  { title: "Nutrition & suivi", text: "Rassemble les repères de ta préparation physique et de ton suivi nutritionnel dans le même outil." },
  { title: "Staff connecté", text: "Partage ton évolution, tes analyses et ton gameplan avec les personnes qui t’accompagnent." },
];

export function Combattant() {
  return (
    <>
      <Seo
        title="Pour les combattants — MMA IQ"
        description="Reviens sur ta vidéo, repère les actions clés et construis ton gameplan avec ton coach. Entraînement, nutrition et préparation du combat dans MMA IQ."
        canonicalPath="/combattant"
      />

      {/* 01 · Pour les combattants */}
      <ProfileHero
        eyebrow="POUR LES COMBATTANTS"
        title={<>Ton prochain combat<br />se prépare ici.</>}
        intro="Reviens sur ta vidéo, repère les actions clés et examine les pistes tactiques avec ton coach."
        action={<ButtonLink to="/application">Préparer mon prochain combat</ButtonLink>}
        note="MMA IQ est disponible sur iOS et Android"
        image={{
          src: "/v3/photo-hands-wrapped.webp",
          alt: "Combattant concentré dans le vestiaire, mains bandées",
          width: 1200,
          height: 675,
        }}
      />

      {/* 02 · De l’analyse au gameplan */}
      <Section tone="clair" className="py-12 lg:py-[72px]" innerClassName="flex flex-col items-center gap-8 lg:flex-row lg:gap-16">
        <Photo
          src="/v3/photo-high-kick.webp"
          alt="Coup de pied haut touchant l’adversaire dans la cage MMA IQ"
          width={1600}
          height={900}
          className="aspect-video w-full shrink-0 lg:w-[46%] xl:w-[592px]"
        />
        <div className="flex w-full flex-col items-start gap-6 lg:max-w-[600px] lg:flex-1">
          <Eyebrow tone="light">01 — OBSERVER POUR MIEUX DÉCIDER</Eyebrow>
          <h2 className={cx(PROFILE_HEADING, "text-v3-navy")}>De la vidéo<br />aux pistes tactiques.</h2>
          <p className="v3-body text-v3-ink-muted lg:max-w-[560px]">
            Décortique les séquences de ton adversaire : habitudes, ouvertures et situations clés. Mets les bonnes questions au centre de ta préparation.
          </p>
          <p className="v3-body text-v3-ink-muted lg:max-w-[560px]">
            Construis ton gameplan, partage-le avec ton staff et relie chaque priorité aux séances de ton camp.
          </p>
          <ButtonLink to="/application">Découvrir l’analyse vidéo</ButtonLink>
        </div>
      </Section>

      {/* 03 · Le camp complet */}
      <Section tone="surface" className="py-12 lg:py-[72px]" innerClassName="flex flex-col gap-6 lg:gap-10">
        {/* À 390 px, la maquette passe « nutrition, » à la ligne : la ligne tient à 1 px près dans le navigateur. */}
        <h2 className={cx(PROFILE_HEADING, "text-v3-paper max-sm:max-w-[340px]")}>Entraînement, nutrition,<br />préparation du combat.</h2>
        <p className="v3-body text-v3-muted lg:max-w-[960px]">
          Une préparation lisible, des objectifs partagés et un fil conducteur jusqu’au combat.
        </p>
        <ProfileFeatures items={CAMP} tone="dark" />
      </Section>

      {/* 04 · Passer à l’action */}
      <ProfileActionBand
        title={<>Prépare la suite.<br />Avec ton équipe.</>}
        intro="Entraînement, analyse et gameplan dans la même application. Disponible sur iOS et Android."
      >
        <DownloadButton label="Télécharger l’application" />
        <ButtonLink to="/tarifs" variant="light">Voir les offres Performance &amp; Elite</ButtonLink>
      </ProfileActionBand>
    </>
  );
}
