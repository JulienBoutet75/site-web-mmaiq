// Collection Bar Tack × MMA IQ — contenu des pages Équipement (Figma « 05 · Équipement »).
// Modifier ici les catégories : la liste de /equipement, les fiches /equipement/:slug
// et le formulaire /equipement/demande se mettent à jour automatiquement.

export type EquipementCategorie = {
  /** Segment d’URL de la fiche : /equipement/<slug>. */
  slug: string;
  /** Repère affiché devant le nom (« 01 »). */
  number: string;
  name: string;
  /** Phrase d’accroche sous le nom, dans la liste de la collection. */
  text: string;
  /** Description SEO de la fiche. */
  seoDescription: string;
};

export const EQUIPEMENT_CATEGORIES: EquipementCategorie[] = [
  {
    slug: "vetements",
    number: "01",
    name: "Vêtements",
    text: "Pour s’entraîner et porter les couleurs MMA IQ.",
    seoDescription: "Vêtements Bar Tack × MMA IQ : pour s’entraîner et porter les couleurs MMA IQ. Précise ton besoin, on te répond sur les modèles, tailles et disponibilités.",
  },
  {
    slug: "protections",
    number: "02",
    name: "Protections",
    text: "Le matériel qui accompagne ta pratique.",
    seoDescription: "Protections Bar Tack × MMA IQ : le matériel qui accompagne ta pratique. Précise ton besoin, on te répond sur les modèles, tailles et disponibilités.",
  },
  {
    slug: "accessoires",
    number: "03",
    name: "Accessoires",
    text: "Les essentiels autour de ta séance.",
    seoDescription: "Accessoires Bar Tack × MMA IQ : les essentiels autour de ta séance. Précise ton besoin, on te répond sur les modèles, tailles et disponibilités.",
  },
];

export function findEquipementCategorie(slug: string | null | undefined) {
  if (!slug) return undefined;
  return EQUIPEMENT_CATEGORIES.find((categorie) => categorie.slug === slug);
}
