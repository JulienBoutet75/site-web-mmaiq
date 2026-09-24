import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowDown } from "lucide-react";
import { submitLead } from "../lib/supabase";
import { Seo } from "../components/Seo";
import { CONTACT_EMAIL } from "../data/site";
import { ACCOUNT_TITLE, FormAlert } from "../components/AccountForm";
import { Dialog, useDialogTitleId } from "../v3/Dialog";
import { Button, ButtonLink, Eyebrow, Section } from "../v3/ui";

// Figma « Contact · Desktop · Vue complète » (2110:24662) et « Mobile » (2174:22267) ;
// état « Contact · Message envoyé » (2093:5003 / 2093:5022).

const MOTIFS = [
  { id: "app", label: "Question sur l’app ou une formation" },
  { id: "partner", label: "Partenariat salle ou club" },
  { id: "presse", label: "Presse" },
  { id: "autre", label: "Autre" },
] as const;

type MotifId = (typeof MOTIFS)[number]["id"];

const isMotif = (value: string | null): value is MotifId => MOTIFS.some((m) => m.id === value);

/** Champs du formulaire de contact : 48 px de haut (padding 12/16), fond blanc, rayon 12. */
const FIELD = "v3-input min-h-12 py-[11px]";
const LABEL = "v3-label text-v3-navy";

