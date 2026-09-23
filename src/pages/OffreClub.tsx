import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Seo } from "../components/Seo";
import { useMmaIqAccount } from "../context/MmaIqAccountContext";
import { ACTIVE_PRICING, CLUB_OFFER_REFERENCE, formatEuroCents } from "../config/subscriptionCommercial";
import { getReferral, normalizeRefCode, saveReferral } from "../lib/referral";
import { submitLead, supabase } from "../lib/supabase";
import { Dialog, useDialogTitleId } from "../v3/Dialog";
import { Button, ButtonLink, Section } from "../v3/ui";

// Figma « Offre partenaire · Desktop · Vue complète » (2110:22429) et « Mobile » (2174:21222).
// Modale « Code partenaire · Aide » (2093:12731 / 2093:12739) : code club manquant.

type Partner = {
  name: string;
  code: string;
  city: string | null;
  discount_percent: number;
  discount_months: number;
};

const DISCOUNT = CLUB_OFFER_REFERENCE.discountPercent;
const COMMISSION = Math.round(CLUB_OFFER_REFERENCE.clubCommissionRate * 100);
// Formules concernées par la remise club (Performance et Elite).
const ELIGIBLE_PLANS = [
  { key: "performance", name: "Performance" },
  { key: "elite", name: "Elite" },
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function OffreClub() {
  const [searchParams] = useSearchParams();
  const { profile } = useMmaIqAccount();
  const ids = { code: useId(), codeError: useId(), email: useId(), emailError: useId() };
  const codeRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Code pré-rempli : lien partagé par la salle (?code= / ?salle=) ou attribution enregistrée.
  const [code, setCode] = useState(() => searchParams.get("code") ?? searchParams.get("salle") ?? getReferral()?.code ?? "");
  const [email, setEmail] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [partner, setPartner] = useState<Partner | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  // Compte MMA IQ connecté : son adresse est proposée par défaut.
  useEffect(() => {
    if (profile?.email) setEmail((current) => current || profile.email || "");
  }, [profile?.email]);

  const focusCode = () => {
    codeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    codeRef.current?.focus({ preventScroll: true });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "loading") return;
    setPartner(null);
    setStatus("idle");

    if (!code.trim()) {
      setCodeError(null);
      setHelpOpen(true);
      return;
    }
    const normalized = normalizeRefCode(code);
    const nextCodeError = normalized ? null : "Ce code n’est pas valide : 3 à 14 lettres ou chiffres.";
    const nextEmailError = EMAIL_PATTERN.test(email.trim()) ? null : "Saisis l’adresse e-mail de ton compte MMA IQ.";
    setCodeError(nextCodeError);
    setEmailError(nextEmailError);
    if (nextCodeError) return codeRef.current?.focus();
    if (nextEmailError || !normalized) return emailRef.current?.focus();

    setStatus("loading");
    try {
      const { data, error } = await supabase
        .from("partners_public")
        .select("name, code, city, discount_percent, discount_months")
        .eq("code", normalized)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        setStatus("idle");
        setCodeError("Ce code ne correspond à aucun club partenaire actif. Vérifie-le auprès de ta salle.");
        codeRef.current?.focus();
        return;
      }
      // Le code suit la navigation jusqu’au paiement (pré-rempli sur /paiement/:formule).
      saveReferral(data.code);
      setPartner(data);
      setStatus("idle");
      // Attribution de l’adhérent à sa salle (pré-inscription taguée, comme sur /s/:slug),
      // une seule fois par couple e-mail / code : revérifier ne crée pas de doublon.
      const leadKey = `mmaiq.offre-club-lead:${data.code}:${email.trim().toLowerCase()}`;
      let alreadySent = false;
      try { alreadySent = sessionStorage.getItem(leadKey) === "1"; } catch { /* stockage indisponible */ }
      if (!alreadySent) {
        submitLead({ type: "waitlist", email: email.trim(), referral_code: data.code })
          .then(() => { try { sessionStorage.setItem(leadKey, "1"); } catch { /* stockage indisponible */ } })
          .catch((error) => console.error("Offre club lead error:", error));
      }
    } catch (error) {
      console.error("Offre club verification error:", error);
      setStatus("error");
    }
  };

  return (
    <>
      <Seo
        title="Offre club MMA IQ — Vérifie ton code club"
        description={`Avec ton club partenaire, bénéficie de −${DISCOUNT} % sur les formules Performance et Elite de MMA IQ. Saisis le code transmis par ta salle.`}
        canonicalPath="/tarifs/club"
      />

      {/* Introduction */}
      <Section tone="fond" as="header" className="py-6 lg:py-8" innerClassName="flex flex-col gap-2 lg:gap-4">
        <p className="v3-label text-v3-lavender">L’OFFRE CLUB</p>
        <h1 className="text-[32px] font-semibold leading-[38px] text-white lg:text-[40px] lg:leading-[46px]">Vérifie ton code club.</h1>
        <p className="v3-small text-v3-muted lg:max-w-[720px] lg:text-[18px] lg:leading-7">
          Avec ton club partenaire, bénéficie d’une remise sur Performance et Elite.
        </p>
      </Section>

      {/* Formulaire */}
      <Section tone="clair" id="code-club" className="scroll-mt-[72px] py-6 lg:scroll-mt-[104px] lg:py-0" innerClassName="flex flex-col gap-4">
        <h2 className="text-[32px] font-semibold leading-[38px] lg:text-[40px] lg:leading-[46px]">
          <span className="lg:hidden">Un code club ?</span>
          <span className="hidden lg:inline">Ton club est partenaire ?</span>
        </h2>
        <p className="v3-small text-v3-ink-muted lg:max-w-[760px]">Saisis ton code pour retrouver l’offre associée à ta salle.</p>

        <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col items-stretch gap-4 lg:max-w-[640px] lg:items-start">
          <div className="w-full">
            <label htmlFor={ids.code} className="v3-field-label">Code club</label>
            <input
              ref={codeRef}
              id={ids.code}
              name="code"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={24}
              placeholder="Le code transmis par ta salle"
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setCodeError(null);
                setPartner(null);
              }}
              aria-invalid={codeError ? true : undefined}
              aria-describedby={codeError ? ids.codeError : undefined}
              className="v3-input"
            />
            {codeError && <p id={ids.codeError} role="alert" className="v3-small mt-2 text-[#c0392b]">{codeError}</p>}
          </div>
          <div className="w-full">
            <label htmlFor={ids.email} className="v3-field-label">Adresse e-mail MMA IQ</label>
            <input
              ref={emailRef}
              id={ids.email}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="ton.adresse@email.fr"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError(null);
              }}
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? ids.emailError : undefined}
              className="v3-input"
            />
            {emailError && <p id={ids.emailError} role="alert" className="v3-small mt-2 text-[#c0392b]">{emailError}</p>}
          </div>
          <Button type="submit" aria-disabled={status === "loading" || undefined} className="w-full lg:w-auto">
            {status === "loading" ? "Vérification…" : "Vérifier le code"}
          </Button>
          {status === "error" && (
            <p role="alert" className="v3-small text-[#c0392b]">La vérification n’a pas abouti. Réessaie dans un instant.</p>
          )}
          <p className="v3-label text-v3-ink-muted">La remise et le prix final seront visibles avant de poursuivre.</p>
        </form>

        {partner && <PartnerOffer partner={partner} />}
      </Section>

      {/* Avantage club */}
      <Section tone="accent" className="py-8 lg:py-12" innerClassName="flex flex-col items-start gap-4">
        <h2 className="text-[32px] font-semibold leading-[38px] lg:text-[40px] lg:leading-[46px]">−{DISCOUNT} % avec ton club.</h2>
        <p className="v3-body">Sur les formules Performance et Elite</p>
        <p className="v3-small lg:max-w-[760px]">
          Utilise le lien ou le code transmis par ta salle. Ta remise est calculée avant le paiement, avec le montant et les conditions de ton abonnement.
        </p>
        <Button onClick={focusCode}>Vérifier mon code club</Button>
      </Section>

      {/* Pour les salles */}
      <Section tone="fond" className="py-12 lg:py-[72px]" innerClassName="flex flex-col items-start gap-6 lg:gap-10">
        <h2 className="text-[36px] font-medium leading-10 tracking-[-1.08px] text-white lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]">
          Tu diriges une salle ?
        </h2>
        <p className="v3-subheading text-v3-lavender lg:max-w-[960px]">
          {COMMISSION} % de commission sur le montant HT encaissé de chaque abonnement vendu via ton club.
        </p>
        <p className="v3-body text-v3-muted lg:max-w-[760px]">
          Partage ton lien ou ton QR code. Tes adhérents souscrivent directement auprès de MMA IQ. Les modalités de versement et de renouvellement sont précisées dans ton contrat partenaire.
        </p>
        <ButtonLink to="/partenaires">Devenir partenaire</ButtonLink>
      </Section>

      <CodeHelpDialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        onBack={() => {
          setHelpOpen(false);
          // Après restauration du focus par la modale, on replace le curseur dans le champ.
          window.setTimeout(() => codeRef.current?.focus(), 0);
        }}
      />
    </>
  );
}

