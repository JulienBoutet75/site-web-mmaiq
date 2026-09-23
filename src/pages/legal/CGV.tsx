// TRAME À FAIRE VALIDER PAR UN AVOCAT AVANT MISE EN LIGNE
// Mise en page Figma « Conditions générales » (2114:20512 / 2174:22765) ; texte juridique inchangé.
import { Seo } from "../../components/Seo";
import { CONTACT_EMAIL, SITE_URL } from "../../data/site";
import { LEGAL_COMPANY, LEGAL_UPDATED_AT } from "../../data/legal";
import { Bullets, LegalArticle, LegalDocument, TextLink, Todo } from "./LegalDocument";

const SECTIONS = [
  { id: "objet", title: "1. Objet" },
  { id: "vendeur", title: "2. Identité du vendeur" },
  { id: "offres", title: "3. Description des offres" },
  { id: "compte", title: "4. Compte et accès aux contenus achetés" },
  { id: "paiement", title: "5. Commande et paiement" },
  { id: "retractation", title: "6. Fourniture du contenu numérique et droit de rétractation" },
  { id: "resiliation", title: "7. Durée et résiliation des abonnements" },
  { id: "salles-partenaires", title: "8. Programme salles partenaires" },
  { id: "sante", title: "9. Avertissement — pratique sportive et santé" },
  { id: "propriete-intellectuelle", title: "10. Propriété intellectuelle et licence d'utilisation" },
  { id: "responsabilite", title: "11. Responsabilité" },
  { id: "donnees-personnelles", title: "12. Données personnelles" },
  { id: "reclamations", title: "13. Réclamations et médiation de la consommation" },
  { id: "droit-applicable", title: "14. Droit applicable et litiges" },
  { id: "modification", title: "15. Modification des CGV/CGU" },
];

