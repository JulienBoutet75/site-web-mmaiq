import { useState, useEffect, FormEvent } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, Bell, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { supabase, submitLead } from "../lib/supabase";
import { saveReferral } from "../lib/referral";
import { useMmaIqAccount } from "../context/MmaIqAccountContext";
import { ACTIVE_PRICING, formatEuroCents, isClubDiscountEligible } from "../config/subscriptionCommercial";
import { Seo } from "../components/Seo";
import { KEY_FIGURE, PROFILE_HEADING, ProfileFeatures } from "../components/ProfileSections";
import { ArrowLink, Button, ButtonLink, Section, buttonClass, cx } from "../v3/ui";

// Tant que l'app n'est pas lancée, la landing convertit en pré-inscriptions
// (waitlist). Passer VITE_ENABLE_CHECKOUT=true au lancement pour vendre
// l'abonnement web directement (prix fixés côté serveur, remise salle
// appliquée automatiquement au checkout).
const CHECKOUT_ENABLED = import.meta.env.VITE_ENABLE_CHECKOUT === "true";

interface CheckoutPlan {
  key: "essentiel" | "performance" | "elite";
  name: string;
  monthly: string;
  yearly: string;
  tagline: string;
}

const CHECKOUT_PLANS: CheckoutPlan[] = [
  { key: "essentiel", name: "Essentiel", monthly: formatEuroCents(ACTIVE_PRICING.prices.essentiel.monthlyCents), yearly: formatEuroCents(ACTIVE_PRICING.prices.essentiel.yearlyCents), tagline: "L'essentiel pour progresser" },
  { key: "performance", name: "Performance", monthly: formatEuroCents(ACTIVE_PRICING.prices.performance.monthlyCents), yearly: formatEuroCents(ACTIVE_PRICING.prices.performance.yearlyCents), tagline: "Pour les compétiteurs" },
  { key: "elite", name: "Elite", monthly: formatEuroCents(ACTIVE_PRICING.prices.elite.monthlyCents), yearly: formatEuroCents(ACTIVE_PRICING.prices.elite.yearlyCents), tagline: "L'expérience complète" },
];

interface PartnerPublic {
  name: string;
  slug: string;
  code: string;
  city: string | null;
  logo_url: string | null;
  discount_percent: number;
  discount_months: number;
}

