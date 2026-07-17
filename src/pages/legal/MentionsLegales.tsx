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

export function MentionsLegales() {
  return (
    <div className="bg-[var(--color-bg-base)] text-white min-h-screen pt-32 pb-24 px-6">
      <Seo
        title="Mentions légales – MMA IQ"
        description="Mentions légales du site MMA IQ : éditeur, hébergeur, propriété intellectuelle."
        canonicalPath="/mentions-legales"
      />
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-display-lg uppercase tracking-wide leading-[0.95] mb-4">
          Mentions légales
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] font-body mb-12">
          Conformément à l'article 6-III de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans
          l'économie numérique (LCEN). Dernière mise à jour : <Todo>date de mise en ligne</Todo>.
        </p>

        <Article title="1. Éditeur du site">
          <p>
            Le site {SITE_URL} (ci-après « le Site ») est édité par :
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Raison sociale : <Todo>raison sociale de la société éditrice</Todo></li>
            <li>Forme juridique : <Todo>SAS, SASU, SARL…</Todo></li>
            <li>Capital social : <Todo>montant du capital social</Todo></li>
            <li>Siège social : <Todo>adresse complète du siège</Todo></li>
            <li>Immatriculation : <Todo>n° SIREN et ville du RCS</Todo></li>
            <li>N° de TVA intracommunautaire : <Todo>numéro de TVA</Todo></li>
            <li>
              Email de contact :{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-accent-primary)] hover:underline">
                {CONTACT_EMAIL}
              </a>
            </li>
          </ul>
          <p>
            Directeur de la publication : <Todo>nom du directeur de la publication (représentant légal)</Todo>.
          </p>
        </Article>

        <Article title="2. Hébergement">
          <p>
            Le Site est hébergé par : <Todo>raison sociale de l'hébergeur, adresse complète, numéro de
            téléphone</Todo>.
          </p>
          <p>
            Les données du Site (base de données, comptes utilisateurs, contenus vidéo) sont hébergées
            par Supabase, Inc., 970 Toa Payoh North #07-04, Singapore 318992 —{" "}
            <Todo>vérifier la région d'hébergement du projet Supabase et la mentionner (ex. Union
            européenne)</Todo>.
          </p>
        </Article>

        <Article title="3. Propriété intellectuelle">
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
        </Article>

        <Article title="4. Données personnelles et stockage local">
          <p>
            Le traitement des données personnelles collectées via le Site est décrit dans notre{" "}
            <Link to="/confidentialite" className="text-[var(--color-accent-primary)] hover:underline">
              Politique de confidentialité
            </Link>
            , qui détaille également l'usage du stockage local du navigateur (le Site n'utilise pas de
            cookies publicitaires).
          </p>
        </Article>

        <Article title="5. Contact">
          <p>
            Pour toute question relative au Site, vous pouvez nous écrire à{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-accent-primary)] hover:underline">
              {CONTACT_EMAIL}
            </a>{" "}
            ou via la page{" "}
            <Link to="/contact" className="text-[var(--color-accent-primary)] hover:underline">
              Contact
            </Link>
            .
          </p>
        </Article>

        <nav className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-x-6 gap-y-2 text-sm font-body">
          <Link to="/confidentialite" className="text-[var(--color-text-secondary)] hover:text-white transition-colors">
            Politique de confidentialité
          </Link>
          <Link to="/cgv" className="text-[var(--color-text-secondary)] hover:text-white transition-colors">
            CGV / CGU
          </Link>
        </nav>
      </div>
    </div>
  );
}
