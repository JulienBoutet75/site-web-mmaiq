// Identité figurant dans les statuts fournis ; l'immatriculation reste à vérifier.
// Conserver ici uniquement les informations de la société, sans données des associés.
export const LEGAL_COMPANY = {
  name: "MMA IQ APP",
  legalForm: "Société par actions simplifiée (SAS)",
  shareCapital: "5 000 €",
  registeredOffice: "173, rue de Courcelles, 75017 Paris, France",
  // La LCEN, article 1-1, requiert le nom du directeur de publication.
  // L'identité est volontairement omise dans cette version, qui reste à compléter.
  // https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000049568614
  publicationDirectorStatus: "identité non publiée dans cette version",
} as const;

// Date de mise à jour rédactionnelle, distincte de l'entrée en vigueur des CGV.
export const LEGAL_UPDATED_AT = "22 septembre 2026";
