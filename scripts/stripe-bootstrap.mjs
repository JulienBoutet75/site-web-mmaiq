// Bootstrap du catalogue Stripe pour les abonnements MMA IQ.
// Idempotent : relançable sans dupliquer (produits à id fixe, prix par
// lookup_key, coupon à id fixe). Fonctionne en mode test comme en live
// selon la clé STRIPE_SECRET_KEY du .env.
//
//   node scripts/stripe-bootstrap.mjs
//
// Crée :
//   - 4 produits (Essentiel / Performance / Elite / Coach Suite)
//   - 8 prix EUR récurrents (mensuel + annuel), lookup_key = "<plan>_<intervalle>"
//   - le coupon partenaire "gym20x3" (−20 % pendant 3 mois)
//   - un code promo par salle se crée ensuite depuis l'admin (Phase 1)

import "dotenv/config";
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY manquante dans .env");
  process.exit(1);
}
const stripe = new Stripe(key);
const mode = key.startsWith("sk_test_") ? "TEST" : "LIVE";

// Mêmes prix que le paywall in-app (mma_perf_lab) et PricingSection.tsx.
const CATALOG = [
  { key: "essentiel", name: "MMA IQ — Essentiel", monthly: 599, yearly: 5990 },
  { key: "performance", name: "MMA IQ — Performance", monthly: 999, yearly: 9990 },
  { key: "elite", name: "MMA IQ — Elite", monthly: 1999, yearly: 19990 },
  { key: "coach_suite", name: "MMA IQ — Coach Suite", monthly: 1999, yearly: 19990 },
];

async function ensureProduct(plan) {
  const id = `mmaiq_${plan.key}`;
  try {
    return await stripe.products.create({
      id,
      name: plan.name,
      metadata: { plan_key: plan.key },
    });
  } catch (e) {
    if (e?.code === "resource_already_exists") {
      return await stripe.products.retrieve(id);
    }
    throw e;
  }
}

async function ensurePrice(product, plan, interval) {
  const lookupKey = `${plan.key}_${interval}`;
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  if (existing.data.length > 0) return existing.data[0];
  return await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: interval === "monthly" ? plan.monthly : plan.yearly,
    recurring: { interval: interval === "monthly" ? "month" : "year" },
    lookup_key: lookupKey,
    nickname: `${plan.name} (${interval === "monthly" ? "mensuel" : "annuel"})`,
    metadata: { plan_key: plan.key, interval },
  });
}

async function ensureGymCoupon() {
  const id = "gym20x3";
  try {
    return await stripe.coupons.create({
      id,
      percent_off: 20,
      duration: "repeating",
      duration_in_months: 3,
      name: "Partenaire salle −20 % (3 mois)",
    });
  } catch (e) {
    if (e?.code === "resource_already_exists") {
      return await stripe.coupons.retrieve(id);
    }
    throw e;
  }
}

console.log(`Bootstrap Stripe en mode ${mode}…\n`);

for (const plan of CATALOG) {
  const product = await ensureProduct(plan);
  const m = await ensurePrice(product, plan, "monthly");
  const y = await ensurePrice(product, plan, "yearly");
  console.log(
    `✓ ${plan.name}  →  ${(m.unit_amount / 100).toFixed(2)} €/mois (${m.lookup_key})  ·  ${(y.unit_amount / 100).toFixed(2)} €/an (${y.lookup_key})`
  );
}

const coupon = await ensureGymCoupon();
console.log(`✓ Coupon partenaire "${coupon.id}" : −${coupon.percent_off} % pendant ${coupon.duration_in_months} mois`);

console.log("\nCatalogue prêt. Le serveur résout les prix par lookup_key — aucun ID à copier.");
