import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { LockKeyhole, UserRound } from "lucide-react";
import { Seo } from "../components/Seo";
import { useMmaIqAccount } from "../context/MmaIqAccountContext";
import { ACTIVE_PRICING, formatEuroCents, isClubDiscountEligible } from "../config/subscriptionCommercial";
import { getReferral, normalizeRefCode } from "../lib/referral";
import type { SubscriptionCheckoutInput } from "../services/stripeService";
import { Button, Section, buttonClass, cx } from "../v3/ui";

// Figma « 08 · Paiement par formule » : Essentiel (2110:24836 / 2174:22351),
// Performance (2110:25019 / 2174:22439), Elite (2110:25202 / 2174:22527).
// Coach Suite reprend la même page (pas de maquette dédiée).
// La carte bancaire n’est jamais saisie ici : « Payer » ouvre Stripe Checkout
// (page hébergée), après connexion au compte MMA IQ si nécessaire.

const CHECKOUT_ENABLED = import.meta.env.VITE_ENABLE_CHECKOUT === "true";

type PaidPlanKey = "essentiel" | "performance" | "elite" | "coach_suite";
type Interval = SubscriptionCheckoutInput["interval"];

const PLANS: Record<PaidPlanKey, { name: string; details: string }> = {
  essentiel: {
    name: "Essentiel",
    details: "30 crédits IA par mois. Entraînement et nutrition illimités, 5 tutoriels techniques et suivi de performance.",
  },
  performance: {
    name: "Performance",
    details: "80 crédits IA par mois. Plans d’entraînement et tutoriels illimités, gameplans, suivi de performance et connexion avec ton coach.",
  },
  elite: {
    name: "Elite",
    details: "200 crédits IA par mois. Tous les outils Performance, mise en relation et support prioritaire.",
  },
  coach_suite: {
    name: "Coach Suite",
    details: "150 crédits IA par mois. Un tableau de bord pour suivre tes athlètes, préparer leurs programmes et garder le lien avec ta team.",
  },
};

const isPaidPlan = (value: string | undefined): value is PaidPlanKey => !!value && value in PLANS;

export function Paiement() {
  const { plan } = useParams();
  if (!isPaidPlan(plan)) return <Navigate to="/tarifs" replace />;
  return <Checkout planKey={plan} />;
}

