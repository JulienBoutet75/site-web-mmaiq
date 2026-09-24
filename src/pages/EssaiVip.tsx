import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Seo } from "../components/Seo";
import { useMmaIqAccount } from "../context/MmaIqAccountContext";
import { submitLead } from "../lib/supabase";
import { Dialog, useDialogTitleId } from "../v3/Dialog";
import { useV3UI } from "../v3/V3UIContext";
import { Button, ButtonLink, Section } from "../v3/ui";

// Figma « Essai VIP · Desktop · Vue complète » (2110:22689) et « Mobile » (2174:21346).
// Après envoi : modale « VIP · Vérification » (2107:20034 / 2107:20043).

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EssaiVip() {
  const { profile } = useMmaIqAccount();
  const { openStores } = useV3UI();
  const ids = { email: useId(), emailError: useId(), code: useId(), codeError: useId() };
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  // Compte MMA IQ connecté : son adresse est proposée par défaut.
  useEffect(() => {
    if (profile?.email) setEmail((current) => current || profile.email || "");
  }, [profile?.email]);

  const focusForm = () => {
    emailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    emailRef.current?.focus({ preventScroll: true });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "loading") return;
    const trimmedEmail = email.trim();
    const trimmedCode = code.trim();
    const nextEmailError = EMAIL_PATTERN.test(trimmedEmail) ? null : "Saisis l’adresse e-mail de ton compte MMA IQ.";
    const nextCodeError = trimmedCode ? null : "Saisis le code VIP reçu avec ton invitation.";
    setEmailError(nextEmailError);
    setCodeError(nextCodeError);
    if (nextEmailError) return emailRef.current?.focus();
    if (nextCodeError) return codeRef.current?.focus();

    setStatus("loading");
    try {
      // La table leads n’accepte que contact | newsletter | waitlist | partner :
      // la demande part en « contact », préfixée pour le tri côté admin.
      await submitLead({
        type: "contact",
        email: trimmedEmail,
        name: [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || undefined,
        message: `[Essai VIP] Demande de vérification d’éligibilité — code d’invitation : ${trimmedCode}`,
      });
      setStatus("sent");
      setCode("");
    } catch (error) {
      console.error("Essai VIP error:", error);
      setStatus("error");
    }
  };

  return (
    <>
      <Seo
        title="Essai VIP MMA IQ — Retrouve ton invitation"
        description="Tu as reçu une invitation VIP MMA IQ ? Saisis ton adresse e-mail et ton code pour vérifier ton éligibilité et découvrir plus d’outils."
        canonicalPath="/essai-vip"
      />

      {/* Introduction */}
      <Section tone="fond" as="header" className="py-6 lg:py-8" innerClassName="flex flex-col gap-2 lg:gap-4">
        <p className="v3-label text-v3-lavender">EXPÉRIENCE VIP</p>
        <h1 className="text-[32px] font-semibold leading-[38px] text-white lg:text-[40px] lg:leading-[46px]">Retrouve ton invitation VIP.</h1>
        <p className="v3-small text-v3-muted lg:max-w-[720px] lg:text-[18px] lg:leading-7">
          Une invitation à découvrir plus d’outils. Vérifie ton éligibilité et retrouve les conditions de ton offre.
        </p>
      </Section>

      {/* Formulaire */}
      <Section tone="clair" className="py-6 lg:py-0" innerClassName="flex flex-col gap-4">
        <h2 className="text-[32px] font-semibold leading-[38px] lg:text-[40px] lg:leading-[46px]">Retrouve ton invitation.</h2>
        <p className="v3-small text-v3-ink-muted lg:max-w-[760px]">Connecte ton compte MMA IQ à ton code VIP.</p>

        <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col items-stretch gap-4 lg:max-w-[640px] lg:items-start">
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
          <div className="w-full">
            <label htmlFor={ids.code} className="v3-field-label">Code d’invitation</label>
            <input
              ref={codeRef}
              id={ids.code}
              name="code"
              type="text"
              autoComplete="off"
              spellCheck={false}
              maxLength={40}
              placeholder="Ton code VIP"
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setCodeError(null);
              }}
              aria-invalid={codeError ? true : undefined}
              aria-describedby={codeError ? ids.codeError : undefined}
              className="v3-input"
            />
            {codeError && <p id={ids.codeError} role="alert" className="v3-small mt-2 text-[#c0392b]">{codeError}</p>}
          </div>
          <Button type="submit" aria-disabled={status === "loading" || undefined} className="w-full lg:w-auto">
            {status === "loading" ? "Envoi…" : "Vérifier mon éligibilité"}
          </Button>
          {status === "error" && (
            <p role="alert" className="v3-small text-[#c0392b]">L’envoi n’a pas abouti. Réessaie dans un instant ou contacte l’équipe.</p>
          )}
          <p className="v3-label text-v3-ink-muted">Le détail de l’offre s’affiche après vérification. Tu choisis ensuite de l’activer.</p>
        </form>
      </Section>

      {/* Découverte */}
      <Section tone="clair" className="py-8 lg:py-12" innerClassName="flex flex-col items-start gap-4">
        <h2 className="text-[32px] font-semibold leading-[38px] lg:text-[40px] lg:leading-[46px]">Entre dans le détail.</h2>
        <p className="v3-body">Gameplans · outils IA · suivi de progression</p>
        <p className="v3-small text-v3-ink-muted lg:max-w-[760px]">
          Explore les outils inclus dans ton invitation et teste-les sur ton entraînement. Les crédits disponibles, la durée et les conditions sont précisés dans ton offre personnelle.
        </p>
        <Button onClick={focusForm}>Vérifier mon invitation</Button>
      </Section>

      {/* Dans la pratique */}
      <Section tone="fond" className="py-12 lg:py-[72px]" innerClassName="flex flex-col items-start gap-6 lg:gap-10">
        <div className="relative h-[220px] w-full overflow-hidden rounded-[16px] lg:h-[340px]">
          <img
            src="/v3/photo-vip-vers-la-lumiere.webp"
            alt="Un combattant avance vers la lumière entre deux rangées de sacs de frappe MMA IQ"
            width={1600}
            height={900}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
        </div>
        <p className="v3-body text-v3-muted lg:max-w-[760px]">
          Un seul compte, dans l’app comme sur le site. Après activation, retrouve tes avantages directement dans MMA IQ.
        </p>
        <Button onClick={openStores} aria-haspopup="dialog">Télécharger MMA IQ</Button>
      </Section>

      <VerificationDialog open={status === "sent"} onClose={() => setStatus("idle")} />
    </>
  );
}

/** « VIP · Vérification » : la demande est transmise à l’équipe. */
function VerificationDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useDialogTitleId("vip-verification-title");
  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} panelClassName="max-w-[560px] rounded-[16px] bg-v3-paper p-6 text-v3-navy sm:bg-v3-clair sm:p-10">
      <div className="flex flex-col items-start gap-6">
        <h2 id={titleId} className="text-[32px] font-medium leading-9 tracking-[-0.96px] sm:text-[48px] sm:font-semibold sm:leading-[54px] sm:tracking-[-1px]">
          Vérifions ton accès.
        </h2>
        <p className="v3-body text-v3-ink-muted">
          L’équipe vérifie les conditions d’accès associées à ton compte. Pour connaître les modalités de l’essai, tu peux nous contacter.
        </p>
        <ButtonLink to="/contact" data-autofocus>Contacter l’équipe</ButtonLink>
        <button
          type="button"
          onClick={onClose}
          className="v3-label -my-3 min-h-11 text-left text-v3-ink-muted underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-v3-brand"
        >
          Fermer
        </button>
      </div>
    </Dialog>
  );
}