// Landing co-brandée d'une salle partenaire : cible du QR affiché en salle
// et des liens partagés par les coachs. Dépose le code d'attribution puis
// convertit en pré-inscription waitlist taguée (l'app n'est pas encore lancée).
// Pas de maquette dédiée : langage V3 de la page Partenaire (fonds, titres, cartes, champs).
export function Salle() {
  const { beginSubscriptionCheckout, checkoutError } = useMmaIqAccount();
  const { slug } = useParams();
  const [partner, setPartner] = useState<PartnerPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [subError, setSubError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("partners_public")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (cancelled) return;
      setPartner(data ?? null);
      // Toute navigation ultérieure (ex. /application) reste attribuée à la salle.
      if (data?.code) saveReferral(data.code);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "loading" || !partner) return;
    setStatus("loading");
    try {
      await submitLead({ type: "waitlist", email, referral_code: partner.code });
      setStatus("success");
      setEmail("");
    } catch (err) {
      console.error("Salle waitlist error:", err);
      setStatus("error");
    }
  };

  const handleSubscribe = async (planKey: "essentiel" | "performance" | "elite") => {
    if (subscribing || !partner) return;
    setSubError(false);
    setSubscribing(planKey);
    try {
      await beginSubscriptionCheckout({ planKey, interval, gymCode: partner.code });
      // Redirection vers Stripe : on ne reset pas subscribing.
    } catch (err) {
      console.error("Salle checkout error:", err);
      setSubError(true);
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <section className="v3-first-screen v3-gutter flex items-center justify-center bg-v3-fond" aria-busy="true">
        <Seo title="Salle partenaire — MMA IQ" canonicalPath={`/s/${slug ?? ""}`} />
        <Loader2 aria-label="Chargement de la page du club" strokeWidth={1.7} className="size-10 animate-spin text-v3-lavender" />
      </section>
    );
  }

  if (!partner) {
    return (
      <Section tone="fond" className="v3-first-screen flex flex-col justify-center py-12 lg:py-[72px]" innerClassName="flex flex-col items-start gap-4 lg:gap-6">
        <Seo title="Salle introuvable — MMA IQ" canonicalPath={`/s/${slug ?? ""}`} />
        <p className="v3-label text-v3-lavender">SALLE PARTENAIRE</p>
        <h1 className="v3-display text-[48px] leading-[52px] text-v3-paper lg:text-[96px] lg:leading-[94px]">Salle introuvable</h1>
        <p className="text-[16px] leading-6 text-v3-muted lg:max-w-[550px] lg:text-[18px] lg:leading-7">
          Ce lien ne correspond à aucune salle partenaire active.
        </p>
        <ButtonLink to="/application">Découvrir l’application MMA IQ</ButtonLink>
      </Section>
    );
  }

  const hasDiscount = partner.discount_percent > 0 && partner.discount_months > 0;
  const billingIntervals: Array<"monthly" | "yearly"> = hasDiscount
    ? ["monthly"]
    : ["monthly", "yearly"];

  const benefits = [
    { title: "Progresse entre les cours", text: "Plans d'entraînement et nutrition périodisés, adaptés à ta discipline." },
    {
      title: "Rattaché à ton club",
      text: CHECKOUT_ENABLED
        ? "Ton abonnement soutient directement ta salle et ton coach."
        : "Ta pré-inscription soutient directement ta salle et ton coach.",
    },
    {
      title: "Avantage membre",
      text: hasDiscount
        ? `−${partner.discount_percent} % pendant ${partner.discount_months} mois sur Performance et Elite.`
        : "Des avantages exclusifs réservés aux membres du club.",
    },
  ];

  return (
    <>
      <Seo
        title={`${partner.name} × MMA IQ`}
        description={`${partner.name} est salle partenaire MMA IQ : entraînement, nutrition, gameplan et analyse vidéo, avec l’avantage réservé aux membres du club.`}
        canonicalPath={`/s/${partner.slug}`}
      />

      {/* Premier écran co-brandé */}
      <Section
        tone="fond"
        className="v3-first-screen flex flex-col justify-center py-12 lg:py-[72px]"
        innerClassName="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16"
      >
        <div className="flex min-w-0 flex-col items-start gap-4 lg:flex-[0_1_608px] lg:gap-6">
          <div className="flex items-center gap-4">
            <img src="/v3/logo.webp" alt="MMA IQ" width={183} height={144} className="h-11 w-auto" />
            <span aria-hidden="true" className="text-[24px] leading-none text-v3-muted">×</span>
            {partner.logo_url ? (
              <img
                src={partner.logo_url}
                alt={partner.name}
                className="size-14 rounded-[12px] border border-white/10 bg-white/5 object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="v3-subheading text-v3-paper">{partner.name}</span>
            )}
          </div>

          <p className="v3-label text-v3-lavender">SALLE PARTENAIRE MMA IQ</p>
          <h1 className="v3-display text-[48px] leading-[52px] text-v3-paper lg:text-[64px] lg:leading-[68px] xl:text-[88px] xl:leading-[92px]">
            Ton club t’ouvre les portes de MMA IQ
          </h1>

          {partner.city && (
            <p className="v3-label flex items-center gap-2 text-v3-muted">
              <MapPin aria-hidden="true" strokeWidth={1.7} className="size-4 shrink-0" /> {partner.name} · {partner.city}
            </p>
          )}

          <p className="text-[16px] leading-6 text-v3-muted lg:max-w-[550px] lg:text-[18px] lg:leading-7">
            Entraînement, nutrition, cutting, gameplan et analyse vidéo IA :
            l'app tout-en-un du combattant, disponible sur iOS et Android.{" "}
            {CHECKOUT_ENABLED
              ? "Abonne-toi via ton club et profite de son offre partenaire."
              : "Pré-inscris-toi avec le code de ton club."}
          </p>

          {CHECKOUT_ENABLED ? (
            <a href="#formules" className={buttonClass("primary")}>Voir les formules</a>
          ) : (
            <>
              {status === "success" ? (
                <p role="status" className="flex w-full items-start gap-3 rounded-[16px] border border-white/15 bg-white/5 p-4 text-[16px] leading-6 text-white lg:max-w-[550px]">
                  <CheckCircle2 aria-hidden="true" strokeWidth={1.7} className="mt-0.5 size-5 shrink-0 text-v3-lavender" />
                  C'est noté ! Tu es rattaché à {partner.name}. On te prévient au lancement.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-[550px]">
                  <label htmlFor="salle-email" className="sr-only">Email</label>
                  <input
                    id="salle-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton@email.com"
                    className="v3-input-dark sm:flex-1"
                  />
                  <Button type="submit" disabled={status === "loading"}>
                    {status === "loading"
                      ? <Loader2 aria-hidden="true" className="size-5 animate-spin" />
                      : <Bell aria-hidden="true" strokeWidth={1.7} className="size-5" />}
                    Me pré-inscrire
                  </Button>
                </form>
              )}

              {status === "error" && (
                <p role="alert" className="flex items-center gap-2 text-[14px] leading-5 text-white">
                  <AlertCircle aria-hidden="true" strokeWidth={1.7} className="size-4 shrink-0 text-[#ff8a80]" />
                  L'inscription a échoué. Réessaie dans un instant.
                </p>
              )}
            </>
          )}

          <p className="v3-small text-v3-muted">
            Code club : <span className="font-medium text-v3-paper">{partner.code}</span>
            {CHECKOUT_ENABLED ? " · Paiement sécurisé par Stripe" : " · Pré-inscription gratuite · Sans engagement"}
          </p>
        </div>

        {hasDiscount && (
          <aside aria-label="Avantage membre" className="flex flex-col gap-6 rounded-[16px] bg-v3-accent p-8 text-white lg:flex-[0_1_520px]">
            <p className={KEY_FIGURE}>−{partner.discount_percent}{" "}%</p>
            <p className="v3-subheading">pendant {partner.discount_months} mois</p>
            <p className="v3-body">Sur Performance et Elite, réservé aux membres {partner.name}.</p>
          </aside>
        )}
      </Section>

      {/* Formules (vente web activée) */}
      {CHECKOUT_ENABLED && (
        <Section
          tone="clair"
          id="formules"
          className="scroll-mt-[72px] py-12 lg:scroll-mt-[104px] lg:py-[72px]"
          innerClassName="flex flex-col gap-6 lg:gap-10"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <h2 className={cx(PROFILE_HEADING, "text-v3-navy")}>Choisis ta formule.</h2>
            {/* Choix mensuel / annuel */}
            <div className="inline-flex self-start rounded-[12px] border border-v3-border bg-white p-1 lg:self-auto" role="group" aria-label="Facturation">
              {billingIntervals.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInterval(i)}
                  aria-pressed={interval === i}
                  className={cx(
                    "min-h-11 rounded-[8px] px-5 text-[14px] font-semibold leading-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-v3-brand",
                    interval === i ? "bg-v3-brand text-white" : "text-v3-ink-muted hover:text-v3-navy",
                  )}
                >
                  {i === "monthly" ? "Mensuel" : "Annuel (−17 %)"}
                </button>
              ))}
            </div>
          </div>

          <ul className="grid gap-6 lg:grid-cols-3">
            {CHECKOUT_PLANS.map((plan) => (
              <li key={plan.key} className="flex flex-col gap-4 rounded-[16px] border border-v3-border bg-white p-8 text-v3-navy">
                <div className="flex flex-col gap-1">
                  <h3 className="v3-subheading">{plan.name}</h3>
                  <p className="v3-small text-v3-ink-muted">{plan.tagline}</p>
                </div>
                <p className="text-[36px] font-semibold leading-10 tracking-[-1px]">
                  {interval === "monthly" ? plan.monthly : plan.yearly}
                  <span className="v3-small font-normal tracking-normal text-v3-ink-muted"> {interval === "monthly" ? "/ mois" : "/ an"}</span>
                </p>
                {hasDiscount && !isClubDiscountEligible(plan.key) && (
                  <p className="v3-small text-v3-ink-muted">Essentiel n'est pas remisé par le code club.</p>
                )}
                <Button
                  block
                  className="mt-auto"
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={subscribing !== null}
                >
                  {subscribing === plan.key ? <Loader2 aria-hidden="true" className="size-5 animate-spin" /> : null}
                  Choisir {plan.name}
                </Button>
              </li>
            ))}
          </ul>

          {hasDiscount && (
            <p className="v3-small text-v3-ink-muted">
              La remise −{partner.discount_percent} % ({partner.discount_months} mois) est appliquée automatiquement aux formules Performance et Elite mensuelles.
            </p>
          )}

          {(subError || checkoutError) && (
            <p role="alert" className="flex items-center gap-2 rounded-[12px] border border-[#c0392b]/40 bg-[#c0392b]/10 px-4 py-3 text-[14px] leading-5 text-v3-navy">
              <AlertCircle aria-hidden="true" strokeWidth={1.7} className="size-4 shrink-0 text-[#c0392b]" />
              {checkoutError || "Impossible d'ouvrir le paiement. Réessaie dans un instant."}
            </p>
          )}
        </Section>
      )}

      {/* Ce que ça t'apporte */}
      <Section tone="surface" className="py-12 lg:py-[72px]" innerClassName="flex flex-col items-start gap-10">
        <h2 className="sr-only">Les avantages pour les membres du club</h2>
        <ProfileFeatures items={benefits} tone="dark" />
        <ArrowLink to="/application">Découvrir l’application en détail</ArrowLink>
      </Section>
    </>
  );
}
