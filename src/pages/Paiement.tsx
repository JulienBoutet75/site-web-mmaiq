import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, ChevronDown, LoaderCircle, LockKeyhole, UserRound } from "lucide-react";
import { Seo } from "../components/Seo";
import { useMmaIqAccount } from "../context/MmaIqAccountContext";
import { ACTIVE_PRICING, PLAN_DETAILS, formatEuroCents, isClubDiscountEligible } from "../config/subscriptionCommercial";
import { getReferral, normalizeRefCode } from "../lib/referral";
import type { SubscriptionCheckoutInput } from "../services/stripeService";
import { Button, buttonClass, cx } from "../v3/ui";

const CHECKOUT_ENABLED = import.meta.env.VITE_ENABLE_CHECKOUT === "true";
const LOGIN_ATTEMPT_KEY = "mmaiq_checkout_login_attempt";
type PaidPlanKey = SubscriptionCheckoutInput["planKey"];
type Interval = SubscriptionCheckoutInput["interval"];
const PAID_PLANS: PaidPlanKey[] = ["essentiel", "performance", "elite", "coach_suite"];
const isPaidPlan = (value: string | undefined): value is PaidPlanKey => PAID_PLANS.includes(value as PaidPlanKey);

export function Paiement() {
  const { plan } = useParams();
  if (!isPaidPlan(plan)) return <Navigate to="/tarifs" replace />;
  return <Checkout key={plan} planKey={plan} />;
}