export function CGV() {
  const email = <TextLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</TextLink>;
  return (
    <>
      <Seo
        title="CGV / CGU – MMA IQ"
        description="Conditions générales de vente et d'utilisation de MMA IQ : abonnements, formations vidéo, paiement, résiliation."
        canonicalPath="/cgv"
      />
      <LegalDocument
        title="Conditions générales de vente et d'utilisation"
        preamble={
          <>
            Dernière mise à jour : {LEGAL_UPDATED_AT}. En vigueur à compter du{" "}
            <Todo>date d'entrée en vigueur à confirmer</Todo>. Toute commande sur le site
            implique l'acceptation sans réserve des présentes conditions.
          </>
        }
        sections={SECTIONS}
        related={[
          { label: "Mentions légales", to: "/mentions-legales" },
          { label: "Confidentialité", to: "/confidentialite" },
          { label: "Contact", to: "/contact", variant: "light" },
        ]}
      >
        <LegalArticle id="objet" title="1. Objet">
          <p>
            Les présentes conditions générales de vente et d'utilisation (« CGV/CGU ») régissent
            l'accès au site {SITE_URL} (« le Site »), la vente des abonnements MMA IQ et des formations
            vidéo à l'unité, ainsi que l'utilisation des services associés, entre l'éditeur du Site
            (« MMA IQ », « nous ») et toute personne effectuant un achat ou utilisant le Site
            (« le Client », « vous »).
          </p>
        </LegalArticle>

        <LegalArticle id="vendeur" title="2. Identité du vendeur">
          <p>
            {LEGAL_COMPANY.name}, {LEGAL_COMPANY.legalForm}, au capital de {LEGAL_COMPANY.shareCapital},
            dont le siège social est situé au {LEGAL_COMPANY.registeredOffice}.
          </p>
          <Bullets>
            <li>Immatriculation : <Todo>n° SIREN et ville du RCS</Todo></li>
            <li>N° de TVA intracommunautaire : <Todo>numéro de TVA</Todo></li>
          </Bullets>
          <p>
            Email : {email} — voir aussi les <TextLink to="/mentions-legales">mentions légales</TextLink>.
          </p>
        </LegalArticle>

        <LegalArticle id="offres" title="3. Description des offres">
          <p>
            Abonnements MMA IQ — accès aux fonctionnalités de l'application d'entraînement MMA IQ selon
            le plan choisi, tel que détaillé sur la page <TextLink to="/tarifs">Tarifs</TextLink> :
          </p>
          <Bullets>
            <li>Free — 0 € (version limitée gratuite) ;</li>
            <li>Essentiel — 6,99 € / mois ou 69,99 € / an ;</li>
            <li>Performance — 10,99 € / mois ou 109,99 € / an ;</li>
            <li>Elite — 20,99 € / mois ou 209,99 € / an ;</li>
            <li>Coach Suite — 20,99 € / mois ou 209,99 € / an (offre destinée aux coachs).</li>
          </Bullets>
          <p>
            L'application MMA IQ est déjà disponible sur l'App Store pour iOS et sur Google Play pour
            Android. L'abonnement peut être souscrit sur le web ; le détail des fonctionnalités de
            chaque plan figure sur la page Tarifs.
          </p>
          <p>
            Formations vidéo à l'unité — contenus vidéo réalisés par des coachs, vendus
            individuellement au prix indiqué sur chaque fiche formation, avec accès en ligne illimité
            dans le temps depuis l'espace « Mes formations ».{" "}
            <Todo>confirmer la durée d'accès garantie aux formations achetées (« illimité » engage en
            cas d'arrêt du service)</Todo>
          </p>
          <p>
            Tous les prix sont indiqués en euros, toutes taxes comprises (TTC). Nous nous réservons le
            droit de modifier nos prix à tout moment ; le prix applicable est celui affiché au jour de
            la commande, et toute évolution du prix d'un abonnement en cours est notifiée au préalable
            au Client, qui peut résilier avant son application.
          </p>
        </LegalArticle>

        <LegalArticle id="compte" title="4. Compte et accès aux contenus achetés">
          <p>
            L'accès à une formation achetée s'effectue depuis la page « Mes formations », en étant
            connecté avec l'adresse email utilisée lors de l'achat. L'accès est activé immédiatement
            après confirmation du paiement. Aucun email de confirmation n'est envoyé : la confirmation
            s'affiche à l'écran à l'issue du paiement.
          </p>
          <p>
            Un accès à une formation peut également être accordé au moyen d'un code d'accès remis par
            un coach partenaire ; ce code est validé en ligne et rattache la formation au compte
            utilisé.
          </p>
          <p>
            Le Client est responsable de l'exactitude de l'adresse email fournie lors de l'achat et de
            la confidentialité de ses identifiants. L'accès aux contenus est strictement personnel :
            partage de compte, revente d'accès, téléchargement ou rediffusion des vidéos sont interdits
            (voir article 10).
          </p>
        </LegalArticle>

        <LegalArticle id="paiement" title="5. Commande et paiement">
          <p>
            Le paiement s'effectue en ligne par carte bancaire via la plateforme sécurisée Stripe. Nous
            n'avons jamais accès à vos données de carte et ne les stockons pas. Le montant est débité
            au moment de la commande (formation à l'unité) ou au début de chaque période d'abonnement.
          </p>
          <p>
            Les abonnements sont à reconduction tacite : ils se renouvellent automatiquement à chaque
            échéance (mensuelle ou annuelle) jusqu'à résiliation.{" "}
            <Todo>pour les abonnements annuels, prévoir l'information avant reconduction prévue à
            l'article L215-1 du Code de la consommation (rappel écrit entre 3 et 1 mois avant
            l'échéance) — mécanisme d'envoi à mettre en place</Todo>
          </p>
          <p>
            En cas d'échec de paiement lors d'un renouvellement, l'accès aux fonctionnalités payantes
            peut être suspendu après notification, jusqu'à régularisation.
          </p>
        </LegalArticle>

        <LegalArticle id="retractation" title="6. Fourniture du contenu numérique et droit de rétractation">
          <p>
            Le consommateur dispose en principe d'un délai de 14 jours à compter de la conclusion
            du contrat pour exercer son droit de rétractation, dans les conditions prévues par le
            Code de la consommation. La seule activation d'un abonnement ne supprime pas ce droit.
          </p>
          <p>
            Pour un abonnement constituant une prestation de services, le commencement avant la fin
            de ce délai nécessite une demande expresse du consommateur. En cas de rétractation,
            un montant proportionnel au service effectivement fourni ne peut être demandé que dans
            les conditions de l'article L221-25. La perte du droit en cas d'exécution complète du
            service reste soumise aux conditions de l'article L221-28, 1°.
          </p>
          <p>
            Pour une formation constituant un contenu numérique sans support matériel, l'exception
            prévue à l'article L221-28, 13° ne s'applique que si le consommateur a préalablement
            consenti expressément au commencement de l'exécution avant la fin du délai, reconnu
            la perte de son droit et reçu la confirmation de cet accord sur un support durable.
            À défaut, le droit de rétractation demeure applicable.
          </p>
          <p>
            <Todo>finaliser le formulaire type et la fonctionnalité de rétractation en ligne prévue
            à l'article L221-21, les confirmations sur support durable et le recueil des accords
            distincts adaptés aux services et aux contenus numériques, avec conservation de la
            preuve ; ne pas appliquer une renonciation générale à tous les achats</Todo>
          </p>
        </LegalArticle>

        <LegalArticle id="resiliation" title="7. Durée et résiliation des abonnements">
          <p>
            Les abonnements sont sans engagement. Le Client peut résilier à tout moment ; la
            résiliation prend effet à la fin de la période en cours (mois ou année déjà payés), sans
            remboursement prorata de la période entamée, sous réserve du droit de rétractation et des
            garanties légales. L'accès aux fonctionnalités payantes est
            maintenu jusqu'à cette date.
          </p>
          <p>
            <Todo>préciser le canal de résiliation (portail client Stripe, espace compte ou demande à{" "}
            {CONTACT_EMAIL}) et mettre en place la fonctionnalité « résiliation en 3 clics » exigée par
            l'article L215-1-1 du Code de la consommation</Todo>
          </p>
          <p>
            Nous pouvons suspendre ou résilier un compte en cas de violation des présentes CGV/CGU
            (notamment partage de compte ou rediffusion de contenus), après mise en demeure restée sans
            effet, sans préjudice de tous dommages et intérêts.
          </p>
        </LegalArticle>

        <LegalArticle id="salles-partenaires" title="8. Programme salles partenaires">
          <p>
            MMA IQ propose aux salles et clubs un programme de partenariat décrit sur la page{" "}
            <TextLink to="/partenaires">Partenaires</TextLink>. La relation entre MMA IQ et chaque
            salle partenaire est régie par un contrat d'apporteur d'affaires distinct, signé avec la
            salle ; elle n'est pas couverte par les présentes CGV.
          </p>
          <p>
            Pour les membres d'une salle partenaire, une remise (offre de référence : −10 % sur les
            formules Performance et Elite, durée susceptible de varier selon la salle) est appliquée
            automatiquement à l'étape de paiement lors d'une souscription effectuée via la page de la salle ou avec son code. Les conditions
            affichées sur la page de la salle au moment de la souscription font foi.
          </p>
        </LegalArticle>

        <LegalArticle id="sante" title="9. Avertissement — pratique sportive et santé">
          <p>
            Les contenus MMA IQ (programmes d'entraînement, nutrition, préparation, formations
            techniques) concernent une pratique sportive intense et de contact. Ils sont fournis à titre
            informatif et pédagogique et ne constituent ni un avis médical, ni un suivi
            personnalisé par un professionnel de santé.
          </p>
          <p>
            Avant de commencer ou d'intensifier une pratique, consultez un médecin, en particulier en
            cas d'antécédents médicaux, de blessure ou de doute sur votre condition physique. Vous
            pratiquez sous votre propre responsabilité, dans le respect de vos capacités et des règles
            de sécurité de votre discipline et de votre salle.
          </p>
        </LegalArticle>

        <LegalArticle id="propriete-intellectuelle" title="10. Propriété intellectuelle et licence d'utilisation">
          <p>
            L'achat d'un abonnement ou d'une formation confère au Client une licence d'utilisation
            personnelle, non exclusive, non cessible et non transférable des contenus, pour un usage
            strictement privé. Toute reproduction, téléchargement, extraction, diffusion publique,
            revente ou mise à disposition de tiers, gratuite ou payante, est interdite. Voir également
            les <TextLink to="/mentions-legales">mentions légales</TextLink>.
          </p>
        </LegalArticle>

        <LegalArticle id="responsabilite" title="11. Responsabilité">
          <p>
            Nous nous engageons à fournir le service avec diligence. Le Site et l'application peuvent
            toutefois connaître des interruptions temporaires (maintenance, mise à jour, panne d'un
            prestataire, force majeure). Notre responsabilité ne saurait être engagée pour les dommages
            indirects ou résultant d'une utilisation des contenus non conforme aux présentes CGV/CGU ou
            à l'avertissement de l'article 9, sans préjudice des garanties légales dont bénéficie le
            consommateur (notamment les articles L224-25-1 et suivants du Code de la consommation
            relatifs aux contenus et services numériques), auxquelles il n'est pas dérogé.
          </p>
        </LegalArticle>

        <LegalArticle id="donnees-personnelles" title="12. Données personnelles">
          <p>
            Le traitement des données personnelles est décrit dans notre{" "}
            <TextLink to="/confidentialite">Politique de confidentialité</TextLink>.
          </p>
        </LegalArticle>

        <LegalArticle id="reclamations" title="13. Réclamations et médiation de la consommation">
          <p>
            Pour toute réclamation, contactez-nous d'abord à {email}. Nous mettons tout en œuvre pour
            répondre sous <Todo>délai, ex. 14 jours</Todo>.
          </p>
          <p>
            Conformément aux articles L612-1 et suivants du Code de la consommation, à défaut de
            résolution amiable, le consommateur peut recourir gratuitement à un médiateur de la
            consommation : <Todo>adhérer à un dispositif de médiation de la consommation (obligation
            légale) et indiquer ici le nom, le site et les coordonnées du médiateur retenu</Todo>.
          </p>
        </LegalArticle>

        <LegalArticle id="droit-applicable" title="14. Droit applicable et litiges">
          <p>
            Les présentes CGV/CGU sont soumises au droit français. En cas de litige, et après tentative
            de résolution amiable, les tribunaux français seront compétents. Le consommateur peut
            saisir, à son choix, l'une des juridictions territorialement compétentes en vertu du Code
            de procédure civile, ou la juridiction du lieu où il demeurait au moment de la conclusion
            du contrat ou de la survenance du fait dommageable.
          </p>
        </LegalArticle>

        <LegalArticle id="modification" title="15. Modification des CGV/CGU">
          <p>
            Nous pouvons modifier les présentes CGV/CGU à tout moment. La version applicable à une
            commande est celle en vigueur au jour de la commande. Pour les abonnements en cours, toute
            modification substantielle est notifiée au Client, qui peut résilier avant son entrée en
            vigueur s'il la refuse.
          </p>
        </LegalArticle>
      </LegalDocument>
    </>
  );
}
