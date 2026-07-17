// TRAME À FAIRE VALIDER PAR UN AVOCAT AVANT MISE EN LIGNE
import React from "react";
import { Link } from "react-router-dom";
import { Seo } from "../../components/Seo";
import { CONTACT_EMAIL, SITE_URL } from "../../data/site";

// Champ à compléter avant mise en ligne : visible en gold pour ne pas passer inaperçu.
const Todo = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[var(--color-accent-gold)] font-semibold">[À COMPLÉTER : {children}]</span>
);

const Article = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="font-display text-xl md:text-2xl uppercase tracking-wide text-white mb-4">{title}</h2>
    <div className="space-y-4 text-sm md:text-base text-[var(--color-text-secondary)] font-body leading-relaxed">
      {children}
    </div>
  </section>
);

export function CGV() {
  return (
    <div className="bg-[var(--color-bg-base)] text-white min-h-screen pt-32 pb-24 px-6">
      <Seo
        title="CGV / CGU – MMA IQ"
        description="Conditions générales de vente et d'utilisation de MMA IQ : abonnements, formations vidéo, paiement, résiliation."
        canonicalPath="/cgv"
      />
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-display-lg uppercase tracking-wide leading-[0.95] mb-4">
          Conditions générales de vente et d'utilisation
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] font-body mb-12">
          En vigueur à compter du <Todo>date d'entrée en vigueur</Todo>. Toute commande sur le site
          implique l'acceptation sans réserve des présentes conditions.
        </p>

        <Article title="1. Objet">
          <p>
            Les présentes conditions générales de vente et d'utilisation (« CGV/CGU ») régissent
            l'accès au site {SITE_URL} (« le Site »), la vente des abonnements MMA IQ et des formations
            vidéo à l'unité, ainsi que l'utilisation des services associés, entre l'éditeur du Site
            (« MMA IQ », « nous ») et toute personne effectuant un achat ou utilisant le Site
            (« le Client », « vous »).
          </p>
        </Article>

        <Article title="2. Identité du vendeur">
          <p>
            <Todo>raison sociale, forme juridique, capital, siège social, n° SIREN/RCS, n° TVA —
            reprendre les mentions légales</Todo>
          </p>
          <p>
            Email :{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-accent-primary)] hover:underline">
              {CONTACT_EMAIL}
            </a>{" "}
            — voir aussi les{" "}
            <Link to="/mentions-legales" className="text-[var(--color-accent-primary)] hover:underline">
              mentions légales
            </Link>
            .
          </p>
        </Article>

        <Article title="3. Description des offres">
          <p>
            <strong className="text-white">Abonnements MMA IQ</strong> — accès aux fonctionnalités de
            l'application d'entraînement MMA IQ selon le plan choisi, tel que détaillé sur la page{" "}
            <Link to="/tarifs" className="text-[var(--color-accent-primary)] hover:underline">Tarifs</Link> :
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Free — 0 € (version limitée gratuite) ;</li>
            <li>Essentiel — 5,99 € / mois ou 59,90 € / an ;</li>
            <li>Performance — 9,99 € / mois ou 99,90 € / an ;</li>
            <li>Elite — 19,99 € / mois ou 199,90 € / an ;</li>
            <li>Coach Suite — 19,99 € / mois ou 199,90 € / an (offre destinée aux coachs).</li>
          </ul>
          <p>
            L'abonnement peut être souscrit dès maintenant sur le web. L'application mobile (iOS et
            Android) est en cours de lancement : le détail des fonctionnalités de chaque plan figure
            sur la page Tarifs.{" "}
            <Todo>préciser les modalités d'accès au service entre la souscription web et la
            disponibilité de l'application mobile (date indicative de lancement, accès web, information
            du client) — point juridiquement sensible à cadrer avec l'avocat</Todo>
          </p>
          <p>
            <strong className="text-white">Formations vidéo à l'unité</strong> — contenus vidéo réalisés
            par des coachs, vendus individuellement au prix indiqué sur chaque fiche formation, avec
            accès en ligne illimité dans le temps depuis l'espace « Mes formations ».{" "}
            <Todo>confirmer la durée d'accès garantie aux formations achetées (« illimité » engage en
            cas d'arrêt du service)</Todo>
          </p>
          <p>
            Tous les prix sont indiqués en euros, toutes taxes comprises (TTC). Nous nous réservons le
            droit de modifier nos prix à tout moment ; le prix applicable est celui affiché au jour de
            la commande, et toute évolution du prix d'un abonnement en cours est notifiée au préalable
            au Client, qui peut résilier avant son application.
          </p>
        </Article>

        <Article title="4. Compte et accès aux contenus achetés">
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
        </Article>

        <Article title="5. Commande et paiement">
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
        </Article>

        <Article title="6. Fourniture du contenu numérique et droit de rétractation">
          <p>
            Les abonnements et formations constituent des contenus et services numériques fournis sans
            support matériel, dont l'exécution commence immédiatement après le paiement.
          </p>
          <p>
            Conformément à l'article L221-28, 13° du Code de la consommation, le droit de rétractation
            de 14 jours ne peut être exercé pour la fourniture d'un contenu numérique sans support
            matériel dont l'exécution a commencé avant la fin du délai de rétractation, lorsque le
            consommateur a donné son accord préalable exprès pour une exécution immédiate et reconnu
            qu'il perdrait ainsi son droit de rétractation.
          </p>
          <p>
            <Todo>ajouter au parcours de paiement (checkout Stripe ou étape préalable) une case de
            consentement exprès à l'exécution immédiate et à la renonciation au droit de rétractation,
            avec conservation de la preuve — non implémenté à ce jour, indispensable avant mise en
            vente</Todo>
          </p>
        </Article>

        <Article title="7. Durée et résiliation des abonnements">
          <p>
            Les abonnements sont sans engagement. Le Client peut résilier à tout moment ; la
            résiliation prend effet à la fin de la période en cours (mois ou année déjà payés), sans
            remboursement prorata de la période entamée. L'accès aux fonctionnalités payantes est
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
        </Article>

        <Article title="8. Programme salles partenaires">
          <p>
            MMA IQ propose aux salles et clubs un programme de partenariat décrit sur la page{" "}
            <Link to="/partenaires" className="text-[var(--color-accent-primary)] hover:underline">
              Partenaires
            </Link>
            . La relation entre MMA IQ et chaque salle partenaire est régie par un contrat d'apporteur
            d'affaires distinct, signé avec la salle ; elle n'est pas couverte par les présentes CGV.
          </p>
          <p>
            Pour les membres d'une salle partenaire, une remise (offre standard : −20 % pendant 3 mois,
            susceptible de varier selon la salle) est appliquée automatiquement à l'étape de paiement
            lors d'une souscription effectuée via la page de la salle ou avec son code. Les conditions
            affichées sur la page de la salle au moment de la souscription font foi.
          </p>
        </Article>

        <Article title="9. Avertissement — pratique sportive et santé">
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
        </Article>

        <Article title="10. Propriété intellectuelle et licence d'utilisation">
          <p>
            L'achat d'un abonnement ou d'une formation confère au Client une licence d'utilisation
            personnelle, non exclusive, non cessible et non transférable des contenus, pour un usage
            strictement privé. Toute reproduction, téléchargement, extraction, diffusion publique,
            revente ou mise à disposition de tiers, gratuite ou payante, est interdite. Voir également
            les{" "}
            <Link to="/mentions-legales" className="text-[var(--color-accent-primary)] hover:underline">
              mentions légales
            </Link>
            .
          </p>
        </Article>

        <Article title="11. Responsabilité">
          <p>
            Nous nous engageons à fournir le service avec diligence. Le Site et l'application peuvent
            toutefois connaître des interruptions temporaires (maintenance, mise à jour, panne d'un
            prestataire, force majeure). Notre responsabilité ne saurait être engagée pour les dommages
            indirects ou résultant d'une utilisation des contenus non conforme aux présentes CGV/CGU ou
            à l'avertissement de l'article 9, sans préjudice des garanties légales dont bénéficie le
            consommateur (notamment les articles L224-25-1 et suivants du Code de la consommation
            relatifs aux contenus et services numériques), auxquelles il n'est pas dérogé.
          </p>
        </Article>

        <Article title="12. Données personnelles">
          <p>
            Le traitement des données personnelles est décrit dans notre{" "}
            <Link to="/confidentialite" className="text-[var(--color-accent-primary)] hover:underline">
              Politique de confidentialité
            </Link>
            .
          </p>
        </Article>

        <Article title="13. Réclamations et médiation de la consommation">
          <p>
            Pour toute réclamation, contactez-nous d'abord à{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-accent-primary)] hover:underline">
              {CONTACT_EMAIL}
            </a>
            . Nous mettons tout en œuvre pour répondre sous <Todo>délai, ex. 14 jours</Todo>.
          </p>
          <p>
            Conformément aux articles L612-1 et suivants du Code de la consommation, à défaut de
            résolution amiable, le consommateur peut recourir gratuitement à un médiateur de la
            consommation : <Todo>adhérer à un dispositif de médiation de la consommation (obligation
            légale) et indiquer ici le nom, le site et les coordonnées du médiateur retenu</Todo>.
          </p>
        </Article>

        <Article title="14. Droit applicable et litiges">
          <p>
            Les présentes CGV/CGU sont soumises au droit français. En cas de litige, et après tentative
            de résolution amiable, les tribunaux français seront compétents. Le consommateur peut
            saisir, à son choix, l'une des juridictions territorialement compétentes en vertu du Code
            de procédure civile, ou la juridiction du lieu où il demeurait au moment de la conclusion
            du contrat ou de la survenance du fait dommageable.
          </p>
        </Article>

        <Article title="15. Modification des CGV/CGU">
          <p>
            Nous pouvons modifier les présentes CGV/CGU à tout moment. La version applicable à une
            commande est celle en vigueur au jour de la commande. Pour les abonnements en cours, toute
            modification substantielle est notifiée au Client, qui peut résilier avant son entrée en
            vigueur s'il la refuse.
          </p>
        </Article>

        <nav className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-x-6 gap-y-2 text-sm font-body">
          <Link to="/mentions-legales" className="text-[var(--color-text-secondary)] hover:text-white transition-colors">
            Mentions légales
          </Link>
          <Link to="/confidentialite" className="text-[var(--color-text-secondary)] hover:text-white transition-colors">
            Politique de confidentialité
          </Link>
        </nav>
      </div>
    </div>
  );
}
