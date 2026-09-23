/**
 * Référentiel Academy partagé par le catalogue, la fiche formation et le profil coach.
 * Les formations Supabase portent une `discipline` (striking, grappling, mma-gameplan…) ;
 * la maquette V3 les regroupe en trois catégories affichées sur /academy.
 */

export type AcademyCategoryId = "striking" | "grappling" | "strategie";

export type AcademyCategory = {
  id: AcademyCategoryId;
  number: string;
  /** Nom affiché (« Grappling », « MMA & stratégie »). */
  title: string;
  /** Phrase de la ligne du catalogue. */
  text: string;
  /** Phrase d’ouverture de la fenêtre de catégorie. */
  summary: string;
  /** Libellé du bouton de la ligne. */
  cta: string;
};

export const ACADEMY_CATEGORIES: AcademyCategory[] = [
  {
    id: "striking",
    number: "01",
    title: "Striking",
    text: "Appuis, distance, précision. Comprendre ce qui rend tes frappes efficaces.",
    summary: "Appuis, distance et précision des frappes.",
    cta: "Explorer le striking",
  },
  {
    id: "grappling",
    number: "02",
    title: "Grappling",
    text: "Contrôler la position, créer les ouvertures et connecter les transitions.",
    summary: "Contrôle, transitions et travail au sol.",
    cta: "Explorer le grappling",
  },
  {
    id: "strategie",
    number: "03",
    title: "MMA & stratégie",
    text: "Relier les disciplines et construire un plan de combat cohérent.",
    summary: "Lecture du combat, transitions et construction d’un gameplan.",
    cta: "Explorer la stratégie",
  },
];

/** Libellés des disciplines stockées en base (FormationModal). */
export const DISCIPLINE_LABELS: Record<string, string> = {
  striking: "Striking",
  grappling: "Grappling",
  "mma-gameplan": "MMA Gameplan",
  "prepa-mentale": "Prépa mentale",
  "cut-nutrition": "Cut & nutrition",
  conditioning: "Conditioning",
};

/** Niveaux stockés en minuscules en base. */
export const LEVEL_LABELS: Record<string, string> = {
  debutant: "Débutant",
  amateur: "Amateur",
  pro: "Pro",
};

/** Striking et grappling ont leur catégorie ; les autres disciplines rejoignent « MMA & stratégie ». */
export function categoryOf(discipline?: string | null): AcademyCategoryId {
  if (discipline === "striking") return "striking";
  if (discipline === "grappling") return "grappling";
  return "strategie";
}

export function disciplineLabel(discipline?: string | null) {
  if (!discipline) return "";
  return DISCIPLINE_LABELS[discipline] ?? discipline;
}

export function levelLabel(level?: string | null) {
  if (!level) return "";
  return LEVEL_LABELS[level.toLowerCase()] ?? level;
}

/** Prix en euros depuis `price_cents` : « 49 € », « 79,90 € ». */
export function formatPrice(priceCents?: number | null) {
  const euros = (priceCents ?? 0) / 100;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number.isInteger(euros) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(euros);
}

/** Durée stockée en minutes (« 90m ») → « 1 h 30 » ; autre format laissé tel quel. */
export function formatDuration(duration?: string | null) {
  if (!duration) return "";
  const match = /^(\d+)\s*m(in)?$/i.exec(duration.trim());
  if (!match) return duration;
  const minutes = Number(match[1]);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${String(rest).padStart(2, "0")}` : `${hours} h`;
}

/** Adresse de la fiche formation. */
export const formationPath = (formation: { slug?: string | null; id?: string | number }) =>
  `/academy/${formation.slug || formation.id}`;
