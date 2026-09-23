import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Seo } from "../components/Seo";
import { findEquipementCategorie } from "../data/equipement";
import { CONTACT_EMAIL } from "../data/site";
import { submitLead } from "../lib/supabase";
import { Dialog, useDialogTitleId } from "../v3/Dialog";
import { Button, ButtonLink, Section } from "../v3/ui";

// Figma « Demande équipement · Desktop · Vue complète » (2114:22117) et « Mobile » (2174:23313).
// Confirmation : cadre « Contact · Message envoyé » (2093:5003 / 2093:5022), ouvert après l’envoi.

type Status = "idle" | "loading" | "success" | "error";

/** Champ de saisie sur fond sombre (composant Figma « Input », fond Surface, rayon 12). */
const INPUT_CLASS =
  "block w-full min-w-0 rounded-[12px] border border-v3-border bg-v3-surface px-[15px] py-[11px] text-[16px] leading-6 text-white placeholder:text-v3-muted transition-[border-color,box-shadow] duration-150 focus:border-v3-lavender focus:shadow-[0_0_0_3px_rgb(201_169_255/25%)] focus:outline-none";

/** Titre de section : 36/40 Medium −1,08 px sur mobile, 48/54 SemiBold −1 px sur desktop. */
const SECTION_TITLE = "text-[36px] font-medium leading-[40px] tracking-[-1.08px] lg:text-[48px] lg:font-semibold lg:leading-[54px] lg:tracking-[-1px]";

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={id} className="v3-label text-white">{label}</label>
      {children}
    </div>
  );
}

