// Crée le code promo Stripe d'une salle partenaire (remise adhérent).
// Le code promo = le code de la salle (créé dans l'admin du site), rattaché
// à un coupon dont le taux et la durée sont fournis explicitement.
//
//   node scripts/stripe-gym-code.mjs GRACIELYON 6 10
//
// Restriction "premier achat uniquement" activée : un abonné existant ne
// peut pas re-consommer la remise (anti-abus). Le serveur applique ce code
// automatiquement quand l'adhérent passe par mmaiq.fr/s/{slug}.

import "dotenv/config";
import Stripe from "stripe";

const code = (process.argv[2] || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const months = Number(process.argv[3]);
const percent = Number(process.argv[4] ?? 10);
if (!/^[A-Z0-9]{3,14}$/.test(code) || !Number.isInteger(months) || months < 1 || months > 24 || !Number.isInteger(percent) || percent < 1 || percent > 100) {
  console.error("Usage : node scripts/stripe-gym-code.mjs <CODE_SALLE> <DUREE_MOIS_1_24> [REMISE_PCT_1_100]");
  process.exit(1);
}

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY manquante dans .env");
  process.exit(1);
}
const stripe = new Stripe(key);
const couponId = `gym${percent}x${months}`;

const existing = await stripe.promotionCodes.list({ code, active: true, limit: 1 });
if (existing.data.length > 0) {
  const pc = existing.data[0];
  const rawCoupon = pc.promotion?.coupon;
  const coupon = typeof rawCoupon === "string" ? await stripe.coupons.retrieve(rawCoupon) : rawCoupon;
  if (
    coupon?.percent_off === percent &&
    coupon.duration === "repeating" &&
    coupon.duration_in_months === months
  ) {
    console.log(`Le code promo ${code} est déjà actif avec la bonne offre (id ${pc.id}).`);
    process.exit(0);
  }
  await stripe.promotionCodes.update(pc.id, { active: false });
}

try {
  await stripe.coupons.retrieve(couponId);
} catch {
  await stripe.coupons.create({
    id: couponId,
    percent_off: percent,
    duration: "repeating",
    duration_in_months: months,
    name: `Partenaire salle −${percent} % (${months} mois)`,
  });
}

const pc = await stripe.promotionCodes.create({
  promotion: { type: "coupon", coupon: couponId },
  code,
  restrictions: { first_time_transaction: true },
});
console.log(`✓ Code promo ${pc.code} créé (−${percent} % pendant ${months} mois, premier achat uniquement).`);
