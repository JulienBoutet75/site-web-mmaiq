import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Users } from "lucide-react";
import { Seo } from "../components/Seo";
import { useAuth } from "../context/AuthContext";
import { CLUB_OFFER_REFERENCE } from "../config/subscriptionCommercial";
import { ButtonLink, Section, buttonClass } from "../v3/ui";
import { Dialog, useDialogTitleId } from "../v3/Dialog";

// Figma « Espace club · Desktop · Vue complète » (2110:23916), « Mobile » (2174:21909)
// et « Club · Kit partenaire » (2107:20052).
// Aucune donnée partenaire n’est encore rattachable à un compte du site : la table
// `partners` est réservée à l’admin (RLS) et les commissions vivent dans lab-service.
// La page affiche donc les états vides de la maquette, sans chiffres inventés.

const TABS = [
  { id: "vue-d-ensemble", label: "Vue d’ensemble" },
  { id: "parrainages", label: "Parrainages" },
  { id: "ressources", label: "Ressources" },
  { id: "mon-contrat", label: "Mon contrat" },
] as const;

const INDICATORS = [
  { label: "Abonnements attribués", value: "0", hint: "Depuis l’activation du partenariat" },
  { label: "Commission acquise", value: "0 €", hint: "Montant HT annuel encaissé" },
  { label: "Prochain versement", value: "—", hint: "Aucun versement en attente" },
];

// Titres : 36/40 Medium sur mobile, 48/54 SemiBold sur desktop (styles Figma).
const HEADING = "text-[36px] font-medium leading-10 tracking-[-1.08px] lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]";
const TEXT = "text-[16px] leading-6 lg:text-[18px] lg:leading-7";
const ANCHOR = "scroll-mt-[72px] lg:scroll-mt-[104px]";
const INLINE_LINK = "font-medium text-v3-navy underline underline-offset-4 hover:text-v3-brand";

const { discountPercent, clubCommissionRate } = CLUB_OFFER_REFERENCE;

