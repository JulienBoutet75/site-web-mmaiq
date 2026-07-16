// Crée le code promo Stripe d'une salle partenaire (remise adhérent).
// Le code promo = le code de la salle (créé dans l'admin du site), rattaché
// au coupon "gym20x3" (−20 % pendant 3 mois, cf. stripe-bootstrap.mjs).
//
//   node scripts/stripe-gym-code.mjs GRACIELYON
//
// Restriction "premier achat uniquement" activée : un abonné existant ne
// peut pas re-consommer la remise (anti-abus). Le serveur applique ce code
// automatiquement quand l'adhérent passe par mmaiq.fr/s/{slug}.

import "dotenv/config";
import Stripe from "stripe";

const code = (process.argv[2] || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
if (!/^[A-Z0-9]{3,14}$/.test(code)) {
  console.error("Usage : node scripts/stripe-gym-code.mjs <CODE_SALLE>  (3-14 caractères A-Z 0-9)");
  process.exit(1);
}

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY manquante dans .env");
  process.exit(1);
}
const stripe = new Stripe(key);

const existing = await stripe.promotionCodes.list({ code, limit: 1 });
if (existing.data.length > 0) {
  const pc = existing.data[0];
  console.log(`Le code promo ${code} existe déjà (${pc.active ? "actif" : "INACTIF"}, id ${pc.id}).`);
  process.exit(0);
}

const pc = await stripe.promotionCodes.create({
  promotion: { type: "coupon", coupon: "gym20x3" },
  code,
  restrictions: { first_time_transaction: true },
});
console.log(`✓ Code promo ${pc.code} créé (−20 % pendant 3 mois, premier achat uniquement).`);
