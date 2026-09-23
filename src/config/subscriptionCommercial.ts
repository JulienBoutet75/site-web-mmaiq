export type SubscriptionPlanKey = "essentiel" | "performance" | "elite" | "coach_suite";
export type PricingPhaseKey = "launch_months_1_6" | "launch_months_7_12" | "stabilized_year_2";

type PlanPrice = {
  monthlyCents: number;
  yearlyCents: number;
};

type PricingPhase = {
  label: string;
  prices: Record<SubscriptionPlanKey, PlanPrice>;
};

// Source : MMA_IQ_Simulateur_Remuneration_Commerciale_Partenariat_V1.xlsx.
// Les périodes sont relatives au lancement commercial. Leur bascule ne doit pas
// être automatisée avant d'avoir fixé la date de lancement et le traitement des
// abonnements déjà souscrits.
export const SUBSCRIPTION_PRICING_PHASES: Record<PricingPhaseKey, PricingPhase> = {
  launch_months_1_6: {
    label: "Offre de lancement · mois 1 à 6",
    prices: {
      essentiel: { monthlyCents: 699, yearlyCents: 6999 },
      performance: { monthlyCents: 1099, yearlyCents: 10999 },
      elite: { monthlyCents: 2099, yearlyCents: 20999 },
      coach_suite: { monthlyCents: 2099, yearlyCents: 20999 },
    },
  },
  launch_months_7_12: {
    label: "Transition · mois 7 à 12",
    prices: {
      essentiel: { monthlyCents: 799, yearlyCents: 7999 },
      performance: { monthlyCents: 1299, yearlyCents: 12999 },
      elite: { monthlyCents: 2599, yearlyCents: 25999 },
      coach_suite: { monthlyCents: 2599, yearlyCents: 25999 },
    },
  },
  stabilized_year_2: {
    label: "Tarifs stabilisés · à partir du mois 13",
    prices: {
      essentiel: { monthlyCents: 999, yearlyCents: 9999 },
      performance: { monthlyCents: 1599, yearlyCents: 15999 },
      elite: { monthlyCents: 2999, yearlyCents: 29999 },
      coach_suite: { monthlyCents: 2999, yearlyCents: 29999 },
    },
  },
};

export const ACTIVE_PRICING_PHASE_KEY: PricingPhaseKey = "launch_months_1_6";
export const ACTIVE_PRICING = SUBSCRIPTION_PRICING_PHASES[ACTIVE_PRICING_PHASE_KEY];

export const CLUB_OFFER_REFERENCE = {
  discountPercent: 10,
  discountEligiblePlanKeys: ["performance", "elite"] as const,
  clubCommissionRate: 0.1,
  salesCommissionRate: 0.1,
  // Le tableur applique la part commerciale après la part du club : 10 % × 90 % = 9 % du brut.
  salesCommissionBase: "after_club_commission" as const,
};

export function formatEuroCents(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function isClubDiscountEligible(planKey: string): boolean {
  return CLUB_OFFER_REFERENCE.discountEligiblePlanKeys.some((key) => key === planKey);
}

/**
 * Nom affiché et crédits IA mensuels de chaque formule. Les crédits sont les
 * quotas appliqués par l'app (lab-service, app.credits) : les deux listes
 * doivent rester identiques.
 */
export const PLAN_DETAILS: Record<SubscriptionPlanKey | "free", { name: string; creditsPerMonth: number }> = {
  free: { name: "Free", creditsPerMonth: 5 },
  essentiel: { name: "Essentiel", creditsPerMonth: 30 },
  performance: { name: "Performance", creditsPerMonth: 80 },
  elite: { name: "Elite", creditsPerMonth: 200 },
  coach_suite: { name: "Coach Suite", creditsPerMonth: 150 },
};

const PLAN_KEYS: readonly SubscriptionPlanKey[] = ["essentiel", "performance", "elite", "coach_suite"];

/**
 * Clé de formule depuis une valeur reçue d'ailleurs : clé du site, valeur de
 * l'app (`essential`, `ESSENTIAL`, `COACH_SUITE`…) ou lookup key Stripe
 * (`performance_monthly`). Null si inconnue.
 */
export function normalizePlanKey(value: string | null | undefined): SubscriptionPlanKey | null {
  if (!value) return null;
  const key = value.trim().toLowerCase().replace(/_(monthly|yearly)$/, "");
  if (key === "essential") return "essentiel";
  return (PLAN_KEYS as readonly string[]).includes(key) ? (key as SubscriptionPlanKey) : null;
}
