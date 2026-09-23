import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Seo } from "../components/Seo";
import { useMmaIqAccount } from "../context/MmaIqAccountContext";
import { ACTIVE_PRICING, formatEuroCents, normalizePlanKey, type SubscriptionPlanKey } from "../config/subscriptionCommercial";
import { saveReferral } from "../lib/referral";
import { ArrowLink, ButtonLink, Section, cx } from "../v3/ui";

// Figma « Tarifs · Desktop · Vue complète » (2110:22226) et « Mobile » (2174:21124).

type PaidPlanKey = Exclude<SubscriptionPlanKey, "coach_suite">;

type Plan = {
  name: string;
  /** Formule payante : prix lus dans la grille active (subscriptionCommercial.ts). */
  key?: PaidPlanKey;
  credits: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

// Droits identiques au paywall de l’application (composants Figma « MMA IQ / Tarif / … »).
const PLANS: Plan[] = [
  { name: "Free", credits: "5 crédits IA / mois", features: ["1 plan d’entraînement", "1 plan nutrition", "1 tutoriel technique"], cta: "Découvrir l’app" },
  { name: "Essentiel", key: "essentiel", credits: "30 crédits IA / mois", features: ["Entraînement & nutrition illimités", "5 tutoriels techniques", "Suivi de performance"], cta: "Choisir Essentiel" },
  { name: "Performance", key: "performance", credits: "80 crédits IA / mois", features: ["Plans & tutoriels illimités", "Gameplans et lien coach", "Suivi de performance"], cta: "Choisir Performance", highlighted: true },
  { name: "Elite", key: "elite", credits: "200 crédits IA / mois", features: ["Tous les outils Performance", "Mise en relation", "Support prioritaire"], cta: "Choisir Elite" },
];

// Paramètres transmis à la page de paiement (code salle, lien partenaire, périodicité).
const FORWARDED_PARAMS = ["salle", "ref", "code", "interval"];

const monthly = (key: SubscriptionPlanKey) => formatEuroCents(ACTIVE_PRICING.prices[key].monthlyCents);
const yearly = (key: SubscriptionPlanKey) => formatEuroCents(ACTIVE_PRICING.prices[key].yearlyCents);

export function Pricing() {
  const [searchParams] = useSearchParams();
  const { checkoutError } = useMmaIqAccount();
  const navigate = useNavigate();
  const managing = searchParams.get("manage") === "1";
  // Liens de l'app : ?plan=essential|performance|elite|coach_suite&interval=…&source=app.
  const requestedPlan = normalizePlanKey(searchParams.get("plan"));

  // « Gérer mon abonnement » (/tarifs?manage=1, depuis l'app) et formule
  // présélectionnée : on ouvre directement la bonne page.
  useEffect(() => {
    if (managing) {
      navigate("/mon-abonnement", { replace: true });
      return;
    }
    if (!requestedPlan) return;
    const next = new URLSearchParams();
    ["interval", "salle", "ref", "code", "source"].forEach((name) => {
      const value = searchParams.get(name);
      if (value) next.set(name, value);
    });
    const query = next.toString();
    navigate(`/paiement/${requestedPlan}${query ? `?${query}` : ""}`, { replace: true });
  }, [managing, navigate, requestedPlan, searchParams]);

  // Code salle reçu en lien (?salle= / ?code=) : mémorisé comme ?ref= pour pré-remplir le paiement.
  const clubCode = searchParams.get("salle") ?? searchParams.get("code");
  useEffect(() => {
    if (clubCode) saveReferral(clubCode);
  }, [clubCode]);

  const forwarded = new URLSearchParams();
  FORWARDED_PARAMS.forEach((name) => {
    const value = searchParams.get(name);
    if (value) forwarded.set(name, value);
  });
  const query = forwarded.toString();
  const checkoutPath = (key: PaidPlanKey) => `/paiement/${key}${query ? `?${query}` : ""}`;

  return (
    <>
      <Seo
        title="Tarifs MMA IQ — Les formules de l’application"
        description={`Free, Essentiel, Performance, Elite et Coach Suite : compare les outils inclus dans chaque formule MMA IQ. Dès ${monthly("essentiel")} / mois, sur iOS et Android.`}
        canonicalPath="/tarifs"
      />

      {/* Introduction */}
      <Section tone="fond" as="header" className="py-6 lg:py-8" innerClassName="flex flex-col gap-2 lg:gap-4">
        <p className="v3-label text-v3-lavender">LES FORMULES MMA IQ</p>
        <h1 className="text-[32px] font-semibold leading-[38px] text-white lg:text-[40px] lg:leading-[46px]">Les outils adaptés<br />à ta pratique.</h1>
        <p className="v3-small text-v3-muted lg:max-w-[720px] lg:text-[18px] lg:leading-7">
          Compare les outils inclus dans chaque formule et choisis selon ta pratique.
        </p>
      </Section>

      {/* Choisir sa formule */}
      <Section tone="clair" className="py-8 lg:py-12" innerClassName="flex flex-col gap-6">
        <div className="v3-label text-v3-ink-muted">
          <h2>Abonnements mensuels</h2>
          <p>Le montant annuel total figure sous chaque tarif.</p>
          {checkoutError && <p role="alert" className="mt-2 text-[#c0392b]">{checkoutError}</p>}
        </div>
        <ul className="grid gap-4 md:grid-cols-2 xl:max-w-[1264px] xl:grid-cols-4">
          {PLANS.map((plan) => (
            <li key={plan.name} className={cx("flex flex-col gap-4 rounded-[16px] p-6 text-v3-navy", plan.highlighted ? "bg-v3-lavender" : "bg-white")}>
              <div className="flex flex-col gap-2">
                <h3 className="v3-subheading">{plan.name}</h3>
                <p className="text-[40px] font-semibold leading-[46px]">{plan.key ? monthly(plan.key) : "0 €"}</p>
                <p className="v3-small text-v3-ink-muted">{plan.key ? `/ mois · ou ${yearly(plan.key)} / an` : "Gratuit"}</p>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <p className="v3-body">{plan.credits}</p>
                <ul className="v3-small text-v3-ink-muted">
                  {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
              </div>
              <ButtonLink to={plan.key ? checkoutPath(plan.key) : "/application"} block>
                {plan.cta}
              </ButtonLink>
            </li>
          ))}
        </ul>
      </Section>

      {/* Coach Suite */}
      <Section tone="clair" className="py-12 lg:py-[72px]" innerClassName="flex flex-col items-start gap-6 lg:gap-10">
        <h2 className="text-[36px] font-medium leading-10 tracking-[-1.08px] lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]">
          Coach Suite.<br />Le suivi de tes athlètes.
        </h2>
        <p className="v3-subheading">{monthly("coach_suite")} / mois · ou {yearly("coach_suite")} / an</p>
        <p className="v3-body text-v3-ink-muted lg:max-w-[760px]">
          150 crédits IA par mois. Un tableau de bord pour suivre tes athlètes, préparer leurs programmes et garder le lien avec ta team.
        </p>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <ButtonLink to="/coach">Découvrir Coach Suite</ButtonLink>
          <ArrowLink to="/paiement/coach_suite" tone="dark">S’abonner à Coach Suite</ArrowLink>
        </div>
      </Section>

      {/* Questions sur les formules */}
      <Section tone="clair" className="py-12 lg:py-[72px]" innerClassName="flex flex-col items-start gap-6 lg:gap-10">
        <h2 className="text-[36px] font-medium leading-10 tracking-[-1.08px] lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]">
          Ce qui est inclus.<br />Ce qui est séparé.
        </h2>
        <p className="v3-body text-v3-ink-muted lg:max-w-[800px]">
          Tu gardes le contrôle. Ton abonnement est annulable à tout moment, avec effet à la fin de la période payée.
        </p>
        <p className="v3-body text-v3-ink-muted lg:max-w-[800px]">
          Les tutoriels techniques sont inclus selon ta formule. Les formations approfondies Academy sont proposées séparément.
        </p>
        <ButtonLink to="/aide">Toutes les réponses</ButtonLink>
      </Section>
    </>
  );
}