/** Offre retrouvée pour le club (données publiques `partners_public`). */
function PartnerOffer({ partner }: { partner: Partner }) {
  const ref = useRef<HTMLDivElement>(null);
  // Le résultat prend le focus : lecteurs d’écran et clavier y arrivent directement.
  useEffect(() => ref.current?.focus(), []);
  const hasDiscount = partner.discount_percent > 0 && partner.discount_months > 0;
  const query = `?salle=${encodeURIComponent(partner.code)}`;
  return (
    <div ref={ref} role="status" tabIndex={-1} className="flex w-full flex-col items-start gap-4 rounded-[16px] bg-white p-6 focus:outline-none lg:mb-12 lg:max-w-[640px]">
      <p className="v3-label text-v3-ink-muted">CLUB PARTENAIRE{partner.city ? ` · ${partner.city.toUpperCase()}` : ""}</p>
      <h3 className="v3-subheading">{partner.name}</h3>
      <p className="v3-small text-v3-ink-muted">
        {hasDiscount
          ? `−${partner.discount_percent} % sur Performance et Elite pendant ${partner.discount_months} mois, avec l’abonnement mensuel.`
          : "Ton abonnement sera rattaché à ton club. Aucune remise n’est active pour ce club en ce moment."}
      </p>
      <ul className="flex w-full flex-col gap-2">
        {ELIGIBLE_PLANS.map((plan) => {
          const base = ACTIVE_PRICING.prices[plan.key].monthlyCents;
          const final = hasDiscount ? Math.round((base * (100 - partner.discount_percent)) / 100) : base;
          return (
            <li key={plan.key} className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-v3-border py-2 last:border-b-0">
              <span className="v3-body">{plan.name}</span>
              <span className="v3-body font-semibold">
                {formatEuroCents(final)} / mois
                {hasDiscount && <span className="v3-small ml-2 font-normal text-v3-ink-muted line-through">{formatEuroCents(base)}</span>}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <ButtonLink to={`/paiement/performance${query}`}>Poursuivre avec Performance</ButtonLink>
        <ButtonLink to={`/paiement/elite${query}`} variant="outline-dark">Poursuivre avec Elite</ButtonLink>
      </div>
    </div>
  );
}

/** « Code partenaire · Aide » : affichée quand le code club est vide. */
function CodeHelpDialog({ open, onClose, onBack }: { open: boolean; onClose: () => void; onBack: () => void }) {
  const titleId = useDialogTitleId("club-code-help-title");
  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} panelClassName="max-w-[560px] rounded-[16px] bg-v3-paper p-6 text-v3-navy sm:bg-v3-clair sm:p-10">
      <div className="flex flex-col items-start gap-6">
        <h2 id={titleId} className="text-[32px] font-medium leading-9 tracking-[-0.96px] sm:text-[48px] sm:font-semibold sm:leading-[54px] sm:tracking-[-1px]">
          Le code de ton club<br />est nécessaire.
        </h2>
        <p className="v3-body text-v3-ink-muted">
          Saisis le code communiqué par ta salle. Tu peux le retrouver dans son lien ou sur son QR code partenaire.
        </p>
        <Button onClick={onBack} data-autofocus>Revenir au formulaire</Button>
      </div>
    </Dialog>
  );
}