function Checkout({ planKey }: { planKey: PaidPlanKey }) {
  const plan = PLAN_DETAILS[planKey];
  const [searchParams] = useSearchParams();
  const {
    authenticated, loading, profile, login, loginError, loginPending,
    beginSubscriptionCheckout, beginSubscriptionManagement,
    checkoutPending, checkoutError, checkoutErrorCode, clearCheckoutError,
  } = useMmaIqAccount();
  const loginStarted = useRef(false);
  const [loginInterrupted, setLoginInterrupted] = useState(false);
  const loginDestination = `${window.location.pathname}${window.location.search}`;
  const [gymCode, setGymCode] = useState(
    () => {
      const explicitCode = searchParams.get("salle") ?? searchParams.get("code") ?? searchParams.get("ref");
      return explicitCode !== null ? normalizeRefCode(explicitCode) ?? "" : getReferral()?.code ?? "";
    },
  );
  const [codeExpanded, setCodeExpanded] = useState(!!gymCode);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [chosenInterval, setChosenInterval] = useState<Interval>(() => searchParams.get("interval") === "yearly" ? "yearly" : "monthly");
  const [immediateStart, setImmediateStart] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const codeId = useId();
  const consentId = useId();

  // La page de paiement est réservée au compte MMA IQ : SSO si possible,
  // sinon connexion, puis retour à cette URL avec la formule déjà choisie.
  // Une seule tentative automatique ; une erreur demande une relance explicite.
  useEffect(() => {
    if (authenticated) {
      try { sessionStorage.removeItem(LOGIN_ATTEMPT_KEY); } catch { /* Stockage facultatif. */ }
      return;
    }
    if (!CHECKOUT_ENABLED || loading || authenticated || loginError || loginPending || loginStarted.current) return;
    loginStarted.current = true;
    // Un retour navigateur depuis la connexion doit permettre de rester ici.
    try {
      if (sessionStorage.getItem(LOGIN_ATTEMPT_KEY) === loginDestination) {
        setLoginInterrupted(true);
        return;
      }
      sessionStorage.setItem(LOGIN_ATTEMPT_KEY, loginDestination);
    } catch { /* La connexion reste disponible sans stockage navigateur. */ }
    login().catch(() => {});
  }, [authenticated, loading, login, loginError, loginPending, loginDestination]);

  const trimmedCode = gymCode.trim();
  const mayHaveClubDiscount = !!trimmedCode && isClubDiscountEligible(planKey);
  // Le serveur vérifie la remise réelle : un code d'attribution sans remise
  // ne doit jamais transformer une commande annuelle en mensuelle.
  const interval = chosenInterval;
  const prices = ACTIVE_PRICING.prices[planKey];
  const amount = formatEuroCents(interval === "monthly" ? prices.monthlyCents : prices.yearlyCents);
  const period = interval === "monthly" ? "mois" : "an";
  const changeParams = new URLSearchParams({ interval });
  changeParams.set("salle", trimmedCode);
  const changePlanPath = `/tarifs?${changeParams}`;
  const needsLogin = CHECKOUT_ENABLED && (loading || !authenticated);
  const busy = checkoutPending || loginPending;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!CHECKOUT_ENABLED || busy || !authenticated) return;
    const code = trimmedCode ? normalizeRefCode(trimmedCode) : null;
    if (trimmedCode && !code) {
      setCodeExpanded(true);
      setCodeError("Ce code doit contenir 3 à 14 lettres ou chiffres.");
      document.getElementById(codeId)?.focus();
      return;
    }
    setCodeError(null);
    if (!immediateStart) {
      setConsentError(true);
      document.getElementById(consentId)?.focus();
      return;
    }
    beginSubscriptionCheckout({ planKey, interval, gymCode: code, immediateStartConsent: true }).catch(() => {});
  };

  return (
    <>
      <Seo
        title={`Paiement ${plan.name} — MMA IQ`}
        description={`Abonnement MMA IQ ${plan.name} : ${amount} / ${period}.`}
        canonicalPath={`/paiement/${planKey}`}
      />
      <div className="mx-auto w-full max-w-[560px] px-4 py-6 sm:px-6 sm:py-10">
        <ol aria-label="Étapes de l’achat" className="mb-5 flex items-center justify-center gap-3 text-[13px] font-medium text-v3-ink-muted">
          <li aria-current={needsLogin ? "step" : undefined} className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-v3-brand text-white">
              {authenticated ? <Check className="size-3.5" aria-hidden="true" /> : "1"}
            </span>
            Compte
          </li>
          <li aria-current={!needsLogin ? "step" : undefined} className={cx("flex items-center gap-2", !needsLogin && "text-v3-navy")}>
            <span aria-hidden="true" className="mr-1 h-px w-10 bg-v3-border" />
            <span className={cx("flex size-6 items-center justify-center rounded-full", needsLogin ? "bg-white" : "bg-v3-brand text-white")}>2</span>
            Paiement
          </li>
        </ol>

        {needsLogin ? (
          <section aria-labelledby="connexion-abonnement" className="rounded-[20px] border border-v3-border bg-white p-6 text-center sm:p-8">
            <h1 id="connexion-abonnement" className="text-[26px] font-semibold leading-8">Connexion MMA IQ</h1>
            <p className="mt-2 text-[14px] text-v3-ink-muted">{plan.name} · {amount} / {period}</p>
            {(loginError || loginInterrupted) && !loginPending ? (
              <>
                <p role={loginError ? "alert" : undefined} className={cx("my-5 text-[14px]", loginError ? "text-[#b42318]" : "text-v3-ink-muted")}>{loginError || "Connecte-toi pour retrouver cette formule au paiement."}</p>
                <Button block onClick={() => { setLoginInterrupted(false); login().catch(() => {}); }}>{loginError ? "Réessayer la connexion" : "Me connecter"}</Button>
              </>
            ) : (
              <p role="status" className="my-6 flex items-center justify-center gap-2 text-[14px] text-v3-ink-muted">
                <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                {loading ? "Vérification de ta connexion…" : "Ouverture de la connexion…"}
              </p>
            )}
            <Link to={changePlanPath} className="mt-4 inline-flex min-h-11 items-center text-[14px] text-v3-ink-muted underline underline-offset-4">Retour aux formules</Link>
          </section>
        ) : (
          <>
            <h1 className="mb-5 text-center text-[28px] font-semibold leading-9 tracking-[-0.5px]">Finaliser mon abonnement</h1>
            <form onSubmit={handleSubmit} noValidate aria-label={`Paiement de la formule ${plan.name}`} className="flex flex-col gap-5 rounded-[20px] border border-v3-border bg-white p-5 sm:p-7">
              {authenticated && (
                <div className="flex items-center gap-2 border-b border-v3-border pb-4 text-[13px] text-v3-ink-muted">
                  <UserRound className="size-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 break-all">{profile?.email || "Compte MMA IQ connecté"}</span>
                  <Check className="ml-auto size-4 shrink-0 text-v3-brand" aria-label="Connecté" />
                </div>
              )}

              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[24px] font-semibold leading-8">{plan.name}</h2>
                    <p className="mt-1 text-[13px] text-v3-ink-muted">{plan.creditsPerMonth} crédits IA / mois</p>
                  </div>
                  <Link to={changePlanPath} className="-my-2 inline-flex min-h-11 items-center text-[13px] font-medium text-v3-brand underline underline-offset-4">Modifier</Link>
                </div>
                <p className="mt-3 text-[32px] font-semibold leading-10 tracking-[-0.5px]">
                  {amount}<span className="text-[15px] font-normal tracking-normal text-v3-ink-muted"> / {period}</span>
                </p>
                {mayHaveClubDiscount && <p className="text-[12px] text-v3-ink-muted">Remise club éventuelle confirmée au paiement.</p>}
              </div>

              <div role="group" aria-label="Périodicité de l’abonnement" className="flex rounded-[12px] bg-v3-clair p-1">
                {(["monthly", "yearly"] as const).map((value) => (
                  <button key={value} type="button" aria-pressed={interval === value} disabled={busy} onClick={() => { setChosenInterval(value); clearCheckoutError(); }}
                    className={cx("min-h-10 flex-1 rounded-[9px] px-2 text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-v3-brand disabled:cursor-not-allowed disabled:opacity-50", interval === value ? "bg-white text-v3-navy shadow-sm" : "text-v3-ink-muted hover:text-v3-navy")}>
                    {value === "monthly" ? "Mensuel" : "Annuel"}
                  </button>
                ))}
              </div>

              <div>
                <button type="button" aria-expanded={codeExpanded} aria-controls={`${codeId}-panel`} onClick={() => setCodeExpanded(!codeExpanded)} className="-my-2 flex min-h-11 w-full items-center justify-between gap-2 text-left text-[14px] text-v3-ink-muted">
                  <span>{trimmedCode ? `Code club : ${trimmedCode}` : "Ajouter un code club"}</span>
                  <ChevronDown aria-hidden="true" className={cx("size-4 shrink-0 transition-transform", codeExpanded && "rotate-180")} />
                </button>
                <div id={`${codeId}-panel`} hidden={!codeExpanded} className="pt-3">
                  <label htmlFor={codeId} className="sr-only">Code club (facultatif)</label>
                  <input id={codeId} value={gymCode} disabled={busy} onChange={(event) => { setGymCode(event.target.value.toUpperCase()); setCodeError(null); }}
                    maxLength={14} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="Ton code club"
                    aria-invalid={!!codeError || undefined} aria-describedby={codeError || mayHaveClubDiscount ? `${codeId}-help` : undefined}
                    className="v3-input uppercase placeholder:normal-case" />
                  {codeError ? <p id={`${codeId}-help`} role="alert" className="mt-2 text-[13px] text-[#b42318]">{codeError}</p>
                    : mayHaveClubDiscount ? <p id={`${codeId}-help`} className="mt-2 text-[13px] text-v3-ink-muted">Si ton club propose une remise, choisis le mensuel pour en bénéficier.</p> : null}
                </div>
              </div>

              <div>
                <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-[19px] text-v3-ink-muted">
                  <input id={consentId} type="checkbox" checked={immediateStart} disabled={busy} onChange={(event) => { setImmediateStart(event.target.checked); setConsentError(false); }}
                    aria-invalid={consentError || undefined} aria-describedby={consentError ? `${consentId}-error` : undefined} className="mt-0.5 size-5 shrink-0 accent-v3-brand" />
                  <span>
                    Je demande que mon abonnement démarre dès le paiement, avant la fin du délai de rétractation de 14 jours.
                    Si je me rétracte, un montant proportionnel au service déjà fourni pourra m’être demandé
                    (<Link to="/cgv#retractation" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">article 6 des CGV</Link>).
                  </span>
                </label>
                {consentError && <p id={`${consentId}-error`} role="alert" className="mt-2 text-[13px] text-[#b42318]">Coche cette case pour démarrer ton abonnement aujourd’hui.</p>}
              </div>

              {checkoutError && checkoutErrorCode === "already_subscribed" ? (
                <div role="alert" className="flex flex-col items-start gap-3 rounded-[12px] bg-v3-clair p-4">
                  <p className="text-[14px]">{checkoutError}</p>
                  <Button compact disabled={busy} onClick={() => beginSubscriptionManagement({ flow: "update", planKey, interval }).catch(() => {})}>Passer à {plan.name}</Button>
                  <Link to="/mon-abonnement" className={buttonClass("outline-dark", { compact: true })}>Mon abonnement</Link>
                </div>
              ) : checkoutError ? (
                <div role="alert" className="text-[14px] text-[#b42318]">
                  <p>{checkoutError}</p>
                  {checkoutErrorCode === "club_monthly_only" && <button type="button" onClick={() => { setChosenInterval("monthly"); clearCheckoutError(); }} className="mt-2 min-h-11 font-medium text-v3-brand underline underline-offset-4">Choisir le mensuel</button>}
                </div>
              ) : null}
              <div>
                <Button type="submit" block disabled={!CHECKOUT_ENABLED || busy} aria-busy={busy || undefined}>
                  {busy ? <><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Ouverture du paiement…</> : <>Passer au paiement <ArrowRight className="size-4" aria-hidden="true" /></>}
                </Button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-v3-ink-muted"><LockKeyhole className="size-3.5" aria-hidden="true" /> Paiement sécurisé par Stripe</p>
              </div>
              {!CHECKOUT_ENABLED && <p role="status" className="text-[14px] text-v3-ink-muted">Le paiement en ligne n’est pas encore ouvert. Tu peux t’abonner depuis l’application MMA IQ.</p>}
            </form>
            <p className="mt-4 text-center text-[12px] leading-[18px] text-v3-ink-muted">
              Renouvellement {interval === "monthly" ? "mensuel" : "annuel"}. Résiliable à tout moment, effet en fin de période.
              {" "}En poursuivant, tu acceptes les <Link to="/cgv" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">conditions générales</Link>.
            </p>
          </>
        )}
      </div>
    </>
  );
}