export function EspaceClub() {
  const { user, loading } = useAuth();
  const { hash } = useLocation();
  const [kitOpen, setKitOpen] = useState(false);
  const kitTitleId = useDialogTitleId("kit-partenaire");
  const activeTab = TABS.find((tab) => `#${tab.id}` === hash)?.id ?? "vue-d-ensemble";

  if (loading) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center bg-v3-fond" role="status" aria-label="Chargement de l’espace club">
        <div className="size-10 animate-spin rounded-full border-2 border-white/10 border-t-v3-brand" />
      </div>
    );
  }

  // Espace réservé aux comptes connectés.
  if (!user) return <Navigate to="/connexion?redirect=/espace-club" replace />;

  return (
    <>
      <Seo
        title="Espace club — MMA IQ"
        description="Suis les parrainages de ton club partenaire MMA IQ, retrouve ton kit et les conditions de ton partenariat."
        canonicalPath="/espace-club"
      />

      {/* Espace club · Vue d’ensemble */}
      <Section tone="clair" id="vue-d-ensemble" className={`${ANCHOR} py-12 lg:py-[72px]`} innerClassName="flex flex-col items-start gap-6 lg:gap-10">
        <p className="v3-label whitespace-pre-wrap text-v3-ink-muted">{"ESPACE CLUB  /  VUE D’ENSEMBLE"}</p>

        <div className="flex w-full flex-col items-start gap-6 lg:flex-row">
          {/* Support logo club : aucun club rattaché, pictogramme neutre */}
          <div className="flex size-[88px] shrink-0 items-center justify-center rounded-[16px] bg-v3-navy p-2">
            <Users aria-hidden="true" strokeWidth={1.7} className="size-9 text-v3-lavender" />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className={`${HEADING} text-v3-navy`}>Ton club. Ton collectif.</h1>
            <p className={`${TEXT} text-v3-ink-muted`}>Aucun club rattaché · Espace partenaire</p>
          </div>
        </div>

        <nav aria-label="Espace club" className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap">
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              to={`#${tab.id}`}
              aria-current={activeTab === tab.id ? "location" : undefined}
              className={buttonClass(activeTab === tab.id ? "primary" : "light")}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <ul className="grid w-full gap-6 lg:grid-cols-3">
          {INDICATORS.map((indicator) => (
            <li key={indicator.label} className="flex flex-col gap-4 rounded-[16px] bg-white p-8">
              <p className="v3-label text-v3-ink-muted">{indicator.label}</p>
              <p className={`${HEADING} text-v3-navy`}>{indicator.value}</p>
              <p className="v3-small text-v3-ink-muted">{indicator.hint}</p>
            </li>
          ))}
        </ul>

        <p role="status" className={`${TEXT} text-v3-ink-muted lg:max-w-[1100px]`}>
          Aucun club n’est rattaché à ton compte.{" "}
          <Link to="/partenaires" className={INLINE_LINK}>Découvre le programme partenaire</Link> ou{" "}
          <Link to="/contact" className={INLINE_LINK}>contacte l’équipe</Link> pour relier ton club.
        </p>
      </Section>

      {/* Parrainages et ressources */}
      <Section tone="clair" className="py-12 lg:py-[72px]" innerClassName="flex flex-col gap-6 lg:gap-10">
        <div className="grid w-full items-start gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Ressources · Partager */}
          <article id="ressources" className={`${ANCHOR} flex flex-col items-start gap-6 rounded-[16px] bg-v3-accent p-10 text-white`}>
            <p className="v3-label">01 / FAIRE DÉCOUVRIR MMA IQ</p>
            <h2 className={HEADING}>Un lien.<br />Tout ton club.</h2>
            <p className={TEXT}>
              Retrouve le lien et le QR code de ta salle dans ton kit partenaire. Ils rattachent les souscriptions à ton club.
            </p>
            <button type="button" onClick={() => setKitOpen(true)} aria-haspopup="dialog" className={buttonClass()}>
              Ouvrir mon kit partenaire
            </button>
            <p className="v3-small">
              Besoin de ton lien ? <Link to="/contact" className="underline-offset-4 hover:underline">Contacte l’équipe partenaire.</Link>
            </p>
          </article>

          {/* Mon contrat */}
          <article id="mon-contrat" className={`${ANCHOR} flex flex-col items-start gap-6 rounded-[16px] bg-white p-10`}>
            <p className="v3-label text-v3-ink-muted">02 / LES CONDITIONS DE RÉFÉRENCE</p>
            <h2 className={`${HEADING} text-v3-navy`}>Le cadre<br />du partenariat.</h2>
            <div className={`${TEXT} flex flex-col gap-6 text-v3-ink-muted lg:gap-7`}>
              <p>Membres : −{discountPercent} % sur Performance et Elite, en abonnement mensuel.</p>
              <p>Club : {Math.round(clubCommissionRate * 100)} % du montant HT encaissé sur chaque abonnement vendu via ton lien.</p>
              <p>La durée de la remise, les renouvellements et les versements suivent ton contrat partenaire.</p>
            </div>
            <ButtonLink to="/contact">Contacter mon interlocuteur</ButtonLink>
          </article>
        </div>

        {/* Parrainages · Activité */}
        <article id="parrainages" className={`${ANCHOR} flex w-full flex-col gap-6 rounded-[16px] bg-white p-10 lg:bg-v3-clair`}>
          <h2 className="v3-subheading text-v3-navy">Activité des parrainages</h2>
          <p className={`${TEXT} text-v3-ink-muted`}>Ton historique commence avec ta première souscription attribuée.</p>
          <p className="v3-label text-v3-ink-muted">
            <span className="lg:hidden">Date · Offre annuelle · Montant HT<br />Commission · Statut</span>
            <span className="hidden lg:flex lg:flex-wrap lg:gap-x-[18px]">
              <span>Date de souscription</span>
              <span>Offre annuelle</span>
              <span>Montant HT</span>
              <span>Commission</span>
              <span>Statut</span>
            </span>
          </p>
        </article>
      </Section>

      {/* Club · Kit partenaire */}
      <Dialog open={kitOpen} onClose={() => setKitOpen(false)} labelledBy={kitTitleId} panelClassName="max-w-[560px] rounded-[16px] bg-v3-paper lg:bg-v3-clair">
        <div className="flex flex-col items-start gap-6 p-6 lg:p-10">
          <h2 id={kitTitleId} className="text-[32px] font-medium leading-9 tracking-[-0.96px] text-v3-navy lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]">Les ressources<br />de ton club.</h2>
          <p className="v3-body text-v3-ink-muted">
            Ton kit regroupe le lien de parrainage, le QR code de ta salle et les visuels à partager. Contacte ton interlocuteur pour retrouver ton kit personnalisé.
          </p>
          <ButtonLink to="/contact" onClick={() => setKitOpen(false)}>Demander mon kit</ButtonLink>
          <button type="button" onClick={() => setKitOpen(false)} className="v3-label -my-3 min-h-11 text-left text-v3-ink-muted hover:text-v3-navy">
            Fermer
          </button>
        </div>
      </Dialog>
    </>
  );
}