function Checkout({ planKey }: { planKey: PaidPlanKey }) {
  const plan = PLANS[planKey];
  const [searchParams] = useSearchParams();
  const { authenticated, profile, login, beginSubscriptionCheckout, beginSubscriptionManagement, checkoutPending, checkoutError, checkoutErrorCode } = useMmaIqAccount();
  // Code club pré-rempli : ?salle= / ?code= / ?ref= (page Tarifs ou lien direct), sinon
  // l’attribution partenaire enregistrée (lien ?ref= ou page de salle).
  const [gymCode, setGymCode] = useState(
    () => normalizeRefCode(searchParams.get("salle") ?? searchParams.get("code") ?? searchParams.get("ref")) ?? getReferral()?.code ?? "",
  );
  const [codeError, setCodeError] = useState<string | null>(null);
  const [chosenInterval, setChosenInterval] = useState<Interval>(() => (searchParams.get("interval") === "yearly" ? "yearly" : "monthly"));
  // Demande expresse de démarrage avant la fin du délai de rétractation (CGV, article 6).
  const [immediateStart, setImmediateStart] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const ids = { email: useId(), name: useId(), code: useId(), codeHelp: useId(), card: useId(), consent: useId() };

  // La remise club (en mois) ne s’applique qu’au mensuel Performance / Elite :
  // le serveur refuse l’annuel dans ce cas, on l’indique dès cette page.
  const trimmedCode = gymCode.trim();
  const clubForcesMonthly = !!trimmedCode && isClubDiscountEligible(planKey);
  const interval: Interval = clubForcesMonthly ? "monthly" : chosenInterval;
  const prices = ACTIVE_PRICING.prices[planKey];
  const amount = formatEuroCents(interval === "monthly" ? prices.monthlyCents : prices.yearlyCents);
  const period = interval === "monthly" ? "mois" : "an";

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ");
  // On ne bloque pas le bouton pendant l’initialisation du compte : si la
  // session n’est pas encore connue, beginSubscriptionCheckout passe par la
  // connexion MMA IQ puis reprend le paiement au retour.
  const busy = checkoutPending;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!CHECKOUT_ENABLED || busy) return;
    const code = trimmedCode ? normalizeRefCode(trimmedCode) : null;
    if (trimmedCode && !code) {
      setCodeError("Ce code club n’est pas valide : 3 à 14 lettres ou chiffres.");
      return;
    }
    setCodeError(null);
    if (!immediateStart) {
      setConsentError(true);
      document.getElementById(ids.consent)?.focus();
      return;
    }
    // Connexion au compte MMA IQ si besoin, puis redirection vers Stripe Checkout.
    beginSubscriptionCheckout({ planKey, interval, gymCode: code, immediateStartConsent: true }).catch(() => {});
  };

  return (
    <>
      <Seo
        title={`Paiement ${plan.name} — MMA IQ`}
        description={`Finalise ton abonnement MMA IQ ${plan.name} : ${amount} / ${period}, paiement sécurisé par Stripe.`}
        canonicalPath={`/paiement/${planKey}`}
      />

      {/* Introduction */}
      <Section tone="fond" className="py-6 lg:py-8" innerClassName="flex flex-col gap-2 lg:gap-4">
        <p className="v3-label text-v3-lavender">TON ABONNEMENT</p>
        <h1 className="text-[32px] font-semibold leading-[38px] text-white lg:text-[40px] lg:leading-[46px]">Finalise ton abonnement.</h1>
        <p className="text-[14px] leading-5 text-v3-muted lg:max-w-[720px] lg:text-[18px] lg:leading-7">
          Retrouve tes outils dans l’application, sur iOS et Android.
        </p>
      </Section>

      {/* Finaliser la commande — récapitulatif en tête sur mobile, à droite sur desktop */}
      <Section tone="clair" className="lg:py-6" innerClassName="flex flex-col lg:flex-row lg:items-start lg:gap-12 xl:gap-20">
        <aside
          aria-labelledby="recapitulatif-formule"
          className="-mx-6 flex flex-col items-start gap-2 bg-v3-clair px-6 py-4 md:-mx-10 md:px-10 lg:order-2 lg:mx-0 lg:w-[360px] lg:shrink-0 lg:gap-4 lg:rounded-[16px] lg:bg-v3-accent lg:px-8 lg:py-6 xl:w-[480px]"
        >
          <h2 id="recapitulatif-formule" className="text-[32px] font-semibold leading-[38px] text-v3-navy lg:text-[40px] lg:leading-[46px] lg:text-white">
            {plan.name}
          </h2>
          <p className="v3-body text-v3-navy lg:text-white">{amount} / {period}</p>
          {/* Périodicité : les deux montants figurent sur la page Tarifs */}
          <div role="group" aria-label="Périodicité de l’abonnement" className="flex rounded-[12px] border border-v3-border bg-white p-1 lg:border-white/25 lg:bg-white/10">
            {(["monthly", "yearly"] as const).map((value) => {
              const active = interval === value;
              const disabled = value === "yearly" && clubForcesMonthly;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  disabled={disabled}
                  onClick={() => setChosenInterval(value)}
                  className={cx(
                    "min-h-10 rounded-[9px] px-4 text-[14px] font-semibold leading-5 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    active ? "bg-v3-brand text-white lg:bg-white lg:text-v3-navy" : "text-v3-navy hover:bg-v3-clair lg:text-white lg:hover:bg-white/10",
                  )}
                >
                  {value === "monthly" ? "Mensuel" : `Annuel · ${formatEuroCents(prices.yearlyCents)}`}
                </button>
              );
            })}
          </div>
          <p className="v3-small text-v3-ink-muted lg:text-white">{plan.details}</p>
          <Link
            to="/tarifs"
            className="inline-flex min-h-12 items-center rounded-[12px] p-3 text-[16px] font-semibold leading-6 text-v3-brand transition-colors hover:bg-v3-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-v3-brand lg:focus-visible:outline-v3-lavender"
          >
            Modifier ma formule
          </Link>
        </aside>

        <form
          onSubmit={handleSubmit}
          noValidate
          aria-label={`Paiement de la formule ${plan.name}`}
          className="-mx-6 flex flex-col gap-4 bg-v3-clair px-6 py-6 md:-mx-10 md:px-10 lg:order-1 lg:mx-0 lg:max-w-[720px] lg:flex-1 lg:px-0 lg:py-0"
        >
          <h2 className="text-[32px] font-semibold leading-[38px] text-v3-navy lg:text-[40px] lg:leading-[46px]">1. Ton compte</h2>
          <p className="v3-small text-v3-ink-muted">Utilise l’adresse e-mail de ton compte MMA IQ.</p>

          <div className="flex w-full flex-col gap-4 lg:max-w-[640px]">
            {authenticated ? (
              <>
                {/* Compte connecté : informations du profil MMA IQ, non modifiables ici */}
                <div>
                  <label htmlFor={ids.email} className="v3-field-label">Adresse e-mail MMA IQ</label>
                  <input id={ids.email} type="email" readOnly value={profile?.email ?? ""} className="v3-input" />
                </div>
                {fullName && (
                  <div>
                    <label htmlFor={ids.name} className="v3-field-label">Nom complet</label>
                    <input id={ids.name} type="text" readOnly value={fullName} className="v3-input" />
                  </div>
                )}
              </>
            ) : (
              // Pas encore connecté : aucune donnée saisie ici, la connexion se fait au paiement.
              <div>
                <p id={ids.email} className="v3-field-label">Compte MMA IQ</p>
                <InfoBox
                  labelledBy={ids.email}
                  icon={<UserRound strokeWidth={1.7} className="size-5" />}
                  title="Connexion au moment de payer"
                  text="Tu te connectes à ton compte MMA IQ juste avant le paiement : ton abonnement y est rattaché."
                >
                  <Button variant="outline-dark" compact className="mt-3 self-start" onClick={() => login().catch(() => {})}>
                    Me connecter maintenant
                  </Button>
                </InfoBox>
              </div>
            )}

            <h2 className="v3-subheading text-v3-navy">2. Paiement</h2>

            <div>
              <label htmlFor={ids.code} className="v3-field-label">Code club (facultatif)</label>
              <input
                id={ids.code}
                value={gymCode}
                onChange={(event) => {
                  setGymCode(event.target.value.toUpperCase());
                  setCodeError(null);
                }}
                maxLength={14}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="Saisis ton code"
                aria-invalid={codeError ? true : undefined}
                aria-describedby={codeError || trimmedCode ? ids.codeHelp : undefined}
                className="v3-input uppercase placeholder:normal-case"
              />
              {codeError ? (
                <p id={ids.codeHelp} role="alert" className="v3-small mt-2 text-[#c0392b]">{codeError}</p>
              ) : clubForcesMonthly ? (
                <p id={ids.codeHelp} className="v3-small mt-2 text-v3-ink-muted">
                  La remise club s’applique à l’abonnement mensuel : si ton club en propose une, elle s’affiche sur la page de paiement sécurisée, avant validation.
                </p>
              ) : null}
            </div>

            {/* À la place des champs carte de la maquette : la carte se saisit chez Stripe */}
            <div>
              <p id={ids.card} className="v3-field-label">Carte bancaire</p>
              <InfoBox
                labelledBy={ids.card}
                className="lg:min-h-[156px] lg:items-center"
                icon={<LockKeyhole strokeWidth={1.7} className="size-5" />}
                title="Saisie sur la page de paiement sécurisée Stripe"
                text="À l’étape suivante, tu saisis ta carte sur Stripe, notre prestataire de paiement. MMA IQ n’a jamais accès à tes données bancaires."
              />
            </div>

            <div>
              <label className="flex cursor-pointer items-start gap-3 rounded-[12px] border border-v3-border bg-white p-4">
                <input
                  id={ids.consent}
                  type="checkbox"
                  checked={immediateStart}
                  onChange={(event) => {
                    setImmediateStart(event.target.checked);
                    setConsentError(false);
                  }}
                  aria-invalid={consentError || undefined}
                  aria-describedby={consentError ? `${ids.consent}-erreur` : undefined}
                  className="mt-0.5 size-5 shrink-0 accent-v3-brand"
                />
                <span className="v3-small text-v3-navy">
                  Je demande que mon abonnement démarre dès le paiement, avant la fin du délai de rétractation de 14 jours.
                  Si je me rétracte, un montant proportionnel au service déjà fourni pourra m’être demandé
                  (<Link to="/cgv#retractation" className="underline underline-offset-2">article 6 des CGV</Link>).
                </span>
              </label>
              {consentError && (
                <p id={`${ids.consent}-erreur`} role="alert" className="v3-small mt-2 text-[#c0392b]">
                  Coche cette case pour démarrer ton abonnement aujourd’hui.
                </p>
              )}
            </div>

            <p className="v3-subheading text-v3-navy">Total aujourd’hui : {amount}</p>
            <p className="v3-small text-v3-ink-muted">
              Abonnement {interval === "monthly" ? "mensuel" : "annuel"}. Annulation possible à tout moment, avec effet à la fin de la période payée. En poursuivant, tu acceptes les{" "}
              <Link to="/cgv" className="underline underline-offset-2 hover:text-v3-navy">conditions générales</Link>.
            </p>

            <Button type="submit" block disabled={!CHECKOUT_ENABLED || busy} aria-busy={checkoutPending || undefined}>
              {checkoutPending ? "Ouverture du paiement sécurisé…" : `Payer ${amount}`}
            </Button>

            {checkoutError && checkoutErrorCode === "already_subscribed" ? (
              // Déjà abonné : le changement de formule passe par Stripe (prorata), pas par un second abonnement.
              <div role="alert" className="flex flex-col items-start gap-3 rounded-[12px] border border-v3-border bg-white p-4">
                <p className="v3-small text-v3-navy">{checkoutError}</p>
                <div className="flex flex-wrap gap-3">
                  <Button compact onClick={() => beginSubscriptionManagement({ flow: "update", planKey, interval }).catch(() => {})}>
                    Passer à {plan.name}
                  </Button>
                  <Link to="/mon-abonnement" className={buttonClass("outline-dark", { compact: true })}>Mon abonnement</Link>
                </div>
              </div>
            ) : checkoutError ? (
              <p role="alert" className="v3-small text-[#c0392b]">{checkoutError}</p>
            ) : null}
            {CHECKOUT_ENABLED ? (
              <p className="v3-small text-v3-ink-muted">Paiement sécurisé · Tes données bancaires restent confidentielles.</p>
            ) : (
              <p role="status" className="v3-small text-v3-ink-muted">
                Le paiement en ligne n’est pas encore ouvert. Tu peux t’abonner depuis l’application MMA IQ.
              </p>
            )}
          </div>
        </form>
      </Section>
    </>
  );
}

/** Bloc d’information au format des champs de la maquette (fond blanc, contour, rayon 12). */
function InfoBox({ icon, title, text, labelledBy, className, children }: { icon: ReactNode; title: string; text: string; labelledBy: string; className?: string; children?: ReactNode }) {
  return (
    <div role="note" aria-labelledby={labelledBy} className={cx("flex items-start gap-4 rounded-[12px] border border-v3-border bg-white p-4", className)}>
      <span aria-hidden="true" className="hidden size-10 shrink-0 items-center justify-center rounded-[10px] bg-v3-clair text-v3-brand sm:flex">{icon}</span>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-[16px] font-semibold leading-6 text-v3-navy">{title}</p>
        <p className="v3-small text-v3-ink-muted">{text}</p>
        {children}
      </div>
    </div>
  );
}
