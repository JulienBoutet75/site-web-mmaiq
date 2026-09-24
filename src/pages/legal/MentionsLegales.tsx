// TRAME À FAIRE VALIDER PAR UN AVOCAT AVANT MISE EN LIGNE
// Mise en page Figma « Mentions légales » (2114:6870 / 2174:22615) ; texte juridique inchangé.
import { Seo } from "../../components/Seo";
import { CONTACT_EMAIL, SITE_URL } from "../../data/site";
import { LEGAL_COMPANY, LEGAL_UPDATED_AT } from "../../data/legal";
import { Bullets, LegalArticle, LegalDocument, TextLink, Todo } from "./LegalDocument";

const SECTIONS = [
  { id: "editeur", title: "1. Éditeur du site" },
  { id: "hebergement", title: "2. Hébergement" },
  { id: "propriete-intellectuelle", title: "3. Propriété intellectuelle" },
  { id: "donnees-personnelles", title: "4. Données personnelles et stockage local" },
  { id: "contact", title: "5. Contact" },
];

export function MentionsLegales() {
  return (
    <>
      <Seo
        title="Mentions légales – MMA IQ"
        description="Mentions légales du site MMA IQ : éditeur, hébergeur, propriété intellectuelle."
        canonicalPath="/mentions-legales"
      />
      <LegalDocument
        title="Mentions légales"
        preamble={
          <>
            Conformément à l’article 1-1 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans
            l’économie numérique (LCEN). Dernière mise à jour : {LEGAL_UPDATED_AT}.
          </>
        }
        sections={SECTIONS}
        related={[
          { label: "Confidentialité", to: "/confidentialite" },
          { label: "Conditions générales", to: "/cgv" },
          { label: "Contact", to: "/contact", variant: "light" },
        ]}
      >
        <LegalArticle id="editeur" title="1. Éditeur du site">
          <p>Le site {SITE_URL} (ci-après « le Site ») est édité par :</p>
          <Bullets>
            <li>Raison sociale : {LEGAL_COMPANY.name}</li>
            <li>Forme juridique : {LEGAL_COMPANY.legalForm}</li>
            <li>Capital social : {LEGAL_COMPANY.shareCapital}</li>
            <li>Siège social : {LEGAL_COMPANY.registeredOffice}</li>
            <li>Immatriculation : <Todo>n° SIREN et ville du RCS</Todo></li>
            <li>N° de TVA intracommunautaire : <Todo>numéro de TVA</Todo></li>
            <li>Téléphone : <Todo>numéro de téléphone public de la société</Todo></li>
            <li>
              Email de contact : <TextLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</TextLink>
            </li>
          </Bullets>
          <p>Direction de la publication : {LEGAL_COMPANY.publicationDirectorStatus}.</p>
        </LegalArticle>

        <LegalArticle id="hebergement" title="2. Hébergement">
          <p>
            Le Site est hébergé par : <Todo>raison sociale de l'hébergeur, adresse complète, numéro de
            téléphone</Todo>.
          </p>
          <p>
            Les données du Site (base de données, comptes utilisateurs, contenus vidéo) sont hébergées
            par Supabase —{" "}
            <Todo>confirmer l'entité contractante, son adresse et la région d'hébergement effective
            du projet Supabase</Todo>.
          </p>
        </LegalArticle>

        <LegalArticle id="propriete-intellectuelle" title="3. Propriété intellectuelle">
          <p>
            La marque « MMA IQ », le logo, la charte graphique, l'architecture du Site ainsi que
            l'ensemble des contenus qui y sont publiés (textes, visuels, vidéos, éléments d'interface,
            base de données) sont protégés par le droit de la propriété intellectuelle et sont la
            propriété exclusive de l'éditeur ou font l'objet d'une licence à son profit.{" "}
            <Todo>préciser le statut de la marque : déposée à l'INPI ou non, n° de dépôt</Todo>
          </p>
          <p>
            Les formations vidéo proposées sur le Site sont réalisées par des coachs partenaires. Les
            droits d'exploitation de ces contenus sont détenus par l'éditeur ou concédés par leurs
            auteurs dans le cadre de contrats dédiés. Toute reproduction, représentation, diffusion,
            extraction ou réutilisation, totale ou partielle, de ces contenus sans autorisation écrite
            préalable est interdite et constitue une contrefaçon sanctionnée par les articles L335-2 et
            suivants du Code de la propriété intellectuelle.
          </p>
          <p>
            L'accès aux formations achetées est strictement personnel : le partage de compte ou la
            rediffusion des vidéos, à titre gratuit ou onéreux, sont interdits.
          </p>
        </LegalArticle>

        <LegalArticle id="donnees-personnelles" title="4. Données personnelles et stockage local">
          <p>
            Le traitement des données personnelles collectées via le Site est décrit dans notre{" "}
            <TextLink to="/confidentialite">Politique de confidentialité</TextLink>, qui détaille
            également l'usage du stockage local du navigateur (le Site n'utilise pas de cookies
            publicitaires).
          </p>
        </LegalArticle>

        <LegalArticle id="contact" title="5. Contact">
          <p>
            Pour toute question relative au Site, vous pouvez nous écrire à{" "}
            <TextLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</TextLink> ou via la page{" "}
            <TextLink to="/contact">Contact</TextLink>.
          </p>
        </LegalArticle>
      </LegalDocument>
    </>
  );
}
