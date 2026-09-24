import { Seo } from "../components/Seo";
import { KEY_FIGURE, PROFILE_HEADING, ProfileActionBand, ProfileHero } from "../components/ProfileSections";
import { CLUB_OFFER_REFERENCE } from "../config/subscriptionCommercial";
import { ButtonLink, Eyebrow, Photo, Section, cx } from "../v3/ui";

// Figma « Partenaire · Desktop · Vue complète » (2190:21683) et « Mobile » (2190:21761).
// « Devenir partenaire » mène au formulaire de contact (motif partenariat, lead `partner`),
// comme dans le prototype ; l’offre détaillée est sur /tarifs/club.

const CONTACT_PARTNER = "/contact?motif=partner";

// Pourcentages issus de la référence commerciale (remise membres, commission club).
const MEMBER_DISCOUNT = `${CLUB_OFFER_REFERENCE.discountPercent}\u00a0%`;
const CLUB_COMMISSION = `${Math.round(CLUB_OFFER_REFERENCE.clubCommissionRate * 100)}\u00a0%`;

const PROGRAM_STEPS = [
  { title: "01  Rejoins le programme", text: "Présente ton club à notre équipe." },
  { title: "02  Partage ton code", text: "Tes membres l’utilisent en s’abonnant à MMA IQ." },
  { title: "03  Retrouve ton suivi", text: "Consulte les ventes et commissions dans ton espace club." },
];

export function Partenaires() {
  return (
    <>
      <Seo
        title="Clubs & partenaires — MMA IQ"
        description="Recommande MMA IQ à ta communauté : tes membres bénéficient d’une remise sur les abonnements mensuels Performance et Elite, ton club perçoit une commission."
        canonicalPath="/partenaires"
      />

      {/* 01 · Pour les clubs & partenaires */}
      <ProfileHero
        eyebrow="POUR LES CLUBS & PARTENAIRES"
        title={<>Ton club.<br />Un temps d’avance.</>}
        intro="Recommande MMA IQ à ta communauté. Tes membres bénéficient d’une remise, ton club perçoit une commission."
        action={<ButtonLink to={CONTACT_PARTNER}>Devenir partenaire</ButtonLink>}
        note="Un programme pensé pour la vie du club."
        image={{
          src: "/v3/photo-sparring-lab.webp",
          alt: "Deux combattants travaillent un enchaînement aux pattes d’ours dans un club",
          width: 1600,
          height: 687,
        }}
      />

      {/* 02 · Un bénéfice partagé */}
      <Section tone="clair" className="py-12 lg:py-[72px]" innerClassName="flex flex-col gap-6 lg:gap-10">
        <h2 className={cx(PROFILE_HEADING, "text-v3-navy")}>Un avantage pour eux.<br />Un retour pour ton club.</h2>
        <p className="v3-body text-v3-ink-muted lg:max-w-[960px]">
          Le programme s’applique aux abonnements Performance et Elite.
        </p>
        <ul className="grid gap-10 lg:grid-cols-2">
          <li className="flex flex-col gap-6 rounded-[16px] bg-v3-accent p-8 text-white">
            <p className={KEY_FIGURE}>{MEMBER_DISCOUNT}</p>
            <h3 className="v3-subheading">de remise pour tes membres</h3>
            <p className="v3-body">
              Pour tes membres, sur les abonnements mensuels Performance et Elite souscrits avec le code de ton club.
            </p>
          </li>
          <li className="flex flex-col gap-6 rounded-[16px] bg-v3-fond p-8">
            <p className={cx(KEY_FIGURE, "text-v3-lavender")}>{CLUB_COMMISSION}</p>
            <h3 className="v3-subheading text-v3-paper">de commission pour ton club</h3>
            <p className="v3-body text-v3-muted">
              Pour ton club, calculée sur le montant HT de chaque abonnement vendu via ton code partenaire.
            </p>
          </li>
        </ul>
      </Section>

      {/* 03 · Rejoindre le programme */}
      <Section tone="clair" className="py-12 lg:py-[72px]" innerClassName="flex flex-col items-center gap-8 lg:flex-row lg:gap-16">
        <div className="flex w-full flex-col items-start gap-6 lg:max-w-[600px] lg:flex-1">
          <Eyebrow tone="light">LE PROGRAMME, SIMPLEMENT</Eyebrow>
          <h2 className={cx(PROFILE_HEADING, "text-v3-navy")}>Un code.<br />Une communauté.<br />Un suivi clair.</h2>
          <ol className="v3-body flex flex-col gap-7 text-v3-ink-muted lg:max-w-[560px]">
            {PROGRAM_STEPS.map((step) => (
              <li key={step.title}>
                <p className="whitespace-pre-wrap">{step.title}</p>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
          <ButtonLink to="/espace-club">Découvrir l’espace club</ButtonLink>
        </div>
        <Photo
          src="/v3/photo-training-zone.webp"
          alt="La vie du club : travail aux cordes ondulatoires, au sac et à la corde à sauter dans la salle MMA IQ"
          width={1200}
          height={515}
          className="aspect-[4096/1758] w-full shrink-0 lg:w-[46%] xl:w-[592px]"
        />
      </Section>

      {/* 04 · Passer à l’action */}
      <ProfileActionBand
        title={<>Fais entrer MMA IQ<br />dans ton club.</>}
        intro="Présente-nous ta structure. Nous t’accompagnons pour rejoindre le programme partenaire."
      >
        <ButtonLink to={CONTACT_PARTNER}>Devenir partenaire</ButtonLink>
        <ButtonLink to="/tarifs/club" variant="light">Consulter les tarifs partenaires</ButtonLink>
      </ProfileActionBand>
    </>
  );
}
