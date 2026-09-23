import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { Seo } from "../components/Seo";
import { useMmaIqAccount } from "../context/MmaIqAccountContext";
import { ACTIVE_PRICING, formatEuroCents, normalizePlanKey, PLAN_DETAILS, type SubscriptionPlanKey } from "../config/subscriptionCommercial";
import { fetchSubscriptionOverview, type SubscriptionOverview } from "../services/stripeService";
import { Button, ButtonLink, Eyebrow, Section, StoreButtons, cx } from "../v3/ui";

// « Mon abonnement » : abonnement MMA IQ payé sur le site (hors maquette V3,
// composé avec les éléments des pages compte). Changement de formule et
// résiliation passent par les parcours sécurisés du portail Stripe.

type Interval = "monthly" | "yearly";

const LONG_DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const formatDate = (iso?: string | null) => (iso ? LONG_DATE.format(new Date(iso)) : "—");

const STATUS_LABELS: Record<string, { label: string; tone: "ok" | "warn" | "muted" }> = {
  active: { label: "Actif", tone: "ok" },
  trialing: { label: "Actif", tone: "ok" },
  past_due: { label: "Paiement refusé", tone: "warn" },
  unpaid: { label: "Paiement refusé", tone: "warn" },
  incomplete: { label: "Paiement en attente", tone: "muted" },
  paused: { label: "Suspendu", tone: "warn" },
};

const STORE_NAMES: Record<string, string> = { APPLE: "l’App Store", GOOGLE: "Google Play" };

