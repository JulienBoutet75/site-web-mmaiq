// TRAME À FAIRE VALIDER PAR UN AVOCAT AVANT MISE EN LIGNE
// Mise en page Figma « Confidentialité » (2114:20335 / 2174:22684) ; texte juridique inchangé.
import { Seo } from "../../components/Seo";
import { CONTACT_EMAIL, SITE_URL } from "../../data/site";
import { LEGAL_COMPANY, LEGAL_UPDATED_AT } from "../../data/legal";
import { Bullets, LegalArticle, LegalDocument, TextLink, Todo } from "./LegalDocument";

const SECTIONS = [
  { id: "responsable", title: "1. Responsable de traitement" },
  { id: "donnees-collectees", title: "2. Données collectées" },
  { id: "finalites", title: "3. Finalités et bases légales" },
  { id: "conservation", title: "4. Durées de conservation" },
  { id: "destinataires", title: "5. Destinataires et sous-traitants" },
  { id: "cookies", title: "6. Cookies et stockage local" },
  { id: "droits", title: "7. Vos droits" },
  { id: "securite", title: "8. Sécurité" },
  { id: "mise-a-jour", title: "9. Mise à jour de cette politique" },
];

export function Confidentialite() {
  const email = <TextLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</TextLink>;
  return (
    <>
      <Seo
        title="Politique de confidentialité – MMA IQ"
        description="Comment MMA IQ collecte, utilise et protège vos données personnelles (RGPD)."
        canonicalPath="/confidentialite"
      />
      <LegalDocument
        title="Politique de confidentialité"
        preamble={
          <>
            Informations fournies conformément aux articles 13 et 14 du Règlement (UE) 2016/679 (RGPD) et
            à la loi Informatique et Libertés. Dernière mise à jour : {LEGAL_UPDATED_AT}.
          </>
        }
        sections={SECTIONS}
        related={[
          { label: "Mentions légales", to: "/mentions-legales" },
          { label: "Conditions générales", to: "/cgv" },
          { label: "Contact", to: "/contact", variant: "light" },
        ]}
      >
        <LegalArticle id="responsable" title="1. Responsable de traitement">
          <p>
            Le responsable du traitement des données collectées sur le site {SITE_URL} est :{" "}
            {LEGAL_COMPANY.name}, {LEGAL_COMPANY.legalForm}, au capital de {LEGAL_COMPANY.shareCapital},
            dont le siège social est situé au {LEGAL_COMPANY.registeredOffice}.
          </p>
          <p>
            Contact pour toute question relative aux données personnelles : {email}.{" "}
            <Todo>indiquer si un DPO est désigné ; à défaut, supprimer cette mention</Todo>
          </p>
        </LegalArticle>

        <LegalArticle id="donnees-collectees" title="2. Données collectées">
          <p>Nous ne collectons que les données que vous nous transmettez ou strictement nécessaires au service :</p>
          <Bullets>
            <li>
              Formulaires du site — formulaire de contact (nom, email, message), inscription à la
              newsletter et aux actualités de l'application (email et, le cas échéant, code de salle
              partenaire), candidature de salle partenaire (nom du club, ville, nom du contact, email,
              message). Ces données sont enregistrées dans notre base de données (Supabase).
            </li>
            <li>
              Compte utilisateur — adresse email et mot de passe (stocké sous forme hachée par notre
              prestataire d'authentification Supabase), ainsi que les données de profil associées.
            </li>
            <li>
              Achats — le paiement est intégralement traité par Stripe : nous ne stockons jamais vos
              données de carte bancaire. Nous conservons l'email utilisé lors de l'achat, le contenu
              acheté (formation ou abonnement) et les références techniques de la transaction, afin de
              vous donner accès à vos achats et de respecter nos obligations comptables.
            </li>
            <li>
              Données techniques — journaux serveur (logs) nécessaires à la sécurité et au bon
              fonctionnement du service.
            </li>
          </Bullets>
          <p>
            Le site ne collecte aucune donnée de santé. Les contenus liés à la préparation physique ou
            à la nutrition sont fournis à titre informatif, sans collecte de données médicales.
          </p>
        </LegalArticle>

        <LegalArticle id="finalites" title="3. Finalités et bases légales">
          <Bullets>
            <li>
              Répondre à vos demandes (contact, candidature de salle partenaire) — base légale :
              mesures précontractuelles et intérêt légitime.
            </li>
            <li>
              Vous informer des nouveautés de l'application et vous adresser la newsletter — base
              légale : consentement, retirable à tout moment.
            </li>
            <li>
              Fournir le service acheté (compte, accès aux formations et à l'abonnement, page « Mes
              formations ») — base légale : exécution du contrat.
            </li>
            <li>
              Attribuer les parrainages aux salles partenaires (code de salle associé à une inscription
              ou un abonnement) — base légale : intérêt légitime (rémunération des partenaires
              apporteurs).
            </li>
            <li>Facturation et comptabilité — base légale : obligation légale.</li>
            <li>Sécurité et prévention de la fraude — base légale : intérêt légitime.</li>
          </Bullets>
        </LegalArticle>

        <LegalArticle id="conservation" title="4. Durées de conservation">
          <Bullets>
            <li>
              Prospects (contact, newsletter, actualités de l'application) :{" "}
              <Todo>durée, ex. 3 ans à compter du dernier contact</Todo>.
            </li>
            <li>
              Compte utilisateur : pendant la durée de vie du compte, puis{" "}
              <Todo>durée après suppression du compte, ex. suppression sous 30 jours</Todo>.
            </li>
            <li>Données de facturation et pièces comptables : 10 ans (obligation légale).</li>
            <li>Journaux serveur : <Todo>durée, ex. 12 mois</Todo>.</li>
          </Bullets>
        </LegalArticle>

        <LegalArticle id="destinataires" title="5. Destinataires et sous-traitants">
          <p>
            Vos données ne sont ni vendues ni louées. Elles sont accessibles à notre équipe et à nos
            sous-traitants techniques, dans la stricte mesure nécessaire :
          </p>
          <Bullets>
            <li>
              Supabase (Supabase, Inc.) — hébergement de la base de données, authentification des
              comptes et stockage des contenus.{" "}
              <Todo>région d'hébergement du projet, ex. Union européenne</Todo>.
            </li>
            <li>
              Stripe (Stripe Payments Europe, Ltd.) — traitement sécurisé des paiements. Stripe agit
              comme responsable de traitement pour les données de paiement ; voir sa politique de
              confidentialité.
            </li>
            <li>Hébergeur du site — <Todo>nom de l'hébergeur du serveur web</Todo>.</li>
          </Bullets>
          <p>
            Lorsque vous vous abonnez via une salle partenaire, la salle reçoit des relevés agrégés
            (nombre d'abonnés rattachés à son code et montants de commission) mais jamais vos données
            nominatives.
          </p>
          <p>
            Certains prestataires peuvent traiter des données en dehors de l'Union européenne. Dans ce
            cas, les transferts sont encadrés par des garanties appropriées (clauses contractuelles
            types de la Commission européenne). <Todo>vérifier les régions effectives de Supabase et
            Stripe et adapter cette mention</Todo>
          </p>
        </LegalArticle>

        <LegalArticle id="cookies" title="6. Cookies et stockage local">
          <p>
            Le site n'utilise ni cookies publicitaires, ni traceurs tiers, ni outil de mesure
            d'audience. Seul le stockage local de votre navigateur (localStorage) est utilisé, pour des
            fonctions strictement nécessaires au service :
          </p>
          <Bullets>
            <li>
              Session de connexion — jetons d'authentification Supabase permettant de rester connecté
              à votre compte (et session « coach » pour les coachs disposant d'une clé d'accès).
            </li>
            <li>
              Code de parrainage (clé <code className="font-[inherit]">mmaiq_ref</code>) — lorsque vous
              arrivez via la page d'une salle partenaire ou un lien de parrainage, le code de la salle
              est conservé localement pendant 60 jours afin d'attribuer votre inscription à cette salle.
            </li>
          </Bullets>
          <p>
            Ces stockages étant nécessaires à la fourniture du service, ils ne requièrent pas de
            bandeau de consentement. <Todo>faire confirmer par l'avocat la qualification « strictement
            nécessaire » du code de parrainage ; prévoir un bandeau si un outil de mesure d'audience ou
            tout traceur non essentiel est ajouté</Todo>
          </p>
        </LegalArticle>

        <LegalArticle id="droits" title="7. Vos droits">
          <p>
            Conformément au RGPD, vous disposez des droits d'accès, de rectification, d'effacement, de
            limitation du traitement, d'opposition et de portabilité de vos données, ainsi que du droit
            de retirer votre consentement à tout moment (sans remettre en cause les traitements déjà
            effectués) et du droit de définir des directives sur le sort de vos données après votre
            décès.
          </p>
          <p>
            Pour exercer ces droits, écrivez-nous à {email}. Nous répondons dans un délai d'un mois. Si
            vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL (www.cnil.fr).
          </p>
        </LegalArticle>

        <LegalArticle id="securite" title="8. Sécurité">
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles adaptées : chiffrement
            des échanges (HTTPS), mots de passe hachés, contrôle des accès à la base de données (règles
            RLS), validation des droits côté serveur pour l'accès aux contenus payants, et paiements
            traités exclusivement par Stripe (certifié PCI-DSS).
          </p>
        </LegalArticle>

        <LegalArticle id="mise-a-jour" title="9. Mise à jour de cette politique">
          <p>
            Cette politique peut être mise à jour pour refléter l'évolution du site et de
            l'application mobile, déjà disponible sur iOS et Android. La date de dernière mise à jour
            figure en haut de page ; en cas de changement substantiel, les utilisateurs disposant d'un
            compte en seront informés.
          </p>
        </LegalArticle>
      </LegalDocument>
    </>
  );
}