export function Contact() {
  // ?motif=partner (lien « Devenir partenaire ») pré-sélectionne le sujet ; valeurs inconnues ignorées.
  const [searchParams] = useSearchParams();
  const motifParam = searchParams.get("motif");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [motif, setMotif] = useState<MotifId>(() => (isMotif(motifParam) ? motifParam : "app"));
  const [message, setMessage] = useState("");
  // Candidature partenaire : nom du club et ville, lus par l’admin (PartnersCRUD).
  const [clubName, setClubName] = useState("");
  const [city, setCity] = useState("");
  // Honeypot : champ invisible pour les humains, rempli par les bots
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const successTitleId = useDialogTitleId("contact-envoye");

  useEffect(() => {
    if (isMotif(motifParam)) setMotif(motifParam);
  }, [motifParam]);

  // Une saisie après un échec efface l'erreur : l'utilisateur corrige, on repart à zéro
  const withErrorReset = <T,>(setter: (v: T) => void) => (value: T) => {
    if (status === "error") setStatus("idle");
    setter(value);
  };

  const setNameSafe = withErrorReset(setName);
  const setEmailSafe = withErrorReset(setEmail);
  const setMotifSafe = withErrorReset(setMotif);
  const setMessageSafe = withErrorReset(setMessage);
  const setClubNameSafe = withErrorReset(setClubName);
  const setCitySafe = withErrorReset(setCity);

  const resetFields = () => {
    setName("");
    setEmail("");
    setMotif("app");
    setMessage("");
    setClubName("");
    setCity("");
    setWebsite("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;

    // Bot détecté : on simule le succès sans rien envoyer
    if (website.trim()) {
      resetFields();
      setStatus("success");
      return;
    }

    setStatus("loading");
    const motifLabel = MOTIFS.find((m) => m.id === motif)!.label;
    try {
      if (motif === "partner") {
        // Format historique des candidatures (ancien formulaire /partenaires) :
        // name = club ; « Contact : » et « Ville : » sont relus par PartnersCRUD.
        await submitLead({
          type: "partner",
          email,
          name: clubName.trim() || name,
          message: [
            name && `Contact : ${name}`,
            city.trim() && `Ville : ${city.trim()}`,
            message,
          ]
            .filter(Boolean)
            .join("\n"),
        });
      } else {
        await submitLead({
          type: "contact",
          email,
          name,
          message: [`Motif : ${motifLabel}`, message].filter(Boolean).join("\n\n"),
        });
      }
      resetFields();
      setStatus("success");
    } catch (err) {
      console.error("Contact form error:", err);
      setStatus("error");
    }
  };

  const selectedMotif = MOTIFS.find((m) => m.id === motif)!.label;

  return (
    <>
      <Seo
        title="Contact — MMA IQ"
        description="Une question sur l’app, une formation ou un partenariat salle ? Écris à l’équipe MMA IQ."
        canonicalPath="/contact"
      />

      {/* 01 · Introduction */}
      <Section tone="fond" className="py-8 lg:py-12" innerClassName="flex flex-col items-start gap-6 lg:items-center lg:text-center">
        <Eyebrow>PARLONS MMA</Eyebrow>
        <h1 className="text-[32px] font-semibold leading-[38px] text-white lg:max-w-[720px] lg:text-[40px] lg:leading-[46px]">
          Comment peut-on<br />t’aider ?
        </h1>
        <p className="v3-body text-v3-muted lg:max-w-[720px]">Une question sur MMA IQ, une formation ou ton club ? Écris-nous.</p>
      </Section>

      {/* 02 · Écrire à MMA IQ */}
      <Section tone="clair" className="py-8 lg:py-12">
        <div className="mx-auto flex w-full max-w-[1152px] flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,416fr)_minmax(0,672fr)] lg:items-start lg:gap-10 xl:gap-16">
          {/* Formulaire — en premier dans le DOM (ordre mobile), à droite sur desktop */}
          <form onSubmit={handleSubmit} className="relative flex w-full flex-col items-start gap-6 lg:order-last">
            {/* Honeypot anti-spam : invisible et inatteignable pour un humain */}
            <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
              <label htmlFor="contact-website">Ne pas remplir ce champ</label>
              <input
                type="text"
                id="contact-website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div className="flex w-full flex-col gap-2">
              <label htmlFor="contact-name" className={LABEL}>Nom</label>
              <input
                type="text"
                id="contact-name"
                name="name"
                autoComplete="name"
                required
                minLength={2}
                value={name}
                onChange={(e) => setNameSafe(e.target.value)}
                className={FIELD}
                placeholder="Prénom et nom"
              />
            </div>

            <div className="flex w-full flex-col gap-2">
              <label htmlFor="contact-email" className={LABEL}>E-mail</label>
              <input
                type="email"
                id="contact-email"
                name="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmailSafe(e.target.value)}
                className={FIELD}
                placeholder="toi@exemple.fr"
              />
            </div>

            {/* Sujet : le <select> natif (invisible) reste le vrai contrôle ; la couche visible reprend
                la maquette « libellé  ↓ » avec la flèche juste après le texte. */}
            <div className="flex w-full flex-col gap-2">
              <label htmlFor="contact-motif" className={LABEL}>Sujet</label>
              <div className="relative flex min-h-12 w-full items-center gap-2 rounded-[12px] border border-v3-border bg-white px-4 py-[11px] text-[16px] leading-6 text-v3-navy transition-[border-color,box-shadow] focus-within:border-v3-brand focus-within:shadow-[0_0_0_3px_rgb(123_47_255/20%)]">
                <span aria-hidden="true" className="truncate">{selectedMotif}</span>
                <ArrowDown aria-hidden="true" strokeWidth={1.7} className="size-4 shrink-0" />
                <select
                  id="contact-motif"
                  name="motif"
                  required
                  value={motif}
                  onChange={(e) => setMotifSafe(e.target.value as MotifId)}
                  className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
                >
                  {MOTIFS.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {motif === "partner" && (
              <div className="grid w-full gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="contact-club" className={LABEL}>Nom du club</label>
                  <input
                    type="text"
                    id="contact-club"
                    name="club"
                    autoComplete="organization"
                    required
                    minLength={2}
                    value={clubName}
                    onChange={(e) => setClubNameSafe(e.target.value)}
                    className={FIELD}
                    placeholder="Nom de ta salle ou de ton club"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="contact-city" className={LABEL}>Ville</label>
                  <input
                    type="text"
                    id="contact-city"
                    name="city"
                    autoComplete="address-level2"
                    required
                    value={city}
                    onChange={(e) => setCitySafe(e.target.value)}
                    className={FIELD}
                    placeholder="Ville du club"
                  />
                </div>
              </div>
            )}

            <div className="flex w-full flex-col gap-2">
              <label htmlFor="contact-message" className={LABEL}>Message</label>
              <textarea
                id="contact-message"
                name="message"
                rows={2}
                required
                maxLength={2000}
                value={message}
                onChange={(e) => setMessageSafe(e.target.value)}
                className="block min-h-20 w-full resize-y rounded-[16px] border border-v3-border bg-white px-4 py-[11px] lg:bg-v3-clair text-[16px] leading-6 text-v3-navy transition-[border-color,box-shadow] placeholder:text-v3-ink-muted focus:border-v3-brand focus:shadow-[0_0_0_3px_rgb(123_47_255/20%)] focus:outline-none"
                placeholder="Dis-nous comment on peut t’aider…"
              />
            </div>

            <p className="v3-small text-v3-ink-muted">
              Les informations de ce formulaire servent uniquement à répondre à ta demande.{" "}
              <Link to="/confidentialite" className="underline decoration-v3-ink-muted/40 underline-offset-2 hover:text-v3-navy hover:decoration-v3-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-v3-brand">
                Consulter la confidentialité
              </Link>.
            </p>

            {status === "error" && (
              <FormAlert>
                L’envoi a échoué. Réessaie dans un instant, ou écris-nous directement à{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold underline underline-offset-2">{CONTACT_EMAIL}</a>.
              </FormAlert>
            )}

            {/* Annonce du statut d'envoi aux lecteurs d'écran */}
            <span className="sr-only" role="status">
              {status === "loading" ? "Envoi du message en cours" : ""}
            </span>

            <Button type="submit" disabled={status === "loading"} aria-busy={status === "loading"} className="w-full lg:w-auto">
              {status === "loading" ? "Envoi en cours…" : "Envoyer mon message"}
            </Button>
          </form>

          {/* Contact direct */}
          <div className="flex w-full flex-col items-start gap-6">
            <h2 className="text-[32px] font-semibold leading-[38px] text-v3-navy lg:text-[48px] lg:leading-[54px] lg:tracking-[-1px]">
              Écris à l’équipe MMA IQ.
            </h2>
            <p className="v3-body text-v3-ink-muted">Pour l’application et les formations, un projet de club ou une demande presse.</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="v3-subheading break-all text-v3-navy underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-v3-brand"
            >
              {CONTACT_EMAIL}
            </a>
            <hr className="h-px w-full border-0 bg-v3-border lg:w-[400px] lg:max-w-full" />
            <p className="v3-label text-v3-ink-muted">TU GÈRES UNE SALLE ?</p>
            <p className="v3-body text-v3-ink-muted">Découvre le programme dédié aux clubs et aux salles partenaires.</p>
            <ButtonLink to="/partenaires">Programme partenaires</ButtonLink>
          </div>
        </div>
      </Section>

      {/* 03 · Aide et ressources */}
      <Section tone="accent" className="py-12 lg:py-[72px]" innerClassName="flex flex-col items-start gap-6 lg:gap-10">
        <h2 className="text-[36px] font-medium leading-10 tracking-[-1.08px] text-white lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]">
          Retrouve une réponse<br />dans le centre d’aide.
        </h2>
        <p className="v3-body text-white lg:max-w-[850px]">
          Retrouve les réponses sur l’application, ton abonnement et les formations dans notre centre d’aide.
        </p>
        <ButtonLink to="/aide">Consulter l’aide</ButtonLink>
      </Section>

      {/* Contact · Message envoyé */}
      <Dialog open={status === "success"} onClose={() => setStatus("idle")} labelledBy={successTitleId} panelClassName="max-w-[560px]">
        <div className="flex flex-col items-start gap-6 rounded-[16px] bg-v3-clair p-6 text-v3-navy max-sm:-mx-6 lg:p-12">
          <p className="v3-label text-v3-ink-muted">MESSAGE ENVOYÉ</p>
          <h2 id={successTitleId} className={ACCOUNT_TITLE}>Merci pour<br />ton message.</h2>
          <p className="v3-body text-v3-ink-muted">
            L’équipe MMA IQ reviendra vers toi par e-mail. Tu peux continuer à découvrir l’application.
          </p>
          <ButtonLink to="/application">Découvrir l’application</ButtonLink>
          <Button onClick={() => setStatus("idle")}>Revenir au formulaire</Button>
        </div>
      </Dialog>
    </>
  );
}