export function MonAbonnement() {
  const { authenticated, loading: accountLoading, profile, login, logout, getAccessToken, beginSubscriptionManagement, checkoutPending, checkoutError } = useMmaIqAccount();
  const [searchParams] = useSearchParams();
  const [overview, setOverview] = useState<SubscriptionOverview | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<Interval>("monthly");

  const load = useCallback(async () => {
    setState("loading");
    setLoadError(null);
    try {
      const data = await fetchSubscriptionOverview(await getAccessToken());
      setOverview(data);
      if (data.web) setBillingInterval(data.web.interval);
      setState("ready");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Ton abonnement ne peut pas être lu pour le moment.");
      setState("error");
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (!accountLoading && authenticated) load();
  }, [accountLoading, authenticated, load]);

  const changedTo = normalizePlanKey(searchParams.get("formule"));
  const cancelled = searchParams.get("resiliation") === "1";
  const web = overview?.web ?? null;
  const email = overview?.email ?? profile?.email ?? null;

  return (
    <>
      <Seo title="Mon abonnement — MMA IQ" description="Ta formule MMA IQ, tes crédits IA, ton prochain prélèvement : change de formule ou résilie en quelques clics." canonicalPath="/mon-abonnement" />

      <Section tone="fond" className="py-10 lg:py-16" innerClassName="flex flex-col gap-4 lg:gap-6">
        <Eyebrow>MON COMPTE MMA IQ</Eyebrow>
        <h1 className="v3-heading-lg text-v3-paper">Mon abonnement.</h1>
        <p className="v3-body max-w-[720px] text-v3-muted">
          Le même compte que dans l’application : ta formule, tes crédits IA et ton prochain prélèvement.
        </p>
      </Section>

      <Section tone="clair" className="py-10 lg:py-16" innerClassName="flex flex-col gap-8">
        {(changedTo || cancelled) && state === "ready" && (
          <div role="status" className="flex items-start gap-3 rounded-[16px] bg-white p-5 text-v3-navy">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-v3-brand" aria-hidden="true" />
            <p className="v3-body">
              {changedTo
                ? `C’est fait : ta formule passe à ${PLAN_DETAILS[changedTo].name}. L’app se met à jour dans quelques instants et un e-mail de confirmation t’est envoyé.`
                : "Ta résiliation est enregistrée. Tu gardes ton accès jusqu’à la fin de la période payée ; un e-mail te le confirme."}
            </p>
          </div>
        )}

        {(accountLoading || state === "loading") && (
          <div role="status" className="flex items-center gap-3 text-v3-ink-muted">
            <span aria-hidden="true" className="size-6 animate-spin rounded-full border-2 border-v3-border border-t-v3-brand" />
            <span className="v3-label">Lecture de ton abonnement…</span>
          </div>
        )}

        {!accountLoading && !authenticated && (
          <Card>
            <h2 className="v3-subheading">Connecte-toi à ton compte MMA IQ.</h2>
            <p className="v3-body text-v3-ink-muted">Utilise l’adresse et le mot de passe de ton compte MMA IQ, les mêmes que dans l’application.</p>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => login()}>Me connecter</Button>
              <ButtonLink to="/tarifs" variant="outline-dark">Voir les formules</ButtonLink>
            </div>
          </Card>
        )}

        {state === "error" && (
          <Card>
            <h2 className="v3-subheading">Lecture impossible.</h2>
            <p className="v3-body text-v3-ink-muted">{loadError}</p>
            <div><Button onClick={load}>Réessayer</Button></div>
          </Card>
        )}

        {state === "ready" && overview && (
          <>
            {!overview.profileExists && <FinishProfile email={overview.email} paid={Boolean(web)} />}

            {web ? (
              <WebSubscriptionCard overview={overview} pending={checkoutPending} onManage={(options) => beginSubscriptionManagement(options).catch(() => {})} />
            ) : overview.currentTier && overview.currentPlatform && overview.currentPlatform !== "STRIPE_WEB" ? (
              <Card>
                <Eyebrow tone="light">ABONNEMENT EN COURS</Eyebrow>
                <h2 className="v3-subheading">{tierName(overview.currentTier)}</h2>
                <p className="v3-body text-v3-ink-muted">
                  {STORE_NAMES[overview.currentPlatform]
                    ? `Ton abonnement est géré par ${STORE_NAMES[overview.currentPlatform]} jusqu’au ${formatDate(overview.currentExpiresAt)}. Tu pourras passer par le site à son échéance.`
                    : `Ton accès ${tierName(overview.currentTier)} est ouvert jusqu’au ${formatDate(overview.currentExpiresAt)}.`}
                </p>
              </Card>
            ) : overview.pendingPayment ? (
              <Card>
                <h2 className="v3-subheading">Paiement en cours de confirmation.</h2>
                <p className="v3-body text-v3-ink-muted">Stripe n’a pas encore confirmé ton paiement. Reviens dans quelques minutes : ton abonnement apparaîtra ici.</p>
                <div><Button onClick={load}>Actualiser</Button></div>
              </Card>
            ) : (
              <Card>
                <h2 className="v3-subheading">Aucun abonnement en cours.</h2>
                <p className="v3-body text-v3-ink-muted">
                  Tu es en Free : {PLAN_DETAILS.free.creditsPerMonth} crédits IA par mois. Passe à une formule pour débloquer plus d’outils.
                </p>
                <div><ButtonLink to="/tarifs">Voir les formules</ButtonLink></div>
              </Card>
            )}

            {web && !web.cancelAtPeriodEnd && (
              <ChangePlan
                allowed={overview.allowedPlanKeys}
                current={web.planKey}
                currentInterval={web.interval}
                interval={billingInterval}
                onInterval={setBillingInterval}
                pending={checkoutPending}
                onChange={(planKey) => beginSubscriptionManagement({ flow: "update", planKey, interval: billingInterval }).catch(() => {})}
              />
            )}

            {checkoutError && (
              <p role="alert" className="v3-small flex items-center gap-2 text-[#c0392b]">
                <CircleAlert className="size-4" aria-hidden="true" /> {checkoutError}
              </p>
            )}

            <p className="v3-small text-v3-ink-muted">
              Connecté avec {email ?? "ton compte MMA IQ"} ·{" "}
              <button type="button" onClick={() => logout()} className="underline underline-offset-2 hover:text-v3-navy">Se déconnecter</button>
              {" · "}
              <Link to="/aide" className="underline underline-offset-2 hover:text-v3-navy">Aide</Link>
            </p>
          </>
        )}
      </Section>
    </>
  );
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("flex flex-col items-start gap-4 rounded-[16px] bg-white p-6 text-v3-navy lg:p-8", className)}>{children}</div>;
}