export function DemandeEquipement() {
  // Catégorie transmise depuis une fiche collection (?categorie=protections).
  const [searchParams] = useSearchParams();
  const categorie = findEquipementCategorie(searchParams.get("categorie"));

  const [piece, setPiece] = useState(categorie?.name ?? "");
  const [taille, setTaille] = useState("");
  const [quantite, setQuantite] = useState("");
  const [besoin, setBesoin] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  // Pot de miel anti-robots : champ invisible qu’un humain ne remplit jamais.
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const titleId = useDialogTitleId("demande-envoyee");

  const resetFields = () => {
    setPiece(categorie?.name ?? "");
    setTaille("");
    setQuantite("");
    setBesoin("");
    setName("");
    setEmail("");
    setWebsite("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (status === "loading") return;

    // Robot détecté : on simule le succès sans rien envoyer.
    if (website.trim()) {
      resetFields();
      setStatus("success");
      return;
    }

    setStatus("loading");
    const message = [
      "[Demande équipement]",
      categorie && `Catégorie : ${categorie.name}`,
      `Équipement recherché : ${piece.trim()}`,
      taille.trim() && `Taille souhaitée : ${taille.trim()}`,
      quantite.trim() && `Quantité : ${quantite.trim()}`,
      besoin.trim() && `Besoin : ${besoin.trim()}`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await submitLead({ type: "contact", email: email.trim(), name: name.trim(), message });
      resetFields();
      setStatus("success");
    } catch (error) {
      console.error("Demande équipement :", error);
      setStatus("error");
    }
  };

  const loading = status === "loading";

  return (
    <>
      <Seo
        title="Demande d’équipement Bar Tack × MMA IQ — MMA IQ"
        description="Précise l’équipement Bar Tack × MMA IQ que tu recherches, ta taille et la quantité : l’équipe MMA IQ te répond sur les modèles, prix et disponibilités avant tout engagement."
        canonicalPath="/equipement/demande"
      />

      {/* 01 · Introduction */}
      <Section tone="fond" className="py-8 lg:py-12" innerClassName="flex flex-col gap-6 lg:gap-10">
        <p className="v3-label text-v3-muted">BAR TACK × MMA IQ</p>
        <h1 className="text-[32px] font-semibold leading-[38px] text-white lg:text-[40px] lg:leading-[46px]">Prépare ta demande.</h1>
        <p className="v3-body text-v3-muted lg:max-w-[720px]">Ton besoin et tes coordonnées, au même endroit.</p>
      </Section>

      {/* 02 · Formulaire de demande */}
      <Section tone="fond" className="py-8 lg:py-12" innerClassName="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12 xl:gap-20">
        <form
          onSubmit={handleSubmit}
          aria-label="Demande d’équipement"
          className="flex w-full flex-col items-start gap-6 bg-v3-fond lg:order-2 lg:w-[760px] lg:min-w-0 lg:shrink"
        >
          <Field id="demande-piece" label="Équipement recherché">
            <input
              id="demande-piece"
              name="piece"
              type="text"
              required
              maxLength={200}
              value={piece}
              onChange={(event) => setPiece(event.target.value)}
              placeholder="Modèle ou type de pièce"
              className={INPUT_CLASS}
            />
          </Field>
          <Field id="demande-taille" label="Taille souhaitée">
            <input
              id="demande-taille"
              name="taille"
              type="text"
              maxLength={100}
              value={taille}
              onChange={(event) => setTaille(event.target.value)}
              placeholder="Ta taille habituelle, ou à préciser"
              className={INPUT_CLASS}
            />
          </Field>
          <Field id="demande-quantite" label="Quantité">
            <input
              id="demande-quantite"
              name="quantite"
              type="text"
              inputMode="numeric"
              maxLength={40}
              value={quantite}
              onChange={(event) => setQuantite(event.target.value)}
              placeholder="Nombre de pièces souhaité"
              className={INPUT_CLASS}
            />
          </Field>
          <Field id="demande-besoin" label="Précise ton besoin">
            <textarea
              id="demande-besoin"
              name="besoin"
              rows={2}
              maxLength={2000}
              value={besoin}
              onChange={(event) => setBesoin(event.target.value)}
              placeholder="Usage, modèle ou question sur une taille…"
              className={`${INPUT_CLASS} min-h-20 resize-y rounded-[16px]`}
            />
          </Field>
          <Field id="demande-nom" label="Nom">
            <input
              id="demande-nom"
              name="name"
              type="text"
              required
              autoComplete="name"
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Prénom et nom"
              className={INPUT_CLASS}
            />
          </Field>
          <Field id="demande-email" label="E-mail">
            <input
              id="demande-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              maxLength={200}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="toi@exemple.fr"
              className={INPUT_CLASS}
            />
          </Field>

          {/* Pot de miel : masqué aux humains et aux lecteurs d’écran */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="demande-website">Site web</label>
            <input id="demande-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
          </div>

          <p className="v3-small text-v3-muted lg:max-w-[680px]">
            Tes coordonnées servent uniquement à répondre à ta demande.{" "}
            <Link to="/confidentialite" className="underline underline-offset-4 hover:text-white">Confidentialité</Link>
          </p>

          {status === "error" && (
            <p role="alert" className="v3-small -mt-2 text-[#ffb4c0]">
              L’envoi n’a pas abouti. Réessaie dans un instant ou écris-nous à{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4">{CONTACT_EMAIL}</a>.
            </p>
          )}

          <Button type="submit" disabled={loading} aria-busy={loading}>
            {loading ? "Envoi en cours…" : "Envoyer ma demande"}
          </Button>
        </form>

        {/* Contact direct */}
        <div className="flex w-full flex-col items-start gap-6 bg-v3-fond lg:order-1 lg:w-[360px] lg:shrink-0 xl:w-[440px]">
          <h2 className="v3-heading text-white">Trouvons la bonne pièce.</h2>
          <p className="v3-body text-v3-muted lg:max-w-[400px]">
            Précise l’équipement recherché. Les modèles, prix et disponibilités seront confirmés avant tout engagement.
          </p>
          <div aria-hidden="true" className="h-px w-full bg-v3-border lg:max-w-[400px]" />
          <p className="v3-label text-v3-muted">LA COLLECTION</p>
          <p className="v3-body text-v3-muted lg:max-w-[400px]">Reviens à la collection pour retrouver les catégories et les pièces.</p>
          <ButtonLink to="/equipement#collection">Retour à la collection</ButtonLink>
        </div>
      </Section>

      {/* 03 · Aide et ressources */}
      <Section tone="fond" className="py-12 lg:py-[72px]" innerClassName="flex flex-col items-start gap-6 lg:gap-10">
        <h2 className={`${SECTION_TITLE} text-white`}>Retrouve une réponse<br />dans le centre d’aide.</h2>
        <p className="v3-body text-v3-muted lg:max-w-[850px]">
          Retrouve les réponses sur l’application, ton abonnement et les formations dans notre centre d’aide.
        </p>
        <ButtonLink to="/aide">Consulter l’aide</ButtonLink>
      </Section>

      {/* Confirmation d’envoi */}
      <Dialog
        open={status === "success"}
        onClose={() => setStatus("idle")}
        labelledBy={titleId}
        panelClassName="flex max-w-[560px] flex-col items-start gap-6 rounded-[16px] bg-v3-clair p-6 text-v3-navy max-sm:-mx-6 max-sm:w-[calc(100%+48px)] sm:p-12"
      >
        <p className="v3-label text-v3-ink-muted">MESSAGE ENVOYÉ</p>
        <h2 id={titleId} className={`${SECTION_TITLE} text-v3-navy`}>Merci pour<br />ton message.</h2>
        <p className="v3-body text-v3-ink-muted">
          L’équipe MMA IQ reviendra vers toi par e-mail. Tu peux continuer à découvrir l’application.
        </p>
        <ButtonLink to="/application">Découvrir l’application</ButtonLink>
        <Button onClick={() => setStatus("idle")}>Revenir au formulaire</Button>
      </Dialog>
    </>
  );
}
