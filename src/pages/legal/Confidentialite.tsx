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

export function Confidentialite() {
  return (
    <div className="bg-[var(--color-bg-base)] text-white min-h-screen pt-32 pb-24 px-6">
      <Seo
        title="Politique de confidentialité – MMA IQ"
        description="Comment MMA IQ collecte, utilise et protège vos données personnelles (RGPD)."
        canonicalPath="/confidentialite"
      />
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-display-lg uppercase tracking-wide leading-[0.95] mb-4">
          Politique de confidentialité
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] font-body mb-12">
          Informations fournies conformément aux articles 13 et 14 du Règlement (UE) 2016/679 (RGPD) et
          à la loi Informatique et Libertés. Dernière mise à jour : <Todo>date de mise en ligne</Todo>.
        </p>

        <Article title="1. Responsable de traitement">
          <p>
            Le responsable du traitement des données collectées sur le site {SITE_URL} est :{" "}
            <Todo>raison sociale, siège social — reprendre les informations des mentions légales</Todo>.
          </p>
          <p>
            Contact pour toute question relative aux données personnelles :{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-accent-primary)] hover:underline">
              {CONTACT_EMAIL}
            </a>
            . <Todo>indiquer si un DPO est désigné ; à défaut, supprimer cette mention</Todo>
          </p>
        </Article>

        <Article title="2. Données collectées">
          <p>Nous ne collectons que les données que vous nous transmettez ou strictement nécessaires au service :</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-white">Formulaires du site</strong> — formulaire de contact (nom,
              email, message), inscription à la newsletter (email), liste d'attente de l'application
              (email et, le cas échéant, code de salle partenaire), candidature de salle partenaire
              (nom du club, ville, nom du contact, email, message). Ces données sont enregistrées dans
              notre base de données (Supabase).
            </li>
            <li>
              <strong className="text-white">Compte utilisateur</strong> — adresse email et mot de passe
              (stocké sous forme hachée par notre prestataire d'authentification Supabase), ainsi que
              les données de profil associées.
            </li>
            <li>
              <strong className="text-white">Achats</strong> — le paiement est intégralement traité par
              Stripe : nous ne stockons jamais vos données de carte bancaire. Nous conservons
              l'email utilisé lors de l'achat, le contenu acheté (formation ou abonnement) et les
              références techniques de la transaction, afin de vous donner accès à vos achats et de
              respecter nos obligations comptables.
            </li>
            <li>
              <strong className="text-white">Données techniques</strong> — journaux serveur (logs)
              nécessaires à la sécurité et au bon fonctionnement du service.
            </li>
          </ul>
          <p>
            Le site ne collecte aucune donnée de santé. Les contenus liés à la préparation physique ou
            à la nutrition sont fournis à titre informatif, sans collecte de données médicales.
          </p>
        </Article>

        <Article title="3. Finalités et bases légales">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-white">Répondre à vos demandes</strong> (contact, candidature de
              salle partenaire) — base légale : mesures précontractuelles et intérêt légitime.
            </li>
            <li>
              <strong className="text-white">Vous informer du lancement de l'application</strong>{" "}
              (liste d'attente) et <strong className="text-white">vous adresser la newsletter</strong> —
              base légale : consentement, retirable à tout moment.
            </li>
            <li>
              <strong className="text-white">Fournir le service acheté</strong> (compte, accès aux
              formations et à l'abonnement, page « Mes formations ») — base légale : exécution du
              contrat.
            </li>
            <li>
              <strong className="text-white">Attribuer les parrainages aux salles partenaires</strong>{" "}
              (code de salle associé à une pré-inscription ou un abonnement) — base légale : intérêt
              légitime (rémunération des partenaires apporteurs).
            </li>
            <li>
              <strong className="text-white">Facturation et comptabilité</strong> — base légale :
              obligation légale.
            </li>
            <li>
              <strong className="text-white">Sécurité et prévention de la fraude</strong> — base
              légale : intérêt légitime.
            </li>
          </ul>
        </Article>

        <Article title="4. Durées de conservation">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Prospects (contact, newsletter, liste d'attente) :{" "}
              <Todo>durée, ex. 3 ans à compter du dernier contact</Todo>.
            </li>
            <li>
              Compte utilisateur : pendant la durée de vie du compte, puis{" "}
              <Todo>durée après suppression du compte, ex. suppression sous 30 jours</Todo>.
            </li>
            <li>
              Données de facturation et pièces comptables : 10 ans (obligation légale).
            </li>
            <li>
              Journaux serveur : <Todo>durée, ex. 12 mois</Todo>.
            </li>
          </ul>
        </Article>

        <Article title="5. Destinataires et sous-traitants">
          <p>
            Vos données ne sont ni vendues ni louées. Elles sont accessibles à notre équipe et à nos
            sous-traitants techniques, dans la stricte mesure nécessaire :
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-white">Supabase</strong> (Supabase, Inc.) — hébergement de la base
              de données, authentification des comptes et stockage des contenus.{" "}
              <Todo>région d'hébergement du projet, ex. Union européenne</Todo>.
            </li>
            <li>
              <strong className="text-white">Stripe</strong> (Stripe Payments Europe, Ltd.) — traitement
              sécurisé des paiements. Stripe agit comme responsable de traitement pour les données de
              paiement ; voir sa politique de confidentialité.
            </li>
            <li>
              <strong className="text-white">Hébergeur du site</strong> —{" "}
              <Todo>nom de l'hébergeur du serveur web</Todo>.
            </li>
          </ul>
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
        </Article>

        <Article title="6. Cookies et stockage local">
          <p>
            Le site n'utilise ni cookies publicitaires, ni traceurs tiers, ni outil de mesure
            d'audience. Seul le stockage local de votre navigateur (localStorage) est utilisé, pour des
            fonctions strictement nécessaires au service :
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-white">Session de connexion</strong> — jetons d'authentification
              Supabase permettant de rester connecté à votre compte (et session « coach » pour les
              coachs disposant d'une clé d'accès).
            </li>
            <li>
              <strong className="text-white">Code de parrainage</strong> (clé <code>mmaiq_ref</code>) —
              lorsque vous arrivez via la page d'une salle partenaire ou un lien de parrainage, le code
              de la salle est conservé localement pendant 60 jours afin d'attribuer votre inscription à
              cette salle.
            </li>
          </ul>
          <p>
            Ces stockages étant nécessaires à la fourniture du service, ils ne requièrent pas de
            bandeau de consentement. <Todo>faire confirmer par l'avocat la qualification « strictement
            nécessaire » du code de parrainage ; prévoir un bandeau si un outil de mesure d'audience ou
            tout traceur non essentiel est ajouté</Todo>
          </p>
        </Article>

        <Article title="7. Vos droits">
          <p>
            Conformément au RGPD, vous disposez des droits d'accès, de rectification, d'effacement, de
            limitation du traitement, d'opposition et de portabilité de vos données, ainsi que du droit
            de retirer votre consentement à tout moment (sans remettre en cause les traitements déjà
            effectués) et du droit de définir des directives sur le sort de vos données après votre
            décès.
          </p>
          <p>
            Pour exercer ces droits, écrivez-nous à{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-accent-primary)] hover:underline">
              {CONTACT_EMAIL}
            </a>
            . Nous répondons dans un délai d'un mois. Si vous estimez que vos droits ne sont pas
            respectés, vous pouvez saisir la CNIL (www.cnil.fr).
          </p>
        </Article>

        <Article title="8. Sécurité">
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles adaptées : chiffrement
            des échanges (HTTPS), mots de passe hachés, contrôle des accès à la base de données (règles
            RLS), validation des droits côté serveur pour l'accès aux contenus payants, et paiements
            traités exclusivement par Stripe (certifié PCI-DSS).
          </p>
        </Article>

        <Article title="9. Mise à jour de cette politique">
          <p>
            Cette politique peut être mise à jour pour refléter l'évolution du service (notamment le
            lancement de l'application mobile). La date de dernière mise à jour figure en haut de page ;
            en cas de changement substantiel, les utilisateurs disposant d'un compte en seront informés.
          </p>
        </Article>

        <nav className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-x-6 gap-y-2 text-sm font-body">
          <Link to="/mentions-legales" className="text-[var(--color-text-secondary)] hover:text-white transition-colors">
            Mentions légales
          </Link>
          <Link to="/cgv" className="text-[var(--color-text-secondary)] hover:text-white transition-colors">
            CGV / CGU
          </Link>
        </nav>
      </div>
    </div>
  );
}