const tierName = (tier: string) => PLAN_DETAILS[normalizePlanKey(tier) ?? "free"]?.name ?? tier;

function FinishProfile({ email, paid }: { email: string; paid: boolean }) {
  return (
    <div className="flex flex-col gap-4 rounded-[16px] bg-v3-accent p-6 text-white lg:p-8">
      <p className="v3-label text-v3-lavender">DERNIÈRE ÉTAPE</p>
      <h2 className="v3-subheading">{paid ? "Crée ton profil dans l’app pour profiter de ton abonnement." : "Ton compte MMA IQ n’a pas encore de profil dans l’app."}</h2>
      <ol className="v3-body flex list-decimal flex-col gap-2 pl-6 text-white/90">
        <li>Télécharge MMA IQ sur l’App Store ou sur Google Play.</li>
        <li>Choisis «&nbsp;Se connecter&nbsp;» avec {email}, pas «&nbsp;Créer un compte&nbsp;».</li>
        <li>Choisis le profil «&nbsp;Pratiquant&nbsp;» et termine ton inscription : {paid ? "ton abonnement s’y rattache automatiquement." : "tu retrouveras ici ton abonnement."}</li>
      </ol>
      <StoreButtons className="pt-2" stackOnMobile />
    </div>
  );
}

function WebSubscriptionCard({ overview, pending, onManage }: {
  overview: SubscriptionOverview;
  pending: boolean;
  onManage: (options?: { flow?: "cancel" }) => void;
}) {
  const web = overview.web!;
  const status = web.cancelAtPeriodEnd
    ? { label: "Résiliation programmée", tone: "muted" as const }
    : STATUS_LABELS[web.status] ?? { label: web.status, tone: "muted" as const };
  const period = web.interval === "yearly" ? "an" : "mois";
  const accessUntil = web.cancelAt ?? web.currentPeriodEnd;
  return (
    <Card>
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <Eyebrow tone="light">TA FORMULE</Eyebrow>
        <span className={cx(
          "rounded-full px-3 py-1 text-[13px] font-semibold leading-5",
          status.tone === "ok" && "bg-[#E6F7EE] text-[#136C3A]",
          status.tone === "warn" && "bg-[#FDECEC] text-[#A12626]",
          status.tone === "muted" && "bg-v3-clair text-v3-ink-muted",
        )}>{status.label}</span>
      </div>
      <h2 className="text-[36px] font-semibold leading-[42px] tracking-[-1px]">{web.planName ?? "Abonnement"}</h2>
      <dl className="grid w-full gap-x-8 gap-y-4 sm:grid-cols-2">
        <Fact label="Prix" value={web.amountCents != null ? `${formatEuroCents(web.amountCents)} / ${period}` : "—"} />
        <Fact label="Crédits IA" value={web.creditsPerMonth != null ? `${web.creditsPerMonth} par mois` : "—"} />
        {web.cancelAtPeriodEnd
          ? <Fact label="Accès jusqu’au" value={formatDate(accessUntil)} />
          : <Fact label="Prochain prélèvement" value={formatDate(web.currentPeriodEnd)} />}
        {web.discount && (
          <Fact label="Remise club" value={`−${web.discount.percent} %${web.discount.endsAt ? ` jusqu’au ${formatDate(web.discount.endsAt)}` : ""}`} />
        )}
      </dl>
      {(web.status === "past_due" || web.status === "unpaid") && (
        <p className="v3-body text-[#A12626]">Ton dernier paiement a été refusé : ton accès est suspendu. Mets à jour ta carte pour le rétablir.</p>
      )}
      {web.cancelAtPeriodEnd && (
        <p className="v3-body text-v3-ink-muted">
          Tu gardes ton accès et tes crédits jusqu’au {formatDate(accessUntil)}. Aucun prélèvement ne suivra. Tu peux réactiver ton abonnement d’ici là.
        </p>
      )}
      <div className="flex flex-wrap gap-4 pt-2">
        {web.cancelAtPeriodEnd ? (
          <Button onClick={() => onManage()} disabled={pending}>Réactiver mon abonnement</Button>
        ) : (
          <Button onClick={() => onManage()} disabled={pending}>Carte et factures</Button>
        )}
        {!web.cancelAtPeriodEnd && (
          <Button variant="outline-dark" onClick={() => onManage({ flow: "cancel" })} disabled={pending}>Résilier</Button>
        )}
      </div>
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="v3-small text-v3-ink-muted">{label}</dt>
      <dd className="text-[18px] font-semibold leading-7">{value}</dd>
    </div>
  );
}

