import { Fragment, useState } from "react";
import { Seo } from "../components/Seo";
import { Dialog, useDialogTitleId } from "../v3/Dialog";
import { useV3UI } from "../v3/V3UIContext";
import { Button, ButtonLink, Section } from "../v3/ui";

// Figma « Crédits · Desktop · Vue complète » (2110:22571) et « Mobile » (2174:21290).
// Modale « V3 · Aide crédits » (2109:6736 / 2109:6754).

// Allocation mensuelle de crédits IA par formule (identique au paywall de l’application).
const ALLOCATIONS = [
  { plan: "Free", credits: "5 crédits" },
  { plan: "Essentiel", credits: "30 crédits" },
  { plan: "Performance", credits: "80 crédits" },
  { plan: "Elite", credits: "200 crédits" },
  { plan: "Coach Suite", credits: "150 crédits" },
];

// Titre de section : 36/40 Medium sur mobile, style « Heading » 48/54 sur desktop.
const SECTION_TITLE = "text-[36px] font-medium leading-10 tracking-[-1.08px] lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]";

export function Credits() {
  const [helpOpen, setHelpOpen] = useState(false);
  const openHelp = () => setHelpOpen(true);

  return (
    <>
      <Seo
        title="Crédits IA MMA IQ — Selon ta formule"
        description="Les crédits IA te permettent d’utiliser les outils IA de MMA IQ : gameplans, analyses et coach IA. Découvre les crédits inclus chaque mois dans chaque formule."
        canonicalPath="/credits"
      />

      {/* Introduction */}
      <Section tone="fond" as="header" className="py-12 lg:py-[72px]" innerClassName="flex flex-col gap-6 lg:gap-10">
        <p className="v3-label text-v3-lavender">LES CRÉDITS IA</p>
        <h1 className={`${SECTION_TITLE} text-white`}>Tes crédits IA,<br />selon ta formule.</h1>
        <p className="v3-body text-v3-muted lg:max-w-[720px]">
          Les crédits te permettent d’utiliser les outils IA de MMA IQ. Retrouve ton solde et ta consommation dans l’application.
        </p>
      </Section>

      {/* Usages IA */}
      <Section tone="clair" className="py-12 lg:py-[72px]" innerClassName="flex flex-col items-start gap-6 lg:gap-10">
        <h2 className={SECTION_TITLE}>À quoi servent tes crédits ?</h2>
        <p className="v3-subheading">De l’observation à la préparation</p>
        <p className="v3-body text-v3-ink-muted lg:max-w-[760px]">
          Crée un gameplan adapté à ton objectif et mobilise les outils IA de l’application. Retrouve ton solde et ta consommation dans ton espace MMA IQ.
        </p>
        <Button onClick={openHelp} aria-haspopup="dialog">Où trouver mes crédits ?</Button>
      </Section>

      {/* Crédits inclus */}
      <Section tone="accent" className="py-12 lg:py-[72px]" innerClassName="flex flex-col items-start gap-6 lg:gap-10">
        <h2 className={SECTION_TITLE}>Tes crédits mensuels<br />par formule.</h2>
        <dl className="grid w-full grid-cols-[minmax(0,180px)_minmax(0,1fr)] gap-x-4 text-[18px] leading-[48px] lg:grid-cols-[minmax(0,480px)_minmax(0,560px)] lg:gap-x-20 lg:text-[26px] lg:font-medium lg:leading-[64px]">
          {ALLOCATIONS.map(({ plan, credits }) => (
            <Fragment key={plan}>
              <dt>{plan}</dt>
              <dd>{credits}</dd>
            </Fragment>
          ))}
        </dl>
        <p className="v3-body lg:max-w-[760px]">Consulte le détail de ta formule et ton solde dans l’application.</p>
        <ButtonLink to="/tarifs">Comparer les formules</ButtonLink>
      </Section>

      {/* Gérer ses crédits */}
      <Section tone="clair" className="py-12 lg:py-[72px]" innerClassName="flex flex-col items-start gap-6 lg:gap-10">
        <h2 className={SECTION_TITLE}>
          <span className="lg:hidden">Plus de crédits ?</span>
          <span className="hidden lg:inline">Besoin d’aller plus loin ?</span>
        </h2>
        <p className="v3-body text-v3-ink-muted lg:max-w-[760px]">
          Retrouve les options disponibles pour ton compte depuis l’application. Avant tout achat, tu consultes le nombre de crédits, le prix et leurs conditions d’utilisation.
        </p>
        <Button onClick={openHelp} aria-haspopup="dialog">Où trouver mes crédits ?</Button>
      </Section>

      <CreditsHelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}

/** « V3 · Aide crédits » : le solde se consulte dans l’application. */
function CreditsHelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useDialogTitleId("credits-help-title");
  const { openStores } = useV3UI();
  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} panelClassName="max-w-[560px] rounded-[16px] bg-v3-surface p-6 text-white sm:p-10">
      <div className="flex flex-col items-start gap-6">
        <h2 id={titleId} className="text-[32px] font-semibold leading-[38px] sm:text-[40px] sm:leading-[46px]">Retrouve tes crédits dans l’app.</h2>
        <p className="v3-body text-v3-muted">Connecte-toi à l’application MMA IQ pour consulter ton solde et ta consommation.</p>
        <Button
          block
          data-autofocus
          aria-haspopup="dialog"
          onClick={() => {
            onClose();
            openStores();
          }}
        >
          Installer MMA IQ
        </Button>
        <Button variant="outline" onClick={onClose}>Fermer</Button>
      </div>
    </Dialog>
  );
}
