import React from "react";
import { Link } from "react-router-dom";

// Source unique de vérité FAQ du site : remplace la page /faq et la section FAQ de Home.
// Les items `featured` (4 max) sont affichés sur Home ; la page /faq affiche tout.

export type FaqItem = {
  id: string;
  q: string;
  a: React.ReactNode;
  featured?: boolean;
};

const FaqLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link
    to={to}
    className="text-[var(--color-violet-300)] font-semibold underline underline-offset-4 decoration-[var(--color-violet-300)]/60 hover:text-white hover:decoration-white transition-colors"
  >
    {children}
  </Link>
);

export const faqs: FaqItem[] = [
  {
    id: "c-quoi",
    featured: true,
    q: "MMA IQ, c'est quoi exactement ?",
    a: (
      <p>
        MMA IQ prépare une application pour organiser ton entraînement, ta nutrition et
        ton suivi de progression en MMA. Tu peux déjà en voir des captures réelles et
        t’inscrire pour être prévenu du lancement. L’Academy, un catalogue de formations
        vidéo approfondies, est également en préparation.
      </p>
    ),
  },
  {
    id: "prix",
    featured: true,
    q: "Combien ça coûte ?",
    a: (
      <p>
        L’inscription au lancement est gratuite. Pour l’application, les offres prévues sont
        Free à 0 €, Essentiel à 5,99 €/mois, Performance à 9,99 €/mois et Elite à
        19,99 €/mois, plus Coach Suite à 19,99 €/mois pour les coachs. La facturation
        annuelle permettra d’économiser jusqu’à 17 %. Les formations Academy seront
        vendues à l’unité, en complément. Retrouve les détails sur la page{" "}
        <FaqLink to="/tarifs">tarifs</FaqLink>.
      </p>
    ),
  },
  {
    id: "resiliation",
    q: "Puis-je résilier à tout moment ?",
    a: (
      <p>
        Les abonnements prévus seront annulables à tout moment. La résiliation prendra
        effet à la fin de la période déjà payée. Pour toute demande, tu pourras passer
        par la page <FaqLink to="/contact">contact</FaqLink>. L’inscription à la liste
        d’attente ne souscrit aucun abonnement.
      </p>
    ),
  },
  {
    id: "niveau",
    q: "C'est pour quel niveau ?",
    a: (
      <p>
        L’application est pensée pour les pratiquants de MMA, du débutant au compétiteur,
        avec un profil et des objectifs à renseigner. Coach Suite sera l’offre dédiée aux
        coachs. Les formations Academy préciseront leur niveau et leurs prérequis lors
        de leur publication.
      </p>
    ),
  },
  {
    id: "difference",
    featured: true,
    q: "Quelle différence entre l'application et les formations ?",
    a: (
      <p>
        L’application réunira les outils du quotidien : entraînement, nutrition,
        gameplan et suivi de progression. Ses tutoriels techniques seront inclus selon
        ton plan. Les formations Academy seront des programmes vidéo approfondis,
        vendus séparément à l’unité avec un accès illimité. Elles ne sont pas incluses
        dans l’abonnement à l’application. Le catalogue est en préparation.
      </p>
    ),
  },
  {
    id: "youtube",
    q: "Pourquoi MMA IQ plutôt que YouTube ?",
    a: (
      <p>
        MMA IQ réunit dans un même outil les tutoriels techniques, le planning
        d’entraînement et le suivi de progression. Tu peux regarder les{" "}
        <FaqLink to="/app#product-demos">démonstrations de l’application</FaqLink>
        {" "}pour voir comment ces outils fonctionnent avant son lancement.
      </p>
    ),
  },
  {
    id: "acces-formation",
    q: "Comment accéder à une formation achetée ?",
    a: (
      <p>
        Une fois une formation achetée, connecte-toi avec le compte utilisé lors de
        l’achat pour la retrouver dans <FaqLink to="/mes-formations">Mes formations</FaqLink>.
        L’accès est illimité, sur tous tes appareils. Le catalogue Academy est actuellement
        en préparation.
      </p>
    ),
  },
  {
    id: "salle-membre",
    q: "Ma salle est partenaire : j'ai droit à quoi ?",
    a: (
      <p>
        Le programme prévoit une remise de −20 % pendant 3 mois au lancement. Passe par
        le lien ou le QR code de ta salle pour consulter son offre et rattacher ton
        inscription à ton club. Les conditions sont détaillées sur la page{" "}
        <FaqLink to="/partenaires">partenaires</FaqLink>.
      </p>
    ),
  },
  {
    id: "salle-devenir",
    q: "Je gère une salle ou un club : comment devenir partenaire ?",
    a: (
      <p>
        Le programme de parrainage prévoit un lien et un QR code propres à ta salle,
        une remise pour tes membres et une commission sur les abonnements souscrits
        via ton lien. Tu peux consulter les conditions et déposer ta candidature sur
        la page <FaqLink to="/partenaires">partenaires</FaqLink>.
      </p>
    ),
  },
  {
    id: "remboursement",
    q: "Et si je veux me faire rembourser ?",
    a: (
      <p>
        Pour le contenu numérique, tu disposes du droit de rétractation légal de 14 jours,
        sauf si tu as demandé l'accès immédiat au contenu et renoncé à ce droit au moment de
        l'achat. Dans tous les cas, <FaqLink to="/contact">écris-nous</FaqLink> : on regarde
        ta situation et on trouve une solution.
      </p>
    ),
  },
  {
    id: "paiement",
    q: "Quels moyens de paiement ?",
    a: (
      <p>
        Les paiements par carte bancaire sont gérés par Stripe. L’inscription pour être
        prévenu du lancement est gratuite : aucune carte bancaire n’est demandée.
      </p>
    ),
  },
  {
    id: "francais",
    q: "Les contenus sont-ils en français ?",
    a: (
      <p>
        Oui. L’application et les formations Academy sont pensées pour les pratiquants
        francophones, avec des contenus en français.
      </p>
    ),
  },
  {
    id: "dispo",
    featured: true,
    q: "L'application mobile est-elle disponible ?",
    a: (
      <p>
        Pas encore. L’application iOS et Android est en préparation. Les vidéos du site
        montrent des captures réelles de l’application. Pour recevoir un email lorsqu’elle
        sera disponible, <FaqLink to="/app#download">inscris-toi à la liste d’attente</FaqLink>.
        L’inscription est gratuite et sans engagement.
      </p>
    ),
  },
];