function ChangePlan({ allowed, current, currentInterval, interval, onInterval, pending, onChange }: {
  allowed: string[];
  current: SubscriptionPlanKey | null;
  currentInterval: Interval;
  interval: Interval;
  onInterval: (value: Interval) => void;
  pending: boolean;
  onChange: (planKey: SubscriptionPlanKey) => void;
}) {
  const plans = allowed.map((key) => normalizePlanKey(key)).filter((key): key is SubscriptionPlanKey => key !== null);
  if (plans.length < 2 && plans[0] === current) return null;
  return (
    <section aria-labelledby="changer-formule" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 id="changer-formule" className="v3-subheading text-v3-navy">Changer de formule</h2>
          <p className="v3-small max-w-[640px] text-v3-ink-muted">Le changement est immédiat. En passant à une formule supérieure, tu règles tout de suite la différence au prorata ; vers une formule inférieure, elle est déduite de tes prochains prélèvements. Stripe t’affiche le montant exact avant de confirmer.</p>
        </div>
        <div role="group" aria-label="Périodicité" className="flex rounded-[12px] border border-v3-border bg-white p-1">
          {(["monthly", "yearly"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={interval === value}
              onClick={() => onInterval(value)}
              className={cx("min-h-10 rounded-[9px] px-4 text-[14px] font-semibold leading-5 transition-colors", interval === value ? "bg-v3-brand text-white" : "text-v3-navy hover:bg-v3-clair")}
            >
              {value === "monthly" ? "Mensuel" : "Annuel"}
            </button>
          ))}
        </div>
      </div>
      <ul className="grid gap-4 md:grid-cols-3">
        {plans.map((key) => {
          const prices = ACTIVE_PRICING.prices[key];
          const isCurrent = key === current && interval === currentInterval;
          return (
            <li key={key} className={cx("flex flex-col gap-3 rounded-[16px] p-6 text-v3-navy", isCurrent ? "bg-v3-lavender" : "bg-white")}>
              <h3 className="v3-subheading">{PLAN_DETAILS[key].name}</h3>
              <p className="text-[28px] font-semibold leading-8">
                {formatEuroCents(interval === "yearly" ? prices.yearlyCents : prices.monthlyCents)}
                <span className="v3-small text-v3-ink-muted"> / {interval === "yearly" ? "an" : "mois"}</span>
              </p>
              <p className="v3-small text-v3-ink-muted">{PLAN_DETAILS[key].creditsPerMonth} crédits IA par mois</p>
              {isCurrent ? (
                <p className="v3-label mt-auto pt-2">Ta formule actuelle</p>
              ) : (
                <Button className="mt-auto" compact disabled={pending} onClick={() => onChange(key)}>Passer à {PLAN_DETAILS[key].name}</Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
