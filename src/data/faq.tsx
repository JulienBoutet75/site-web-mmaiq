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
    className="text-[var(--color-accent-primary)] font-semibold underline underline-offset-4 decoration-[var(--color-accent-primary)]/40 hover:text-[var(--color-violet-300)] hover:decoration-[var(--color-violet-300)] transition-colors"
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
        Deux choses. Une app de performance qui structure ton quotidien — entraînement,
        nutrition, gameplan, suivi de progression — et un catalogue de formations vidéo
        menées par des coachs reconnus. Le tout pensé pour te faire progresser avec méthode,
        pas au hasard.
      </p>
    ),
  },
  {
    id: "prix",
    featured: true,
    q: "Combien ça coûte ?",
    a: (
      <p>
        L'app existe en version Free, gratuite. Ensuite trois plans : Essentiel à 5,99€/mois,
        Performance à 9,99€/mois et Elite à 19,99€/mois — jusqu'à −17% avec l'abonnement
        annuel — plus Coach Suite à 19,99€/mois pour les coachs. Les formations vidéo
        s'achètent à l'unité, en complément. Compare tout en détail sur la page{" "}
        <FaqLink to="/tarifs">tarifs</FaqLink>.
      </p>
    ),
  },
  {
    id: "resiliation",
    featured: true,
    q: "Puis-je résilier à tout moment ?",
    a: (
      <p>
        Oui. L'abonnement est sans engagement : tu peux l'annuler à tout moment —{" "}
        <FaqLink to="/contact">écris-nous</FaqLink> et on s'en occupe. La résiliation prend
        effet à la fin de la période déjà payée.
      </p>
    ),
  },
  {
    id: "niveau",
    q: "C'est pour quel niveau ?",
    a: (
      <p>
        Tous les niveaux, du débutant au pro. L'app s'adapte à ton profil et tes objectifs,
        et chaque formation indique clairement son niveau et ses prérequis. Tu sais toujours
        où tu mets les pieds.
      </p>
    ),
  },
  {
    id: "difference",
    featured: true,
    q: "Quelle différence entre l'application et les formations ?",
    a: (
      <p>
        L'application est ton outil quotidien : entraînement, nutrition, gameplan, suivi de
        progression. Les formations sont des programmes vidéo approfondis, achetés à l'unité,
        avec un accès illimité. Les deux sont complémentaires : l'une structure ta semaine,
        les autres creusent une thématique à fond.
      </p>
    ),
  },
  {
    id: "youtube",
    q: "Pourquoi MMA IQ plutôt que YouTube ?",
    a: (
      <p>
        YouTube, c'est des milliers de vidéos sans ordre ni suivi. Ici, tu suis une méthode :
        des programmes structurés, conçus par des coachs validés, avec une progression que tu
        mesures séance après séance. Tu arrêtes de zapper, tu progresses.
      </p>
    ),
  },
  {
    id: "acces-formation",
    q: "Comment accéder à une formation achetée ?",
    a: (
      <p>
        Connecte-toi avec l'email utilisé à l'achat : ta formation t'attend dans{" "}
        <FaqLink to="/mes-formations">Mes formations</FaqLink>. Accès illimité, sur tous tes
        appareils.
      </p>
    ),
  },
  {
    id: "salle-membre",
    q: "Ma salle est partenaire : j'ai droit à quoi ?",
    a: (
      <p>
        Une remise sur ton abonnement : −20% pendant 3 mois au lancement. Passe par le lien
        ou le QR code de ta salle, la remise s'applique automatiquement à l'étape de
        paiement. Tout le programme est détaillé sur la page{" "}
        <FaqLink to="/partenaires">partenaires</FaqLink>.
      </p>
    ),
  },
  {
    id: "salle-devenir",
    q: "Je gère une salle ou un club : comment devenir partenaire ?",
    a: (
      <p>
        Via notre programme de parrainage : tu recommandes MMA IQ à tes adhérents — un QR
        code dans la salle suffit — et tu touches une commission sur chaque abonnement
        souscrit via ton lien, pendant que tes membres profitent d'une remise. Candidature en
        deux minutes sur la page <FaqLink to="/partenaires">partenaires</FaqLink>.
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
        Le paiement se fait par carte bancaire, via Stripe. Tes données bancaires ne
        transitent jamais par nos serveurs : tout est chiffré et géré par Stripe, référence
        mondiale du paiement en ligne.
      </p>
    ),
  },
  {
    id: "francais",
    q: "Les contenus sont-ils en français ?",
    a: (
      <p>
        Oui, 100% en français. Contenus tournés et montés par notre équipe avec des coachs
        francophones.
      </p>
    ),
  },
  {
    id: "dispo",
    q: "L'application mobile est-elle disponible ?",
    a: (
      <p>
        L'app iOS et Android arrive. Si ta salle est partenaire MMA IQ, tu peux déjà souscrire
        ton abonnement sur le web via son lien ou son QR code, avec la remise membre. Pour être prévenu du lancement mobile, inscris-toi sur la page{" "}
        <FaqLink to="/app#download">application</FaqLink>.
      </p>
    ),
  },
];
