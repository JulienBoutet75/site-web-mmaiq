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
//   - le code promo de chaque salle est créé automatiquement par le serveur
//     au premier checkout (ensureGymPromotion, server.ts), d'après la remise
//     configurée dans l'admin ; scripts/stripe-gym-code.mjs reste un secours


import "dotenv/config";
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY manquante dans .env");
  process.exit(1);
}
const stripe = new Stripe(key);
const mode = key.startsWith("sk_test_") ? "TEST" : "LIVE";

function requiredCents(name) {
  const value = Number(process.env[name]);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} doit contenir un prix positif en centimes`);
  }
  return value;
}

// Les valeurs proposées dans .env.example correspondent aux six premiers mois
// du simulateur commercial V1. Elles restent explicites pour éviter qu'un autre
// palier tarifaire soit publié par erreur.
const CATALOG = [
  { key: "essentiel", name: "MMA IQ — Essentiel", monthly: requiredCents("STRIPE_PRICE_ESSENTIEL_MONTHLY_CENTS"), yearly: requiredCents("STRIPE_PRICE_ESSENTIEL_YEARLY_CENTS") },
  { key: "performance", name: "MMA IQ — Performance", monthly: requiredCents("STRIPE_PRICE_PERFORMANCE_MONTHLY_CENTS"), yearly: requiredCents("STRIPE_PRICE_PERFORMANCE_YEARLY_CENTS") },
  { key: "elite", name: "MMA IQ — Elite", monthly: requiredCents("STRIPE_PRICE_ELITE_MONTHLY_CENTS"), yearly: requiredCents("STRIPE_PRICE_ELITE_YEARLY_CENTS") },
  { key: "coach_suite", name: "MMA IQ — Coach Suite", monthly: requiredCents("STRIPE_PRICE_COACH_SUITE_MONTHLY_CENTS"), yearly: requiredCents("STRIPE_PRICE_COACH_SUITE_YEARLY_CENTS") },
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
  const expectedAmount = interval === "monthly" ? plan.monthly : plan.yearly;
  if (existing.data.length > 0) {
    const price = existing.data[0];
    const expectedInterval = interval === "monthly" ? "month" : "year";
    if (
      price.active &&
      price.currency === "eur" &&
      price.unit_amount === expectedAmount &&
      price.recurring?.interval === expectedInterval
    ) {
      return price;
    }
    throw new Error(
      `Le lookup_key ${lookupKey} existe déjà avec un autre montant ou intervalle. ` +
      `Archive ou transfère ce Price Stripe avant de publier le nouveau palier.`
    );
  }
  return await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: expectedAmount,
    recurring: { interval: interval === "monthly" ? "month" : "year" },
    lookup_key: lookupKey,
    nickname: `${plan.name} (${interval === "monthly" ? "mensuel" : "annuel"})`,
    metadata: { plan_key: plan.key, interval },
  });
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

console.log("\nCatalogue prêt. Le serveur résout les prix par lookup_key — aucun ID à copier.");
